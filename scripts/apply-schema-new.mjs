/**
 * Apply schema.sql + all migrations + seed.sql to a NEW Supabase project
 * via the Supabase Management API (no psql needed).
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_... NEW_PROJECT_REF=abcdefghij node scripts/apply-schema-new.mjs
 *
 * Get a Personal Access Token at https://supabase.com/dashboard/account/tokens
 * Project ref = the subdomain of your new project URL.
 */

import { readFileSync, readdirSync } from "node:fs";

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.NEW_PROJECT_REF;
if (!TOKEN || !REF) {
  console.error("Set SUPABASE_ACCESS_TOKEN and NEW_PROJECT_REF");
  process.exit(1);
}

const query = async (sql) => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.slice(0, 500)}`);
  return body;
};

const files = [
  "supabase/schema.sql",
  ...readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort().map((f) => `supabase/migrations/${f}`),
  "supabase/seed.sql",
];

const main = async () => {
  for (const f of files) {
    const sql = readFileSync(f, "utf8");
    process.stdout.write(`${f} … `);
    try {
      await query(sql);
      console.log("ok");
    } catch (e) {
      console.log(`FAILED — ${e.message.split("\n")[0]}`);
      console.log("  (continuing; most migrations are written to be re-runnable)");
    }
  }
  console.log("Schema apply finished.");
};

main().catch((e) => { console.error(e.message || e); process.exit(1); });
