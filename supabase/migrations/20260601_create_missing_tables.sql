-- ============================================
-- CREATE ALL MISSING TABLES
-- Fix for 404 errors on notification/mention tables
-- ============================================

-- 1. patient_note_mentions table
CREATE TABLE IF NOT EXISTS patient_note_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    mentioned_user_id UUID NOT NULL,
    mentioned_by_user_id UUID,
    read_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    organization_id UUID
);

-- 2. task_comment_mentions table
CREATE TABLE IF NOT EXISTS task_comment_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID,
    task_id UUID,
    mentioned_user_id UUID NOT NULL,
    mentioned_by_user_id UUID,
    read_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    organization_id UUID
);

-- 3. email_reply_notifications table
CREATE TABLE IF NOT EXISTS email_reply_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    patient_id UUID,
    original_email_id UUID,
    reply_email_id UUID,
    reply_from TEXT,
    reply_subject TEXT,
    reply_snippet TEXT,
    read_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    organization_id UUID
);

-- 4. Ensure tasks table has assigned_read_at column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_read_at') THEN
        ALTER TABLE tasks ADD COLUMN assigned_read_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_user_id') THEN
        ALTER TABLE tasks ADD COLUMN assigned_user_id UUID DEFAULT NULL;
    END IF;
END $$;

-- ============================================
-- GRANT ACCESS TO ALL NEW TABLES
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON patient_note_mentions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON task_comment_mentions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_reply_notifications TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON patient_note_mentions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON task_comment_mentions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_reply_notifications TO anon;

-- ============================================
-- DISABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE patient_note_mentions DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_comment_mentions DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_reply_notifications DISABLE ROW LEVEL SECURITY;

-- ============================================
-- GRANT ACCESS TO ALL EXISTING TABLES (comprehensive)
-- ============================================

DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon', tbl);
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END $$;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
