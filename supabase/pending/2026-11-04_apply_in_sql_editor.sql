-- =====================================================================
-- Pending migrations for project mwtdhbllkzuryswrumrd — paste the WHOLE
-- file into Supabase Dashboard -> SQL Editor -> Run.
--
--   1. 20261027_storage_restore_staff_access.sql  (staff invoice-PDF downloads)
--   2. 20261103_tariff_point_values.sql           (per-insurer point values)
--
-- Both are idempotent: running them twice is harmless.
-- The TARDOC / ACF catalogues need NO database change (they ship with the app).
-- =====================================================================

-- >>>>> 20261027_storage_restore_staff_access.sql
-- =====================================================================
-- Restore STAFF access to the billing document buckets
-- =====================================================================
-- Why this is needed:
--
-- The Phase 1 storage containment dropped the policies that exposed
-- `invoice-pdfs` and `cash-receipts`, because those buckets hold documents
-- that identify a patient and the amount billed and they were readable by
-- anyone on the internet.
--
-- Those policies were declared `TO public`. In PostgreSQL the `public` role is
-- every role, so `TO public` covered `authenticated` as well as `anon`.
-- Dropping them therefore removed logged-in staff access at the same time, and
-- the storage API gives no hint that this is what happened:
--
--   * getPublicUrl() still returns a well-formed URL for a private bucket, but
--     fetching it fails with "Bucket not found".
--   * createSignedUrl() from the browser needs SELECT on storage.objects; with
--     no applicable policy it just fails.
--
-- Result: "they cannot download the pdf file".
--
-- This migration grants the access back to `authenticated` ONLY. `anon` is
-- deliberately not mentioned, so unauthenticated visitors still get nothing and
-- the buckets stay private. Patient-facing downloads (the payment link page)
-- are served instead by a short-lived signed URL minted server-side after the
-- payment token has been validated — see /api/invoices/get-by-token.
-- =====================================================================

-- Membership gate. Sign-up is open, so "authenticated" alone includes
-- self-registered strangers. If the org-membership helper from the RLS
-- lockdown (public.is_staff_member()) exists, every policy below also
-- requires it — this migration must never grant more than the lockdown does.
--
-- invoice-pdfs: read only. Uploads are done server-side with the service
-- role (/api/invoices/generate-pdf, medidata routes); read-only means a
-- compromised staff session cannot overwrite or delete issued invoices.
--
-- cash-receipts: read + create. Staff upload receipts from the patient file
-- (MedicalConsultationsCard -> cash-receipts.upload) and view them again.
-- No UPDATE/DELETE: a receipt is evidence of a payment.
do $$
declare
  gate text := case
    when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'is_staff_member')
    then ' and public.is_staff_member()'
    else ''
  end;
begin
  if gate = '' then
    raise warning 'public.is_staff_member() not found: storage policies are scoped to authenticated users only. Close public sign-up or apply the org-membership lockdown.';
  end if;

  execute 'drop policy if exists "invoice_pdfs_authenticated_read" on storage.objects';
  execute format($p$create policy "invoice_pdfs_authenticated_read" on storage.objects
    for select to authenticated using (bucket_id = 'invoice-pdfs'%s)$p$, gate);

  execute 'drop policy if exists "cash_receipts_authenticated_read" on storage.objects';
  execute format($p$create policy "cash_receipts_authenticated_read" on storage.objects
    for select to authenticated using (bucket_id = 'cash-receipts'%s)$p$, gate);

  execute 'drop policy if exists "cash_receipts_authenticated_insert" on storage.objects';
  execute format($p$create policy "cash_receipts_authenticated_insert" on storage.objects
    for insert to authenticated with check (bucket_id = 'cash-receipts'%s)$p$, gate);
end $$;

-- ---------------------------------------------------------------------
-- Verify, and report anything still open to anon/public.
-- ---------------------------------------------------------------------
do $$
declare
  missing text[] := array[]::text[];
  r record;
begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects'
                  and policyname='invoice_pdfs_authenticated_read') then
    missing := missing || 'invoice_pdfs_authenticated_read';
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects'
                  and policyname='cash_receipts_authenticated_read') then
    missing := missing || 'cash_receipts_authenticated_read';
  end if;
  if array_length(missing, 1) is not null then
    raise exception 'storage policies were not created: %', array_to_string(missing, ', ');
  end if;

  -- The containment guarantee: nothing here may be open to anon/public again.
  for r in
    select policyname, cmd, roles::text as roles
      from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and (roles::text like '%anon%' or roles::text like '%public%')
  loop
    raise warning 'storage.objects policy open to anon/public: % (% on %)', r.policyname, r.cmd, r.roles;
  end loop;

  raise notice 'Staff access restored to invoice-pdfs (read) and cash-receipts (read+create); anon unchanged.';
end $$;

-- ---------------------------------------------------------------------
-- The buckets must STAY private. Patient-facing access is via signed URLs.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from storage.buckets where id in ('invoice-pdfs','cash-receipts') and public = true) then
    raise warning 'invoice-pdfs and/or cash-receipts is PUBLIC. Invoice PDFs identify patients and amounts; they must not be world-readable. Set public = false and rely on signed URLs.';
  end if;
end $$;

-- >>>>> 20261103_tariff_point_values.sql
-- =====================================================================
-- Per-insurer tariff point values (valeur du point tarifaire / Taxpunktwert)
-- =====================================================================
-- Problem this solves:
--
-- The tax point value was resolved in the browser as
--     CANTON_TAX_POINT_VALUES[canton] ?? 0.96
-- a hardcoded constant keyed on CANTON ONLY. In Swiss TARDOC/TARMED billing
-- the value is negotiated per cost-bearer group (tarifsuisse, HSK, CSS, …)
-- AND per canton, and it changes over time. With a single canton-wide number,
-- every invoice to an insurer on a different rate is wrong, which is why
-- billing staff correct them by hand and why insurers reject with
--   59109    "Valeurs du point tarifaire trop élevées"
--   eK6.T001 "La taxe de valeur est trop grande"
--
-- This table makes the value data, not code: resolvable per insurer, per
-- canton, per law, with validity dates so a mid-year change is just a new row.
--
-- IMPORTANT — no tariff values have been invented here.
-- The seed below contains ONLY the canton defaults that were already present
-- in src/lib/tardoc.ts, moved verbatim. Insurer-specific rates must be entered
-- from your actual contracts; until a row exists for an insurer the resolver
-- falls back to the canton default, i.e. exactly today's behaviour.
-- =====================================================================

create table if not exists public.tariff_point_values (
  id            uuid primary key default gen_random_uuid(),

  -- Scope. NULL means "applies to anything" for that dimension, so a row can
  -- be a canton default (insurer_gln null) or an insurer-specific override.
  insurer_gln   text,
  insurer_group text,            -- e.g. 'tarifsuisse', 'HSK', 'CSS'
  canton        text not null,
  law_type      text,            -- KVG / UVG / IVG / MVG; null = any
  tariff_type   text not null default '007',  -- 007 TARDOC, 001 TARMED

  value         numeric(6,4) not null check (value > 0 and value < 10),

  valid_from    date not null default '2000-01-01',
  valid_to      date,            -- null = still in force

  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.tariff_point_values is
  'Tariff point values (TPV) per insurer/canton/law/period. Replaces the hardcoded CANTON_TAX_POINT_VALUES constant. Most specific match wins; see src/lib/tariffPointValues.ts.';
comment on column public.tariff_point_values.insurer_gln is
  'Exact cost bearer. Most specific match. NULL = applies to any insurer.';
comment on column public.tariff_point_values.insurer_group is
  'Purchasing group (tarifsuisse / HSK / CSS). Used when no GLN-specific row exists.';
comment on column public.tariff_point_values.valid_to is
  'NULL = currently in force. Supersede a rate by closing the old row and inserting a new one, so historical invoices stay reproducible.';

create index if not exists tariff_point_values_lookup_idx
  on public.tariff_point_values (canton, tariff_type, valid_from desc);
create index if not exists tariff_point_values_gln_idx
  on public.tariff_point_values (insurer_gln) where insurer_gln is not null;

-- One rate per scope per period.
create unique index if not exists tariff_point_values_scope_idx
  on public.tariff_point_values (
    coalesce(insurer_gln, ''), coalesce(insurer_group, ''), canton,
    coalesce(law_type, ''), tariff_type, valid_from
  );

-- ---------------------------------------------------------------------
-- RLS: staff read, admins write. Never anon.
-- ---------------------------------------------------------------------
alter table public.tariff_point_values enable row level security;

-- Same membership gate as the storage migration: if the org-membership
-- lockdown helper exists, only active staff may read.
do $$
begin
  execute 'drop policy if exists tariff_point_values_authenticated_read on public.tariff_point_values';
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'is_staff_member') then
    execute 'create policy tariff_point_values_authenticated_read on public.tariff_point_values
             for select to authenticated using (public.is_staff_member())';
  else
    execute 'create policy tariff_point_values_authenticated_read on public.tariff_point_values
             for select to authenticated using (true)';
  end if;
end $$;

revoke all on public.tariff_point_values from anon;
grant select on public.tariff_point_values to authenticated;

-- ---------------------------------------------------------------------
-- Seed: the canton defaults that were already hardcoded in src/lib/tardoc.ts.
-- Verbatim, nothing invented. insurer_gln NULL = canton-wide default.
-- ---------------------------------------------------------------------
insert into public.tariff_point_values (canton, tariff_type, value, note)
values
  ('AG','007',0.8900,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('AI','007',0.8600,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('AR','007',0.8600,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('BE','007',0.8900,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('BL','007',0.9100,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('BS','007',0.9600,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('FR','007',0.8800,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('GE','007',0.9600,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('GL','007',0.8600,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('GR','007',0.8600,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('JU','007',0.8600,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('LU','007',0.8900,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('NE','007',0.8900,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('NW','007',0.8600,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('OW','007',0.8600,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('SG','007',0.8600,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('SH','007',0.8600,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('SO','007',0.8900,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('SZ','007',0.8600,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('TG','007',0.8600,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('TI','007',0.9000,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('UR','007',0.8600,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('VD','007',0.9300,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('VS','007',0.8600,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('ZG','007',0.9300,'Canton default migrated from CANTON_TAX_POINT_VALUES'),
  ('ZH','007',0.9300,'Canton default migrated from CANTON_TAX_POINT_VALUES')
on conflict do nothing;

do $$
begin
  raise notice 'tariff_point_values created and seeded with % canton defaults. Insurer-specific rates must be entered from contracts.',
    (select count(*) from public.tariff_point_values);
end $$;

-- >>>>> Result: every row should say ok = true
select 'tariff_point_values table' as check, to_regclass('public.tariff_point_values') is not null as ok,
       (select count(*) from public.tariff_point_values)::text as detail
union all
select 'canton defaults seeded', (select count(*) from public.tariff_point_values where insurer_gln is null and insurer_group is null) = 26, ''
union all
select 'policy ' || policyname, true, qual
  from pg_policies
 where (schemaname = 'storage' and tablename = 'objects' and policyname in
        ('invoice_pdfs_authenticated_read','cash_receipts_authenticated_read','cash_receipts_authenticated_insert'))
    or (schemaname = 'public' and tablename = 'tariff_point_values')
union all
select 'invoice-pdfs bucket private', not public, '' from storage.buckets where id = 'invoice-pdfs';
