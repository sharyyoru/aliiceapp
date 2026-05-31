// Organization/Clinic Types for Multi-Tenant Architecture

export type OrganizationRole = 'owner' | 'admin' | 'doctor' | 'staff' | 'receptionist' | 'billing';

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  website?: string;
  street_address?: string;
  street_number?: string;
  postal_code?: string;
  city?: string;
  canton?: string;
  country?: string;
  gln?: string;
  zsr?: string;
  uid?: string;
  logo_url?: string;
  primary_color?: string;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  trial_ends_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  settings?: Record<string, unknown>;
  owner_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  permissions?: Record<string, boolean>;
  job_title?: string;
  department?: string;
  is_active: boolean;
  joined_at: string;
  deactivated_at?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  invited_by_user_id: string;
  email: string;
  role: OrganizationRole;
  token: string;
  status: InvitationStatus;
  personal_message?: string;
  expires_at: string;
  sent_at?: string;
  accepted_at?: string;
  accepted_by_user_id?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  organization?: {
    name: string;
    logo_url?: string;
  };
  invited_by?: {
    full_name?: string;
    email: string;
  };
}

export interface OrganizationSettings {
  id: string;
  organization_id: string;
  appointment_slot_duration: number;
  appointment_buffer_time: number;
  working_hours_start: string;
  working_hours_end: string;
  working_days: number[];
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  whatsapp_notifications_enabled: boolean;
  default_language: string;
  supported_languages: string[];
  date_format: string;
  currency: string;
  default_billing_type: 'TG' | 'TP';
  vat_number?: string;
  vat_rate: number;
  medidata_enabled: boolean;
  stripe_enabled: boolean;
  whatsapp_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Role-based permissions
export const ROLE_PERMISSIONS: Record<OrganizationRole, string[]> = {
  owner: [
    'org.manage',
    'org.delete',
    'org.billing',
    'members.invite',
    'members.manage',
    'patients.view',
    'patients.create',
    'patients.edit',
    'patients.delete',
    'appointments.view',
    'appointments.manage',
    'medical.view',
    'medical.edit',
    'financial.view',
    'financial.edit',
    'settings.manage',
    'reports.view',
  ],
  admin: [
    'org.manage',
    'org.billing',
    'members.invite',
    'members.manage',
    'patients.view',
    'patients.create',
    'patients.edit',
    'patients.delete',
    'appointments.view',
    'appointments.manage',
    'medical.view',
    'medical.edit',
    'financial.view',
    'financial.edit',
    'settings.manage',
    'reports.view',
  ],
  doctor: [
    'patients.view',
    'patients.create',
    'patients.edit',
    'appointments.view',
    'appointments.manage',
    'medical.view',
    'medical.edit',
    'reports.view',
  ],
  staff: [
    'patients.view',
    'patients.create',
    'patients.edit',
    'appointments.view',
    'appointments.manage',
  ],
  receptionist: [
    'patients.view',
    'patients.create',
    'appointments.view',
    'appointments.manage',
  ],
  billing: [
    'patients.view',
    'financial.view',
    'financial.edit',
    'reports.view',
  ],
};

// Helper function to check if role has permission
export function hasPermission(role: OrganizationRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Helper function to get role display name
export function getRoleDisplayName(role: OrganizationRole): string {
  const names: Record<OrganizationRole, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    doctor: 'Doctor',
    staff: 'Staff',
    receptionist: 'Receptionist',
    billing: 'Billing',
  };
  return names[role] ?? role;
}

// Helper function to generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}
