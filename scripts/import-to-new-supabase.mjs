/**
 * Import dumps/ (from export-old-data.mjs) into the NEW Supabase project.
 *
 * - Recreates auth users, preserving IDs when GoTrue allows it; every user
 *   gets password TEMP_PASSWORD (default: aliiceapp001).
 * - Imports every table in multi-pass order (FK failures retried later passes).
 * - Remaps *_user_id columns when an auth user got a new ID.
 *
 * Usage:
 *   NEW_SUPABASE_URL=https://xyz.supabase.co NEW_SERVICE_KEY=... node scripts/import-to-new-supabase.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, existsSync } from "node:fs";

const URL = process.env.NEW_SUPABASE_URL;
const KEY = process.env.NEW_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEMP_PASSWORD = process.env.TEMP_PASSWORD || "aliiceapp001";
if (!URL || !KEY) { console.error("Set NEW_SUPABASE_URL and NEW_SERVICE_KEY"); process.exit(1); }

const db = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const DIR = "dumps";
const BATCH = 200;
const MAX_PASSES = 8;

const fail = (m, e) => console.error(`  ✗ ${m}: ${e}`);

// ── auth users ───────────────────────────────────────────────────────────────
async function importAuthUsers() {
  const file = `${DIR}/auth_users.json`;
  const idMap = {}; // old id -> new id
  if (!existsSync(file)) return idMap;

  const users = JSON.parse(readFileSync(file, "utf8"));
  for (const u of users) {
    const base = {
      email: u.email, phone: u.phone || undefined,
      password: TEMP_PASSWORD, email_confirm: true, phone_confirm: !!u.phone,
      user_metadata: u.user_metadata || {},
    };
    let created = null;
    // Try preserving the original id (supported by newer GoTrue)
    const attempt = await db.auth.admin.createUser({ id: u.id, ...base });
    if (!attempt.error) {
      created = attempt.data.user;
    } else {
      const retry = await db.auth.admin.createUser(base);
      if (retry.error) {
        // user may already exist
        const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
        created = list?.users?.find((x) => x.email === u.email) || null;
        if (!created) { fail(`auth user ${u.email}`, retry.error.message); continue; }
      } else created = retry.data.user;
    }
    await db.auth.admin.updateUserById(created.id, { password: TEMP_PASSWORD });
    idMap[u.id] = created.id;
  }
  console.log(`auth users: ${Object.keys(idMap).length}/${users.length} (password → ${TEMP_PASSWORD})`);
  return idMap;
}

// ── table rows ───────────────────────────────────────────────────────────────
const USER_ID_COL = /(^|_)user_id$/;

function remap(row, idMap) {
  const out = { ...row };
  for (const k of Object.keys(out)) {
    if (USER_ID_COL.test(k) && typeof out[k] === "string" && idMap[out[k]]) {
      out[k] = idMap[out[k]];
    }
  }
  return out;
}

async function importTables(idMap) {
  const files = readdirSync(`${DIR}/tables`).filter((f) => f.endsWith(".json"));
  const pending = files.map((f) => ({
    table: f.replace(/\.json$/, ""),
    rows: JSON.parse(readFileSync(`${DIR}/tables/${f}`, "utf8")),
  }));

  for (let pass = 1; pass <= MAX_PASSES && pending.length; pass++) {
    let progress = false;
    for (let i = pending.length - 1; i >= 0; i--) {
      const { table, rows } = pending[i];
      if (!rows.length) { pending.splice(i, 1); progress = true; continue; }
      let inserted = 0;
      let firstErr = null;
      for (let b = 0; b < rows.length; b += BATCH) {
        const batch = rows.slice(b, b + BATCH).map((r) => remap(r, idMap));
        const { error } = await db.from(table).upsert(batch);
        if (error) { firstErr = error.message; break; }
        inserted += batch.length;
      }
      if (inserted >= rows.length) {
        pending.splice(i, 1);
        progress = true;
        console.log(`${table}: ${inserted} rows`);
      } else if (inserted > 0) {
        // partial success — keep the remainder for next pass
        pending[i].rows = rows.slice(inserted);
        progress = true;
        console.log(`${table}: ${inserted}/${rows.length} (${firstErr})`);
      } else if (pass === MAX_PASSES) {
        console.log(`${table}: FAILED (${firstErr})`);
      }
    }
    if (!progress) {
      console.log(`pass ${pass}: no progress, remaining: ${pending.map((p) => p.table).join(", ")}`);
      break;
    }
  }
  if (pending.length) console.log("Unimported:", pending.map((p) => `${p.table}(${p.rows.length})`).join(", "));
}

const main = async () => {
  const idMap = await importAuthUsers();
  await importTables(idMap);
  console.log("Import finished.");
};

main().catch((e) => { console.error(e); process.exit(1); });
