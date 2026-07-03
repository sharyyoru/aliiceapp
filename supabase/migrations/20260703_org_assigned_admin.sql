-- Add assigned_to_admin_email column to organizations for admin-side owner assignment
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS assigned_to_admin_email TEXT;
CREATE INDEX IF NOT EXISTS organizations_assigned_admin_idx ON organizations(assigned_to_admin_email);
