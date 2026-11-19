/** One-off: apply schema pieces missing on the NEW demo Supabase project. */
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
const query = async (sql) => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
  return body;
};

const statements = [
  `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_group_id uuid`,
  `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS machine_ids uuid[]`,
  `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS title text`,
  `ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_vip boolean DEFAULT false`,
  `ALTER TABLE patients ADD COLUMN IF NOT EXISTS language_preference text`,
  `ALTER TABLE patients ADD COLUMN IF NOT EXISTS lifecycle_stage text`,
  `ALTER TABLE patients ADD COLUMN IF NOT EXISTS source text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id uuid`,
  `ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'workflow'`,
  // Booking flow tables (idempotent creates; reference booking_* tables if present)
  `CREATE TABLE IF NOT EXISTS booking_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL, description text, image_url text, slug text UNIQUE,
    enabled boolean NOT NULL DEFAULT true, order_index integer NOT NULL DEFAULT 0,
    skip_treatment boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS booking_treatments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid REFERENCES booking_categories(id) ON DELETE CASCADE,
    name text NOT NULL, description text, price numeric(12,2), duration_minutes integer,
    machine_id uuid, image_url text, slug text UNIQUE,
    enabled boolean NOT NULL DEFAULT true, order_index integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS booking_doctors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL, specialty text, image_url text, description text,
    slug text UNIQUE NOT NULL, enabled boolean NOT NULL DEFAULT true,
    order_index integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS booking_treatment_doctors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_id uuid NOT NULL REFERENCES booking_treatments(id) ON DELETE CASCADE,
    doctor_id uuid NOT NULL REFERENCES booking_doctors(id) ON DELETE CASCADE,
    order_index integer NOT NULL DEFAULT 0,
    UNIQUE(treatment_id, doctor_id)
  )`,
  `CREATE TABLE IF NOT EXISTS booking_category_doctors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL REFERENCES booking_categories(id) ON DELETE CASCADE,
    doctor_id uuid NOT NULL REFERENCES booking_doctors(id) ON DELETE CASCADE,
    order_index integer NOT NULL DEFAULT 0,
    UNIQUE(category_id, doctor_id)
  )`,
];

const main = async () => {
  for (const sql of statements) {
    const label = sql.slice(0, 70).replace(/\s+/g, " ");
    process.stdout.write(`${label}… `);
    try { await query(sql); console.log("ok"); }
    catch (e) { console.log(`FAILED — ${e.message.split("\n")[0]}`); }
  }
};
main().catch((e) => { console.error(e.message); process.exit(1); });
