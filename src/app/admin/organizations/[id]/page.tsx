"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  CreditCard,
  Edit2,
  Save,
  X,
  MapPin,
  ExternalLink,
  Plus,
  Trash2,
  UserPlus,
  Loader2,
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  street_address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  sales_funnel_stage: string | null;
  deal_value: number | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    email: string;
    full_name: string;
  } | null;
}

interface OrgStats {
  patientCount: number;
  userCount: number;
  appointmentCount: number;
}

interface OrgUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

const FUNNEL_STAGES = [
  { id: "new_signup", label: "New Signup", color: "bg-slate-100 text-slate-700" },
  { id: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-700" },
  { id: "demo_scheduled", label: "Demo Scheduled", color: "bg-purple-100 text-purple-700" },
  { id: "onboarding", label: "Onboarding", color: "bg-amber-100 text-amber-700" },
  { id: "active", label: "Active Client", color: "bg-emerald-100 text-emerald-700" },
  { id: "churned", label: "Churned", color: "bg-red-100 text-red-700" },
];

export default function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState<OrgStats>({ patientCount: 0, userCount: 0, appointmentCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Organization>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", full_name: "", password: "", role: "staff" });

  useEffect(() => {
    async function fetchOrganization() {
      try {
        const response = await fetch("/api/admin/organizations");
        if (response.status === 401) {
          router.push("/admin/login");
          return;
        }

        const data = await response.json();
        const org = data.organizations?.find((o: Organization) => o.id === id);
        
        if (org) {
          setOrganization(org);
          setEditForm(org);
          // Fetch stats and users
          await Promise.all([fetchStats(org.id), fetchUsers(org.id)]);
        } else {
          setError("Organization not found");
        }
      } catch {
        setError("Failed to load organization");
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrganization();
  }, [id, router]);

  async function fetchStats(orgId: string) {
    try {
      const response = await fetch(`/api/admin/organizations/stats?id=${orgId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch {
      // Stats are optional, don't show error
    }
  }

  async function fetchUsers(orgId: string) {
    try {
      const response = await fetch(`/api/admin/organizations/users?organization_id=${orgId}`);
      if (response.ok) {
        const data = await response.json();
        setOrgUsers(data.users || []);
      }
    } catch {
      // Users fetch is optional, don't show error
    }
  }

  async function handleAddUser() {
    if (!organization || !newUser.email || !newUser.password) return;
    setAddingUser(true);

    try {
      const response = await fetch("/api/admin/organizations/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: organization.id,
          email: newUser.email,
          full_name: newUser.full_name,
          password: newUser.password,
          role: newUser.role,
        }),
      });

      if (response.ok) {
        await fetchUsers(organization.id);
        setShowAddUserModal(false);
        setNewUser({ email: "", full_name: "", password: "", role: "staff" });
      } else {
        const data = await response.json();
        setError(data.error || "Failed to add user");
      }
    } catch {
      setError("Failed to add user");
    } finally {
      setAddingUser(false);
    }
  }

  async function handleRemoveUser(memberId: string) {
    if (!organization || !confirm("Are you sure you want to remove this user?")) return;

    try {
      const response = await fetch(`/api/admin/organizations/users?id=${memberId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setOrgUsers((prev) => prev.filter((u) => u.id !== memberId));
      } else {
        setError("Failed to remove user");
      }
    } catch {
      setError("Failed to remove user");
    }
  }

  async function handleSave() {
    if (!organization) return;
    setSaving(true);

    try {
      const response = await fetch("/api/admin/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: organization.id,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          deal_value: editForm.deal_value,
          sales_funnel_stage: editForm.sales_funnel_stage,
          subscription_tier: editForm.subscription_tier,
          subscription_status: editForm.subscription_status,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrganization({ ...organization, ...data.organization });
        setIsEditing(false);
      } else {
        setError("Failed to save changes");
      }
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat("en-CH", {
      style: "currency",
      currency: "CHF",
    }).format(value || 0);
  };

  const getStageBadge = (stageId: string | null) => {
    const stage = FUNNEL_STAGES.find((s) => s.id === (stageId || "new_signup"));
    return stage || FUNNEL_STAGES[0];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Organization not found"}</p>
          <Link href="/admin" className="text-sky-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const stageBadge = getStageBadge(organization.sales_funnel_stage);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/logos/aliice-logo.png" alt="Aliice Logo" width={100} height={32} />
            <span className="text-slate-300">|</span>
            <span className="text-sm font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded">
              Organization Details
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(organization);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-sky-100 rounded-xl">
                  <Building2 className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="text-2xl font-bold text-slate-900 border-b-2 border-sky-500 focus:outline-none"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-slate-900">{organization.name}</h1>
                  )}
                  <p className="text-slate-500">/{organization.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${stageBadge.color}`}>
                  {stageBadge.label}
                </span>
                <span className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-600">
                  {organization.subscription_tier || "free"} · {organization.subscription_status || "trialing"}
                </span>
              </div>
            </div>
            <a
              href={`https://aliice.app/${organization.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sky-600 hover:bg-sky-50 rounded-lg"
            >
              <ExternalLink className="w-4 h-4" />
              View Live
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                {isEditing ? (
                  <input
                    type="number"
                    value={editForm.deal_value || 0}
                    onChange={(e) => setEditForm({ ...editForm, deal_value: parseFloat(e.target.value) || 0 })}
                    className="text-2xl font-bold text-slate-900 w-32 border-b-2 border-sky-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(organization.deal_value)}
                  </p>
                )}
                <p className="text-sm text-slate-500">Deal Value</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.patientCount}</p>
                <p className="text-sm text-slate-500">Patients</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.userCount}</p>
                <p className="text-sm text-slate-500">Team Members</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.appointmentCount}</p>
                <p className="text-sm text-slate-500">Appointments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Email"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                ) : (
                  <span className="text-slate-600">{organization.email || "No email"}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-400" />
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone || ""}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="Phone"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                ) : (
                  <span className="text-slate-600">{organization.phone || "No phone"}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600">{organization.website || "No website"}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div className="text-slate-600">
                  {organization.street_address ? (
                    <>
                      <p>{organization.street_address}</p>
                      <p>
                        {organization.postal_code} {organization.city}
                      </p>
                      <p>{organization.country}</p>
                    </>
                  ) : (
                    "No address"
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Subscription & Sales */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Subscription & Sales</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sales Funnel Stage
                </label>
                {isEditing ? (
                  <select
                    value={editForm.sales_funnel_stage || "new_signup"}
                    onChange={(e) => setEditForm({ ...editForm, sales_funnel_stage: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {FUNNEL_STAGES.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${stageBadge.color}`}>
                    {stageBadge.label}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subscription Tier
                </label>
                {isEditing ? (
                  <select
                    value={editForm.subscription_tier || "free"}
                    onChange={(e) => setEditForm({ ...editForm, subscription_tier: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                ) : (
                  <span className="text-slate-600 capitalize">
                    {organization.subscription_tier || "free"}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subscription Status
                </label>
                {isEditing ? (
                  <select
                    value={editForm.subscription_status || "trialing"}
                    onChange={(e) => setEditForm({ ...editForm, subscription_status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="trialing">Trialing</option>
                    <option value="active">Active</option>
                    <option value="past_due">Past Due</option>
                    <option value="canceled">Canceled</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                ) : (
                  <span className="text-slate-600 capitalize">
                    {organization.subscription_status || "trialing"}
                  </span>
                )}
              </div>
              {organization.trial_ends_at && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <CreditCard className="w-4 h-4" />
                  Trial ends {formatDate(organization.trial_ends_at)}
                </div>
              )}
            </div>
          </div>

          {/* Owner Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Owner Information</h2>
            {organization.owner ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                    <span className="text-sky-600 font-semibold">
                      {(organization.owner.full_name || organization.owner.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {organization.owner.full_name || "No name"}
                    </p>
                    <p className="text-sm text-slate-500">{organization.owner.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">No owner assigned</p>
            )}
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-900">{formatDate(organization.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Last Updated</span>
                <span className="text-slate-900">{formatDate(organization.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Section */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Team Members</h2>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>

          {orgUsers.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No team members yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Joined</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orgUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                            <span className="text-sky-600 font-medium text-sm">
                              {(user.full_name || user.email)[0].toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-slate-900">{user.full_name || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full capitalize">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.is_active 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-red-100 text-red-700"
                        }`}>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Remove user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Add Team Member</h3>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUser({ email: "", full_name: "", password: "", role: "staff" });
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="John Smith"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john@clinic.com"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="staff">Staff</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUser({ email: "", full_name: "", password: "", role: "staff" });
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={addingUser || !newUser.email || !newUser.password}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
              >
                {addingUser ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
