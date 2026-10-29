-- Role audit: run in the Supabase SQL Editor BEFORE deploying the new guards.
--
-- The authoritative role is organization_members.role. user_metadata.role was
-- client-controllable and must NEVER be copied upward automatically — a
-- self-promoted "admin" there would become a real admin.
--
-- 1) Users claiming a role in user_metadata vs. their real org membership.
--    Review every row where claimed role is admin/owner: either the org role
--    is already correct (row is benign) or the user attempted self-promotion.
select
  u.id,
  u.email,
  u.raw_user_meta_data ->> 'role'            as claimed_metadata_role,
  om.organization_id,
  om.role                                    as real_org_role,
  om.is_active
from auth.users u
left join organization_members om
  on om.user_id = u.id
where u.raw_user_meta_data ->> 'role' is not null
order by u.email;

-- 2) Staff users with NO active organization membership — they will lose
--    access once requireStaff ships. Decide per user: add a membership row
--    with the intended role, or leave them locked out.
select
  u.id,
  u.email,
  u.raw_user_meta_data ->> 'role' as claimed_metadata_role
from auth.users u
where not exists (
  select 1 from organization_members om
  where om.user_id = u.id and om.is_active = true
)
order by u.email;

-- 3) Grant an org role manually (reviewed rows only). Adjust per user:
-- insert into organization_members (organization_id, user_id, role, is_active)
-- values ('<org-uuid>', '<user-uuid>', 'staff', true)
-- on conflict do nothing;
--
-- update organization_members
-- set role = 'admin'
-- where organization_id = '<org-uuid>' and user_id = '<user-uuid>';
