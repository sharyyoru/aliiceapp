/**
 * Export all data from the OLD deployment via /api/admin/export-data.
 *
 * Usage:
 *   EXPORT_BASE=https://www.aliice.app EXPORT_SECRET=... node scripts/export-old-data.mjs
 *
 * Writes dumps/tables/<table>.json and dumps/auth_users.json
 */

import { mkdirSync, writeFileSync, existsSync } from "node:fs";

const BASE = (process.env.EXPORT_BASE || "https://www.aliice.app").replace(/\/$/, "");
const SECRET = process.env.EXPORT_SECRET;
if (!SECRET) { console.error("Set EXPORT_SECRET"); process.exit(1); }

const DIR = "dumps";
const PAGE = 1000;

const api = async (params) => {
  const url = `${BASE}/api/admin/export-data?secret=${encodeURIComponent(SECRET)}&${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${params} → HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
};

const main = async () => {
  mkdirSync(`${DIR}/tables`, { recursive: true });

  const { tables } = await api("");
  console.log(`${tables.length} tables found`);

  // Auth users
  if (!existsSync(`${DIR}/auth_users.json`)) {
    const all = [];
    for (let page = 1; ; page++) {
      const { users } = await api(`resource=auth_users&page=${page}&limit=1000`);
      all.push(...users);
      if (users.length < 1000) break;
    }
    writeFileSync(`${DIR}/auth_users.json`, JSON.stringify(all, null, 1));
    console.log(`auth_users: ${all.length}`);
  }

  for (const t of tables) {
    const file = `${DIR}/tables/${t}.json`;
    if (existsSync(file)) { console.log(`skip ${t} (done)`); continue; }
    const rows = [];
    let offset = 0;
    for (;;) {
      const page = await api(`table=${t}&offset=${offset}&limit=${PAGE}`);
      rows.push(...page.rows);
      offset += page.rows.length;
      if (page.rows.length < PAGE) break;
    }
    writeFileSync(file, JSON.stringify(rows));
    console.log(`${t}: ${rows.length}`);
  }
  console.log("Export complete → dumps/");
};

main().catch((e) => { console.error(e.message || e); process.exit(1); });
