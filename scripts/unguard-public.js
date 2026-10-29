// Remove injected guards from intentionally-public routes.
const fs = require("fs");

const whole = [
  "src/app/api/appointments/check-availability/route.ts",
  "src/app/api/forms/submit/route.ts",
  "src/app/api/onboarding/validate-token/route.ts",
  "src/app/api/onboarding/save/route.ts",
  "src/app/api/invoices/get-by-token/route.ts",
  "src/app/api/payments/stripe/create-session/route.ts",
];
const blockRe =
  /\r?\n    try \{\r?\n      await (?:requireStaff|requireRole)\([^;]*\);\r?\n    \} catch \(err\) \{\r?\n      return authErrorResponse\(err\);\r?\n    \}/g;

for (const f of whole) {
  let s = fs.readFileSync(f, "utf8");
  s = s.replace(blockRe, "");
  if (!s.includes("requireStaff(") && !s.includes("requireRole(")) {
    s = s.replace(
      /import \{ requireStaff, requireRole, authErrorResponse \} from "@\/lib\/serverAuth";\n/,
      ""
    );
    if (!s.includes("await headers()")) {
      s = s.replace(/import \{ headers \} from "next\/headers";\n/, "");
    }
  }
  fs.writeFileSync(f, s);
  console.log("cleaned", f);
}

function removeGuardIn(f, fnName) {
  let s = fs.readFileSync(f, "utf8");
  const fnIdx = s.indexOf(`export async function ${fnName}(`);
  if (fnIdx === -1) {
    console.log("NOT FOUND", f, fnName);
    return;
  }
  const nextFn = s.indexOf("export async function", fnIdx + 10);
  const end = nextFn === -1 ? s.length : nextFn;
  let seg = s.slice(fnIdx, end);
  const newSeg = seg.replace(blockRe, "");
  s = s.slice(0, fnIdx) + newSeg + s.slice(end);
  fs.writeFileSync(f, s);
  console.log("partial", f, fnName, seg !== newSeg ? "removed" : "NO MATCH");
}

removeGuardIn("src/app/api/contact/route.ts", "POST");
removeGuardIn("src/app/api/settings/blocked-dates/route.ts", "GET");
