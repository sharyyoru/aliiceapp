/**
 * Re-run migrations that failed during the first apply pass (ordering
 * dependencies + one syntax typo, now fixed).
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = resolve(__dirname, "../.env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.NEW_PROJECT_REF;
if (!TOKEN || !REF) { console.error("Set SUPABASE_ACCESS_TOKEN and NEW_PROJECT_REF"); process.exit(1); }

const FILES = [
  "supabase/migrations/20261118_providers_role_billing_columns.sql",
  // deps created later in the original pass, now present
  "supabase/migrations/001_create_patient_health_background.sql",
  "supabase/migrations/004_consultation_data_and_storage.sql",
  "supabase/migrations/006_cleanup_workflow_enrollments_by_service.sql",
  "supabase/migrations/20241212_fix_intake_unique_constraints.sql",
  // booking_* chain (20260410 had a syntax typo — fixed)
  "supabase/migrations/20260410_create_booking_doctors.sql",
  "supabase/migrations/20260408_add_skip_treatment_to_booking_categories.sql",
  "supabase/migrations/20260410_seed_treatment_doctor_assignments.sql",
  "supabase/migrations/20260414_reassign_first_time_treatment_doctors.sql",
  "supabase/migrations/20260414_upsert_treatments_and_assign_doctors.sql",
  "supabase/migrations/20260415_assign_existing_patient_doctors.sql",
  "supabase/migrations/20260415_assign_first_time_patient_doctors.sql",
  "supabase/migrations/20260415_remove_noncanonical_existing_patient_treatments.sql",
  "supabase/migrations/20260415_remove_noncanonical_new_patient_treatments.sql",
  "supabase/migrations/20260507_booking_treatment_prepayment.sql",
  "supabase/migrations/20260519_booking_names_en.sql",
  // misc dependency-order failures
  "supabase/migrations/20260601_automatic_user_setup.sql",
  "supabase/migrations/20260703_client_invoices_payment_method.sql",
  "supabase/migrations/20260703_rename_admin_email_charline.sql",
  "supabase/migrations/20261021_rls_lockdown_authenticated.sql",
];

const query = async (sql) => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.slice(0, 400)}`);
};

const main = async () => {
  let failed = 0;
  for (const f of FILES) {
    process.stdout.write(`${f} … `);
    try {
      await query(readFileSync(f, "utf8"));
      console.log("ok");
    } catch (e) {
      failed++;
      console.log(`FAILED — ${e.message.split("\n")[0]}`);
    }
  }
  console.log(failed ? `${failed} still failing` : "All fixed");
};

main().catch((e) => { console.error(e); process.exit(1); });
