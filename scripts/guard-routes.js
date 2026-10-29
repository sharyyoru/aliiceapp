// One-off codemod: inject server-side auth guards into API route handlers.
// Usage: node scripts/guard-routes.js [--dry-run]
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "src", "app", "api");
const DRY = process.argv.includes("--dry-run");

const PUBLIC_PREFIXES = [
  "public/",
  "webhooks/",
  "cron/",
  "health/",
];
const PUBLIC_EXACT_ROOT = new Set(["me"]);
const PUBLIC_EXACT = new Set([
  "settings/booking-categories",
  "settings/booking-doctor-assignments",
  "settings/booking-doctors",
  "settings/booking-treatments",
  "online-bookings",
  "payments/payrexx-webhook",
  "payments/check-payrexx-status",
  "payments/create-payrexx-gateway",
  "payments/stripe/webhook",
  "payments/stripe/create-booking-deposit-session",
  "invoices/public/[token]",
  "emails/webhook",
  "emails/inbound/mailgun",
  "whatsapp/webhook",
  "automations/webhook",
  "crisalix/oauth/callback",
  "admin/auth",
  "admin/gmail/callback",
]);
const ADMIN_PREFIX = "admin/";

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === "route.ts") out.push(p);
  }
  return out;
}

// Find the end of a balanced group starting at index i (opening char at i).
function matchGroup(src, i, open, close) {
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return j;
    } else if (c === '"' || c === "'" || c === "`") {
      // skip string/template literals
      const q = c;
      j++;
      while (j < src.length && src[j] !== q) {
        if (src[j] === "\\") j++;
        j++;
      }
    }
  }
  return -1;
}

// Insert guard after the opening brace of each exported HTTP handler.
// Returns { src, count, needsRequest } or null reason.
function injectGuards(src, guardFor) {
  const re = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|HEAD)\s*\(/g;
  let count = 0;
  const manual = [];
  const inserts = []; // {pos, text}
  let m;
  while ((m = re.exec(src))) {
    const parenStart = m.index + m[0].length - 1;
    const parenEnd = matchGroup(src, parenStart, "(", ")");
    if (parenEnd === -1) { manual.push(m[1]); continue; }
    // first param name
    const params = src.slice(parenStart + 1, parenEnd).trim();
    const firstParam = params.split(",")[0].trim();
    const nameMatch = firstParam.match(/^([A-Za-z_$][A-Za-z0-9_$]*)/);
    const reqName = nameMatch ? nameMatch[1] : null;
    // find body opening brace after parenEnd (may have return type `: ...` )
    let k = parenEnd + 1;
    while (k < src.length && src[k] !== "{") {
      if (src[k] === ";") break; // declaration only
      k++;
    }
    if (k >= src.length || src[k] !== "{") { manual.push(m[1]); continue; }
    inserts.push({ pos: k + 1, text: guardFor(reqName, m[1]) });
    count++;
  }
  // apply from end to start
  inserts.sort((a, b) => b.pos - a.pos);
  for (const ins of inserts) {
    src = src.slice(0, ins.pos) + ins.text + src.slice(ins.pos);
  }
  return { src, count, manual };
}

function addImport(src, importLine) {
  if (src.includes(importLine)) return src;
  const matches = [...src.matchAll(/^import[^;]*;[ \t]*$/gm)];
  if (matches.length) {
    const last = matches[matches.length - 1];
    const pos = last.index + last[0].length;
    return src.slice(0, pos) + "\n" + importLine + src.slice(pos);
  }
  return importLine + "\n" + src;
}

const results = { public: [], adminFixed: [], staffGuarded: [], manual: [], skipped: [] };

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/").replace(/\/route\.ts$/, "");
  let src = fs.readFileSync(file, "utf8");
  const orig = src;

  const isPublic =
    PUBLIC_EXACT.has(rel) ||
    PUBLIC_EXACT_ROOT.has(rel) ||
    PUBLIC_PREFIXES.some((p) => rel.startsWith(p));
  if (isPublic) { results.public.push(rel); continue; }

  const isAdmin = rel.startsWith(ADMIN_PREFIX);

  if (isAdmin) {
    // Replace insecure local verifyAdmin (base64 "admin:" prefix) with shared HMAC check.
    if (/function\s+verifyAdmin\s*\(/.test(src)) {
      src = src.replace(
        /async function verifyAdmin\(\)\s*\{[\s\S]*?\n\}/,
        ""
      );
      src = addImport(src, 'import { verifyAdminSession as verifyAdmin } from "@/lib/adminSession";');
    } else if (!src.includes("verifyAdminSession")) {
      const r = injectGuards(src, () =>
        '\n    if (!(await verifyAdminSession())) {\n      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });\n    }'
      );
      src = r.src;
      src = addImport(src, 'import { verifyAdminSession } from "@/lib/adminSession";');
      if (r.manual.length) results.manual.push(`${rel} (handlers: ${r.manual.join(",")})`);
    }
    if (src !== orig && !DRY) fs.writeFileSync(file, src);
    results.adminFixed.push(rel);
    continue;
  }

  if (src.includes("requireStaff") || src.includes("requireRole")) {
    results.skipped.push(rel + " (already guarded)");
    continue;
  }

  const needsAdminRole = rel.startsWith("users/") || rel.startsWith("debug/") || rel.startsWith("migrations/");
  const r = injectGuards(src, (reqName) => {
    const arg = reqName || "(await headers())";
    const call = needsAdminRole ? `requireRole(${arg}, ["admin"])` : `requireStaff(${arg})`;
    return `\n    try {\n      await ${call};\n    } catch (err) {\n      return authErrorResponse(err);\n    }`;
  });
  src = r.src;
  if (r.count > 0) {
    src = addImport(src, 'import { requireStaff, requireRole, authErrorResponse } from "@/lib/serverAuth";');
    if (src.includes("(await headers())")) {
      src = addImport(src, 'import { headers } from "next/headers";');
    }
    if (src !== orig && !DRY) fs.writeFileSync(file, src);
    results.staffGuarded.push(`${rel} (${r.count} handlers)`);
  } else {
    results.manual.push(rel + " (no exported handlers found)");
  }
  if (r.manual.length) results.manual.push(`${rel} handlers: ${r.manual.join(",")}`);
}

console.log("== PUBLIC (skipped) =="); results.public.forEach((x) => console.log("  " + x));
console.log("== ADMIN FIXED =="); results.adminFixed.forEach((x) => console.log("  " + x));
console.log(`== STAFF-GUARDED (${results.staffGuarded.length}) ==`); results.staffGuarded.forEach((x) => console.log("  " + x));
console.log("== ALREADY GUARDED =="); results.skipped.forEach((x) => console.log("  " + x));
console.log("== NEEDS MANUAL REVIEW =="); results.manual.forEach((x) => console.log("  " + x));
