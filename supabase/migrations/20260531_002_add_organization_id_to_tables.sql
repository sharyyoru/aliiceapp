-- ============================================
-- Add organization_id to All Tenant-Scoped Tables
-- ============================================

-- ============================================
-- PATIENTS TABLE
-- ============================================
ALTER TABLE IF EXISTS patients
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS patients_organization_id_idx ON patients(organization_id);
CREATE INDEX IF NOT EXISTS patients_org_email_idx ON patients(organization_id, email);
CREATE INDEX IF NOT EXISTS patients_org_last_name_idx ON patients(organization_id, last_name);

-- ============================================
-- PROVIDERS TABLE (Doctors/Clinicians)
-- ============================================
ALTER TABLE IF EXISTS providers
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS providers_organization_id_idx ON providers(organization_id);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
ALTER TABLE IF EXISTS appointments
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS appointments_organization_id_idx ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS appointments_org_start_time_idx ON appointments(organization_id, start_time);

-- ============================================
-- DEALS TABLE
-- ============================================
ALTER TABLE IF EXISTS deals
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS deals_organization_id_idx ON deals(organization_id);

-- ============================================
-- DEAL STAGES TABLE
-- ============================================
ALTER TABLE IF EXISTS deal_stages
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS deal_stages_organization_id_idx ON deal_stages(organization_id);

-- ============================================
-- SERVICES TABLE
-- ============================================
ALTER TABLE IF EXISTS services
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS services_organization_id_idx ON services(organization_id);

-- ============================================
-- SERVICE CATEGORIES TABLE
-- ============================================
ALTER TABLE IF EXISTS service_categories
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS service_categories_organization_id_idx ON service_categories(organization_id);

-- ============================================
-- SERVICE GROUPS TABLE
-- ============================================
ALTER TABLE IF EXISTS service_groups
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS service_groups_organization_id_idx ON service_groups(organization_id);

-- ============================================
-- WORKFLOWS TABLE
-- ============================================
ALTER TABLE IF EXISTS workflows
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS workflows_organization_id_idx ON workflows(organization_id);

-- ============================================
-- EMAIL TEMPLATES TABLE
-- ============================================
ALTER TABLE IF EXISTS email_templates
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS email_templates_organization_id_idx ON email_templates(organization_id);

-- ============================================
-- EMAILS TABLE
-- ============================================
ALTER TABLE IF EXISTS emails
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS emails_organization_id_idx ON emails(organization_id);

-- ============================================
-- WHATSAPP MESSAGES TABLE
-- ============================================
ALTER TABLE IF EXISTS whatsapp_messages
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS whatsapp_messages_organization_id_idx ON whatsapp_messages(organization_id);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
ALTER TABLE IF EXISTS documents
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS documents_organization_id_idx ON documents(organization_id);

-- ============================================
-- PATIENT NOTES TABLE
-- ============================================
ALTER TABLE IF EXISTS patient_notes
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS patient_notes_organization_id_idx ON patient_notes(organization_id);

-- ============================================
-- TASKS TABLE
-- ============================================
ALTER TABLE IF EXISTS tasks
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS tasks_organization_id_idx ON tasks(organization_id);

-- ============================================
-- CONSULTATIONS TABLE
-- ============================================
ALTER TABLE IF EXISTS consultations
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS consultations_organization_id_idx ON consultations(organization_id);

-- ============================================
-- CRISALIX RECONSTRUCTIONS TABLE
-- ============================================
ALTER TABLE IF EXISTS crisalix_reconstructions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS crisalix_reconstructions_organization_id_idx ON crisalix_reconstructions(organization_id);

-- ============================================
-- CHAT FOLDERS TABLE
-- ============================================
ALTER TABLE IF EXISTS chat_folders
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS chat_folders_organization_id_idx ON chat_folders(organization_id);

-- ============================================
-- CHAT CONVERSATIONS TABLE
-- ============================================
ALTER TABLE IF EXISTS chat_conversations
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS chat_conversations_organization_id_idx ON chat_conversations(organization_id);

-- ============================================
-- MEDIDATA SUBMISSIONS TABLE
-- ============================================
ALTER TABLE IF EXISTS medidata_submissions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS medidata_submissions_organization_id_idx ON medidata_submissions(organization_id);

-- ============================================
-- MEDIDATA CONFIG TABLE
-- ============================================
ALTER TABLE IF EXISTS medidata_config
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS medidata_config_organization_id_idx ON medidata_config(organization_id);

-- Make organization_id unique for medidata_config (one config per org)
ALTER TABLE IF EXISTS medidata_config
  DROP CONSTRAINT IF EXISTS medidata_config_organization_id_unique;
ALTER TABLE IF EXISTS medidata_config
  ADD CONSTRAINT medidata_config_organization_id_unique UNIQUE (organization_id);

-- ============================================
-- DOCUMENT TEMPLATES TABLE
-- ============================================
ALTER TABLE IF EXISTS document_templates
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS document_templates_organization_id_idx ON document_templates(organization_id);

-- ============================================
-- PATIENT DOCUMENTS TABLE
-- ============================================
ALTER TABLE IF EXISTS patient_documents
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS patient_documents_organization_id_idx ON patient_documents(organization_id);

-- ============================================
-- EXTERNAL LABS TABLE
-- ============================================
ALTER TABLE IF EXISTS external_labs
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS external_labs_organization_id_idx ON external_labs(organization_id);

-- ============================================
-- DOCTOR SCHEDULING SETTINGS TABLE
-- ============================================
ALTER TABLE IF EXISTS doctor_scheduling_settings
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS doctor_scheduling_settings_organization_id_idx ON doctor_scheduling_settings(organization_id);

-- ============================================
-- PATIENT INSURANCES TABLE
-- ============================================
ALTER TABLE IF EXISTS patient_insurances
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS patient_insurances_organization_id_idx ON patient_insurances(organization_id);

-- ============================================
-- TASK COMMENTS TABLE
-- ============================================
ALTER TABLE IF EXISTS task_comments
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS task_comments_organization_id_idx ON task_comments(organization_id);

-- ============================================
-- WORKFLOW ACTIONS TABLE
-- ============================================
ALTER TABLE IF EXISTS workflow_actions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS workflow_actions_organization_id_idx ON workflow_actions(organization_id);

-- ============================================
-- PATIENT EDIT LOCKS TABLE
-- ============================================
ALTER TABLE IF EXISTS patient_edit_locks
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS patient_edit_locks_organization_id_idx ON patient_edit_locks(organization_id);
