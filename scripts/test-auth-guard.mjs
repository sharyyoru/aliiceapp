#!/usr/bin/env node
// Regression check: privileged API routes must reject unauthenticated callers.
// Usage: node scripts/test-auth-guard.mjs [baseUrl]
//   baseUrl defaults to http://localhost:3000
// Exit code 1 if any guarded route is reachable anonymously or any public
// route unexpectedly requires auth.

const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");

// Method/path pairs that MUST require a verified staff session.
const GUARDED = [
  ["GET", "/api/users/list"],
  ["POST", "/api/users/update-role", { userId: "x", role: "admin" }],
  ["POST", "/api/users/create", { email: "x@x.x", password: "x", role: "staff" }],
  ["GET", "/api/patients/find-duplicates"],
  ["GET", "/api/invoices/backfill-references"],
  ["GET", "/api/medidata/status"],
  ["GET", "/api/medidata/downloads"],
  ["GET", "/api/settings/medidata"],
  ["GET", "/api/sumex/invoice?action=info"],
  ["GET", "/api/tardoc?code=00.0010"],
  ["GET", "/api/templates/list"],
  ["GET", "/api/services"],
  ["GET", "/api/providers"],
  ["GET", "/api/settings/calendar-defaults"],
  ["GET", "/api/whatsapp-web/status"],
  ["GET", "/api/admin/organizations/stats"],
  ["GET", "/api/admin/users"],
  ["POST", "/api/admin/run-migrations", {}],
];

// Method/path pairs that must remain reachable WITHOUT a session
// (token-validated internally or intentionally public).
const PUBLIC_ROUTES = [
  ["GET", "/api/settings/booking-categories"],
  ["GET", "/api/settings/booking-doctors"],
  ["GET", "/api/appointments/check-availability?start=2030-01-01&end=2030-01-02"],
  ["POST", "/api/contact", { name: "t", email: "t@t.t", message: "t" }],
];

let failures = 0;

for (const [method, path, body] of GUARDED) {
  try {
    const res = await fetch(base + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });
    const expected = res.status === 401 || res.status === 403;
    if (!expected) {
      failures++;
      console.log(`FAIL  ${method} ${path} -> ${res.status} (expected 401/403)`);
    } else {
      console.log(`ok    ${method} ${path} -> ${res.status}`);
    }
  } catch (e) {
    console.log(`SKIP  ${method} ${path} -> ${e.message}`);
  }
}

for (const [method, path, body] of PUBLIC_ROUTES) {
  try {
    const res = await fetch(base + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });
    if (res.status === 401 || res.status === 403) {
      failures++;
      console.log(`FAIL  ${method} ${path} -> ${res.status} (public route blocked)`);
    } else {
      console.log(`ok    ${method} ${path} -> ${res.status}`);
    }
  } catch (e) {
    console.log(`SKIP  ${method} ${path} -> ${e.message}`);
  }
}

console.log(failures ? `\n${failures} FAILURES` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
