-- ============================================================
-- Rename admin email:
--   charline@aesthetics-ge.ch  →  charline@aliice.app
-- Updates every table that references the admin email.
-- ============================================================

DO $$
BEGIN

  -- 1. public.users  (admin portal login table)
  UPDATE public.users
  SET    email = 'charline@aliice.app'
  WHERE  email = 'charline@aesthetics-ge.ch';

  -- 2. admin_gmail_accounts  (PRIMARY KEY = admin_email — must re-insert)
  IF EXISTS (
    SELECT 1 FROM admin_gmail_accounts WHERE admin_email = 'charline@aesthetics-ge.ch'
  ) THEN
    INSERT INTO admin_gmail_accounts (admin_email, google_email, access_token, refresh_token, token_expiry, scope, created_at, updated_at)
    SELECT 'charline@aliice.app', google_email, access_token, refresh_token, token_expiry, scope, created_at, now()
    FROM   admin_gmail_accounts
    WHERE  admin_email = 'charline@aesthetics-ge.ch'
    ON CONFLICT (admin_email) DO UPDATE SET
      google_email  = EXCLUDED.google_email,
      access_token  = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expiry  = EXCLUDED.token_expiry,
      scope         = EXCLUDED.scope,
      updated_at    = now();

    DELETE FROM admin_gmail_accounts WHERE admin_email = 'charline@aesthetics-ge.ch';
  END IF;

  -- 3. emails table  (from_address / to_address)
  UPDATE emails
  SET    from_address = 'charline@aliice.app',
         updated_at  = now()
  WHERE  from_address = 'charline@aesthetics-ge.ch';

  UPDATE emails
  SET    to_address  = 'charline@aliice.app',
         updated_at = now()
  WHERE  to_address  = 'charline@aesthetics-ge.ch';

  -- 4. sales_pipeline_automations  (admin_email field for admin-notify actions)
  UPDATE sales_pipeline_automations
  SET    admin_email = 'charline@aliice.app',
         updated_at  = now()
  WHERE  admin_email = 'charline@aesthetics-ge.ch';

  -- 5. sales_pipeline_automation_runs  (detail JSONB may store recipient)
  UPDATE sales_pipeline_automation_runs
  SET    detail = jsonb_set(detail, '{recipient}', '"charline@aliice.app"')
  WHERE  detail->>'recipient' = 'charline@aesthetics-ge.ch';

  RAISE NOTICE 'Email rename complete: charline@aesthetics-ge.ch → charline@aliice.app';
END $$;

-- 6. auth.users  (Supabase Auth — must be last, uses a separate schema)
UPDATE auth.users
SET    email              = 'charline@aliice.app',
       email_confirmed_at = COALESCE(email_confirmed_at, now()),
       updated_at         = now()
WHERE  email = 'charline@aesthetics-ge.ch';
