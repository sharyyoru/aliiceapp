-- ============================================
-- Row Level Security (RLS) Policies
-- Ensures strict tenant data isolation
-- ============================================

-- ============================================
-- HELPER FUNCTION: Get User's Organization IDs
-- ============================================
-- Returns all organization IDs the current user is a member of

CREATE OR REPLACE FUNCTION auth.user_organization_ids()
RETURNS UUID[] AS $$
  SELECT COALESCE(
    ARRAY_AGG(organization_id),
    ARRAY[]::UUID[]
  )
  FROM organization_members
  WHERE user_id = auth.uid()
    AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER FUNCTION: Get User's Current Organization
-- ============================================
-- Returns the user's currently selected organization

CREATE OR REPLACE FUNCTION auth.current_organization_id()
RETURNS UUID AS $$
  SELECT current_organization_id
  FROM users
  WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER FUNCTION: User is member of organization
-- ============================================

CREATE OR REPLACE FUNCTION auth.is_member_of(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
      AND organization_id = org_id
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER FUNCTION: User is admin of organization
-- ============================================

CREATE OR REPLACE FUNCTION auth.is_admin_of(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
      AND organization_id = org_id
      AND role IN ('owner', 'admin')
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- ORGANIZATIONS TABLE RLS
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users can view organizations they are members of
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (auth.is_member_of(id));

-- Only owners/admins can update organization details
CREATE POLICY "Admins can update organizations"
  ON organizations FOR UPDATE
  USING (auth.is_admin_of(id))
  WITH CHECK (auth.is_admin_of(id));

-- Anyone can create organizations (during signup)
CREATE POLICY "Anyone can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- Only owners can delete organizations
CREATE POLICY "Owners can delete organizations"
  ON organizations FOR DELETE
  USING (owner_user_id = auth.uid());

-- ============================================
-- ORGANIZATION MEMBERS TABLE RLS
-- ============================================

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Members can view other members in their organizations
CREATE POLICY "Members can view org members"
  ON organization_members FOR SELECT
  USING (auth.is_member_of(organization_id));

-- Admins can add members
CREATE POLICY "Admins can add members"
  ON organization_members FOR INSERT
  WITH CHECK (auth.is_admin_of(organization_id));

-- Admins can update members (except owners)
CREATE POLICY "Admins can update members"
  ON organization_members FOR UPDATE
  USING (
    auth.is_admin_of(organization_id) 
    AND role != 'owner'
  )
  WITH CHECK (auth.is_admin_of(organization_id));

-- Admins can remove members (except owners)
CREATE POLICY "Admins can remove members"
  ON organization_members FOR DELETE
  USING (
    auth.is_admin_of(organization_id)
    AND role != 'owner'
  );

-- ============================================
-- ORGANIZATION INVITATIONS TABLE RLS
-- ============================================

ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can view invitations for their org
CREATE POLICY "Admins can view invitations"
  ON organization_invitations FOR SELECT
  USING (auth.is_admin_of(organization_id));

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON organization_invitations FOR INSERT
  WITH CHECK (auth.is_admin_of(organization_id));

-- Admins can update invitations (revoke)
CREATE POLICY "Admins can update invitations"
  ON organization_invitations FOR UPDATE
  USING (auth.is_admin_of(organization_id));

-- Public can view invitation by token (for accepting)
CREATE POLICY "Anyone can view invitation by token"
  ON organization_invitations FOR SELECT
  USING (true);  -- Token-based access handled in app layer

-- ============================================
-- ORGANIZATION SETTINGS TABLE RLS
-- ============================================

ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Members can view settings
CREATE POLICY "Members can view settings"
  ON organization_settings FOR SELECT
  USING (auth.is_member_of(organization_id));

-- Admins can update settings
CREATE POLICY "Admins can update settings"
  ON organization_settings FOR UPDATE
  USING (auth.is_admin_of(organization_id))
  WITH CHECK (auth.is_admin_of(organization_id));

-- System creates settings (via function)
CREATE POLICY "System can create settings"
  ON organization_settings FOR INSERT
  WITH CHECK (true);

-- ============================================
-- ORGANIZATION AUDIT LOG TABLE RLS
-- ============================================

ALTER TABLE organization_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON organization_audit_log FOR SELECT
  USING (auth.is_admin_of(organization_id));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON organization_audit_log FOR INSERT
  WITH CHECK (true);

-- ============================================
-- USERS TABLE RLS
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Users can view profiles of members in their organizations
CREATE POLICY "Members can view org member profiles"
  ON users FOR SELECT
  USING (
    id IN (
      SELECT om.user_id 
      FROM organization_members om
      WHERE om.organization_id = ANY(auth.user_organization_ids())
        AND om.is_active = true
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- System can insert users (via auth trigger)
CREATE POLICY "System can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- ============================================
-- PATIENTS TABLE RLS
-- ============================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Members can view patients in their organization
CREATE POLICY "Members can view org patients"
  ON patients FOR SELECT
  USING (auth.is_member_of(organization_id));

-- Members can create patients in their organization
CREATE POLICY "Members can create patients"
  ON patients FOR INSERT
  WITH CHECK (auth.is_member_of(organization_id));

-- Members can update patients in their organization
CREATE POLICY "Members can update patients"
  ON patients FOR UPDATE
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));

-- Admins can delete patients
CREATE POLICY "Admins can delete patients"
  ON patients FOR DELETE
  USING (auth.is_admin_of(organization_id));

-- ============================================
-- PROVIDERS TABLE RLS
-- ============================================

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org providers"
  ON providers FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Admins can manage providers"
  ON providers FOR ALL
  USING (auth.is_admin_of(organization_id))
  WITH CHECK (auth.is_admin_of(organization_id));

-- ============================================
-- APPOINTMENTS TABLE RLS
-- ============================================

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org appointments"
  ON appointments FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Members can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.is_member_of(organization_id));

CREATE POLICY "Members can update appointments"
  ON appointments FOR UPDATE
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));

CREATE POLICY "Admins can delete appointments"
  ON appointments FOR DELETE
  USING (auth.is_admin_of(organization_id));

-- ============================================
-- DEALS TABLE RLS
-- ============================================

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org deals"
  ON deals FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Members can manage deals"
  ON deals FOR ALL
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));

-- ============================================
-- SERVICES TABLE RLS
-- ============================================

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org services"
  ON services FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Admins can manage services"
  ON services FOR ALL
  USING (auth.is_admin_of(organization_id))
  WITH CHECK (auth.is_admin_of(organization_id));

-- ============================================
-- SERVICE CATEGORIES TABLE RLS
-- ============================================

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org service categories"
  ON service_categories FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Admins can manage service categories"
  ON service_categories FOR ALL
  USING (auth.is_admin_of(organization_id))
  WITH CHECK (auth.is_admin_of(organization_id));

-- ============================================
-- DEAL STAGES TABLE RLS
-- ============================================

ALTER TABLE deal_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org deal stages"
  ON deal_stages FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Admins can manage deal stages"
  ON deal_stages FOR ALL
  USING (auth.is_admin_of(organization_id))
  WITH CHECK (auth.is_admin_of(organization_id));

-- ============================================
-- WORKFLOWS TABLE RLS
-- ============================================

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org workflows"
  ON workflows FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Admins can manage workflows"
  ON workflows FOR ALL
  USING (auth.is_admin_of(organization_id))
  WITH CHECK (auth.is_admin_of(organization_id));

-- ============================================
-- EMAIL TEMPLATES TABLE RLS
-- ============================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org email templates"
  ON email_templates FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  USING (auth.is_admin_of(organization_id))
  WITH CHECK (auth.is_admin_of(organization_id));

-- ============================================
-- EMAILS TABLE RLS
-- ============================================

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org emails"
  ON emails FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Members can manage emails"
  ON emails FOR ALL
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));

-- ============================================
-- DOCUMENTS TABLE RLS
-- ============================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org documents"
  ON documents FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Members can manage documents"
  ON documents FOR ALL
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));

-- ============================================
-- CONSULTATIONS TABLE RLS
-- ============================================

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org consultations"
  ON consultations FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Members can manage consultations"
  ON consultations FOR ALL
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));

-- ============================================
-- TASKS TABLE RLS
-- ============================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org tasks"
  ON tasks FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Members can manage tasks"
  ON tasks FOR ALL
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));

-- ============================================
-- PATIENT NOTES TABLE RLS
-- ============================================

ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org patient notes"
  ON patient_notes FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Members can manage patient notes"
  ON patient_notes FOR ALL
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));

-- ============================================
-- WHATSAPP MESSAGES TABLE RLS
-- ============================================

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org whatsapp messages"
  ON whatsapp_messages FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Members can manage whatsapp messages"
  ON whatsapp_messages FOR ALL
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));

-- ============================================
-- MEDIDATA SUBMISSIONS TABLE RLS
-- ============================================

ALTER TABLE medidata_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org medidata submissions"
  ON medidata_submissions FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Members can manage medidata submissions"
  ON medidata_submissions FOR ALL
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));

-- ============================================
-- MEDIDATA CONFIG TABLE RLS
-- ============================================

ALTER TABLE medidata_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org medidata config"
  ON medidata_config FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Admins can manage medidata config"
  ON medidata_config FOR ALL
  USING (auth.is_admin_of(organization_id))
  WITH CHECK (auth.is_admin_of(organization_id));

-- ============================================
-- DOCUMENT TEMPLATES TABLE RLS
-- ============================================

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org document templates"
  ON document_templates FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Admins can manage document templates"
  ON document_templates FOR ALL
  USING (auth.is_admin_of(organization_id))
  WITH CHECK (auth.is_admin_of(organization_id));

-- ============================================
-- PATIENT DOCUMENTS TABLE RLS
-- ============================================

ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org patient documents"
  ON patient_documents FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Members can manage patient documents"
  ON patient_documents FOR ALL
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));

-- ============================================
-- CHAT CONVERSATIONS TABLE RLS
-- ============================================

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org chat conversations"
  ON chat_conversations FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Members can manage chat conversations"
  ON chat_conversations FOR ALL
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));

-- ============================================
-- CHAT FOLDERS TABLE RLS
-- ============================================

ALTER TABLE chat_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org chat folders"
  ON chat_folders FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Members can manage chat folders"
  ON chat_folders FOR ALL
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));

-- ============================================
-- EXTERNAL LABS TABLE RLS
-- ============================================

ALTER TABLE external_labs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org external labs"
  ON external_labs FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Admins can manage external labs"
  ON external_labs FOR ALL
  USING (auth.is_admin_of(organization_id))
  WITH CHECK (auth.is_admin_of(organization_id));

-- ============================================
-- DOCTOR SCHEDULING SETTINGS TABLE RLS
-- ============================================

ALTER TABLE doctor_scheduling_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org doctor scheduling settings"
  ON doctor_scheduling_settings FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Admins can manage doctor scheduling settings"
  ON doctor_scheduling_settings FOR ALL
  USING (auth.is_admin_of(organization_id))
  WITH CHECK (auth.is_admin_of(organization_id));

-- ============================================
-- PATIENT INSURANCES TABLE RLS
-- ============================================

ALTER TABLE patient_insurances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org patient insurances"
  ON patient_insurances FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Members can manage patient insurances"
  ON patient_insurances FOR ALL
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));

-- ============================================
-- TASK COMMENTS TABLE RLS
-- ============================================

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org task comments"
  ON task_comments FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Members can manage task comments"
  ON task_comments FOR ALL
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));

-- ============================================
-- PATIENT EDIT LOCKS TABLE RLS
-- ============================================

ALTER TABLE patient_edit_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org patient edit locks"
  ON patient_edit_locks FOR SELECT
  USING (auth.is_member_of(organization_id));

CREATE POLICY "Members can manage patient edit locks"
  ON patient_edit_locks FOR ALL
  USING (auth.is_member_of(organization_id))
  WITH CHECK (auth.is_member_of(organization_id));
