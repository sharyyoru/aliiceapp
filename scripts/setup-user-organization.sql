-- ============================================
-- SETUP USER & ORGANIZATION
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Get your user ID (run this first to see your ID)
SELECT id, email, full_name FROM auth.users;

-- Step 2: Create an organization for your clinic
-- Replace 'Your Clinic Name' with your actual clinic name
INSERT INTO organizations (name, slug, owner_user_id)
SELECT 
  'Aliice Demo Clinic',
  'aliice-demo-clinic',
  id
FROM auth.users
WHERE email = 'aliicecrm01@gmail.com'  -- Replace with your email
ON CONFLICT (slug) DO NOTHING
RETURNING *;

-- Step 3: Get the organization ID
SELECT id, name, slug FROM organizations;

-- Step 4: Add yourself as owner to organization_members
-- Replace the UUIDs below with actual values from steps 1 and 3
INSERT INTO organization_members (user_id, organization_id, role, is_active)
SELECT 
  u.id,
  o.id,
  'owner',
  true
FROM auth.users u
CROSS JOIN organizations o
WHERE u.email = 'aliicecrm01@gmail.com'  -- Replace with your email
  AND o.slug = 'aliice-demo-clinic'       -- Replace with your org slug
ON CONFLICT (user_id, organization_id) DO NOTHING
RETURNING *;

-- Step 5: Update user's current organization
UPDATE users
SET current_organization_id = (
  SELECT id FROM organizations WHERE slug = 'aliice-demo-clinic'
)
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'aliicecrm01@gmail.com'
);

-- Step 6: Verify setup
SELECT 
  u.email,
  o.name as organization_name,
  om.role,
  om.is_active
FROM organization_members om
JOIN auth.users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.organization_id
WHERE u.email = 'aliicecrm01@gmail.com';
