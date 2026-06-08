"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LogOut,
  RefreshCw,
  Building2,
  Users,
  GripVertical,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  ChevronRight,
  ArrowRightCircle,
  Check,
  TrendingUp,
  Clock,
  Plus,
  X,
  Loader2,
  Shield,
  DollarSign,
  Target,
  Wallet,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  sales_funnel_stage: string | null;
  deal_value: number | null;
  created_at: string;
  owner?: {
    id: string;
    email: string;
    full_name: string;
  } | null;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  created_at: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface FunnelStage {
  id: string;
  label: string;
  color: string;
}

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string; header: string }> = {
  slate: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", header: "bg-slate-100" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", header: "bg-blue-100" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", header: "bg-purple-100" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", header: "bg-amber-100" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", header: "bg-emerald-100" },
  red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", header: "bg-red-100" },
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pipeline" | "users">("pipeline");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedOrg, setDraggedOrg] = useState<Organization | null>(null);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    deal_value: 0,
    subscription_tier: "free",
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [orgRes, userRes] = await Promise.all([
        fetch("/api/admin/organizations"),
        fetch("/api/admin/users"),
      ]);

      if (orgRes.status === 401 || userRes.status === 401) {
        router.push("/admin/login");
        return;
      }

      const orgData = await orgRes.json();
      const userData = await userRes.json();

      setOrganizations(orgData.organizations || []);
      setStages(orgData.stages || []);
      setUsers(userData.users || []);
    } catch {
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  const updateOrgStage = async (orgId: string, newStage: string) => {
    try {
      const response = await fetch("/api/admin/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orgId, sales_funnel_stage: newStage }),
      });

      if (response.ok) {
        setOrganizations((prev) =>
          prev.map((o) => (o.id === orgId ? { ...o, sales_funnel_stage: newStage } : o))
        );
      }
    } catch {
      console.error("Failed to update stage");
    }
  };

  const handleDragStart = (org: Organization) => {
    setDraggedOrg(org);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stageId: string) => {
    if (draggedOrg && (draggedOrg.sales_funnel_stage || "new_signup") !== stageId) {
      updateOrgStage(draggedOrg.id, stageId);
    }
    setDraggedOrg(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getOrgsByStage = (stageId: string) => {
    return organizations.filter((o) => (o.sales_funnel_stage || "new_signup") === stageId);
  };

  const getSubscriptionBadge = (tier: string | null, status: string | null) => {
    const tierColors: Record<string, string> = {
      free: "bg-slate-100 text-slate-600",
      starter: "bg-blue-100 text-blue-700",
      professional: "bg-purple-100 text-purple-700",
      enterprise: "bg-amber-100 text-amber-700",
    };
    return tierColors[tier || "free"] || tierColors.free;
  };

  const handleCreateOrg = async () => {
    if (!newOrg.name || !newOrg.slug) return;
    setCreatingOrg(true);

    try {
      const response = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrg),
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations((prev) => [data.organization, ...prev]);
        setShowCreateOrgModal(false);
        setNewOrg({ name: "", slug: "", email: "", phone: "", deal_value: 0, subscription_tier: "free" });
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create organization");
      }
    } catch {
      setError("Failed to create organization");
    } finally {
      setCreatingOrg(false);
    }
  };

  // Stats
  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter((o) => o.subscription_status === "active").length;
  const trialingOrgs = organizations.filter((o) => o.subscription_status === "trialing").length;
  const thisWeekOrgs = organizations.filter((o) => {
    const created = new Date(o.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created > weekAgo;
  }).length;

  // Financial Stats
  const potentialDealValue = organizations.reduce((sum, o) => sum + (o.deal_value || 0), 0);
  const activeClientValue = organizations
    .filter((o) => o.sales_funnel_stage === "active")
    .reduce((sum, o) => sum + (o.deal_value || 0), 0);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/logos/aliice-logo.png"
              alt="Aliice Logo"
              width={100}
              height={32}
            />
            <span className="text-slate-300">|</span>
            <span className="text-sm font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeTab === "pipeline"
                  ? "bg-sky-100 text-sky-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Sales Pipeline
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeTab === "users"
                  ? "bg-sky-100 text-sky-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users className="w-4 h-4" />
              Users
              <span className="bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">
                {users.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/team"
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <Shield className="w-4 h-4" />
              Team
            </Link>
            <Link
              href="/admin/offer-letters"
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <FileText className="w-4 h-4" />
              Offer Letters
            </Link>
            <button
              onClick={() => setShowCreateOrgModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
            >
              <Plus className="w-4 h-4" />
              New Organization
            </button>
            <button
              onClick={fetchData}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Building2 className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalOrgs}</p>
                <p className="text-sm text-slate-500">Total Organizations</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeOrgs}</p>
                <p className="text-sm text-slate-500">Active Clients</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{trialingOrgs}</p>
                <p className="text-sm text-slate-500">In Trial</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{thisWeekOrgs}</p>
                <p className="text-sm text-slate-500">New This Week</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(potentialDealValue)}</p>
                <p className="text-sm text-slate-500">Potential Value</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(activeClientValue)}</p>
                <p className="text-sm text-slate-500">Active Revenue</p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
          </div>
        ) : activeTab === "pipeline" ? (
          <PipelineView
            organizations={organizations}
            stages={stages}
            getOrgsByStage={getOrgsByStage}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            draggedOrg={draggedOrg}
            formatDate={formatDate}
            getSubscriptionBadge={getSubscriptionBadge}
            updateOrgStage={updateOrgStage}
          />
        ) : (
          <UsersView users={users} formatDate={formatDate} />
        )}
      </main>

      {/* Create Organization Modal */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Create Organization</h3>
              <button
                onClick={() => {
                  setShowCreateOrgModal(false);
                  setNewOrg({ name: "", slug: "", email: "", phone: "", deal_value: 0, subscription_tier: "free" });
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })}
                  placeholder="Acme Clinic"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="text-slate-400 text-sm mr-1">/</span>
                  <input
                    type="text"
                    value={newOrg.slug}
                    onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    placeholder="acme-clinic"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newOrg.email}
                  onChange={(e) => setNewOrg({ ...newOrg, email: e.target.value })}
                  placeholder="contact@acme-clinic.com"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newOrg.phone}
                  onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                  placeholder="+41 00 000 00 00"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Deal Value (CHF)
                  </label>
                  <input
                    type="number"
                    value={newOrg.deal_value}
                    onChange={(e) => setNewOrg({ ...newOrg, deal_value: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={newOrg.subscription_tier}
                    onChange={(e) => setNewOrg({ ...newOrg, subscription_tier: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateOrgModal(false);
                  setNewOrg({ name: "", slug: "", email: "", phone: "", deal_value: 0, subscription_tier: "free" });
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrg}
                disabled={creatingOrg || !newOrg.name || !newOrg.slug}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
              >
                {creatingOrg ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create
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

function PipelineView({
  organizations,
  stages,
  getOrgsByStage,
  handleDragStart,
  handleDragOver,
  handleDrop,
  draggedOrg,
  formatDate,
  getSubscriptionBadge,
  updateOrgStage,
}: {
  organizations: Organization[];
  stages: FunnelStage[];
  getOrgsByStage: (stageId: string) => Organization[];
  handleDragStart: (org: Organization) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (stageId: string) => void;
  draggedOrg: Organization | null;
  formatDate: (date: string) => string;
  getSubscriptionBadge: (tier: string | null, status: string | null) => string;
  updateOrgStage: (orgId: string, newStage: string) => void;
}) {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">Sales Pipeline</h1>
        <p className="text-sm text-slate-500">
          Drag organizations between stages to track their progress
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageOrgs = getOrgsByStage(stage.id);
          const stageColors = STAGE_COLORS[stage.color] || STAGE_COLORS.slate;

          return (
            <div
              key={stage.id}
              className={`flex-shrink-0 w-80 rounded-xl border ${stageColors.border} ${
                draggedOrg ? "border-dashed border-2" : ""
              }`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
            >
              <div className={`px-4 py-3 border-b ${stageColors.header} rounded-t-xl`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${stageColors.text}`}>{stage.label}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${stageColors.bg} ${stageColors.text}`}>
                      {stageOrgs.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`p-3 space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto ${stageColors.bg}`}>
                {stageOrgs.map((org) => (
                  <OrgCard
                    key={org.id}
                    org={org}
                    stages={stages}
                    onDragStart={() => handleDragStart(org)}
                    formatDate={formatDate}
                    getSubscriptionBadge={getSubscriptionBadge}
                    onMoveToStage={(stageId) => updateOrgStage(org.id, stageId)}
                  />
                ))}
                {stageOrgs.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No organizations
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrgCard({
  org,
  stages,
  onDragStart,
  formatDate,
  getSubscriptionBadge,
  onMoveToStage,
}: {
  org: Organization;
  stages: FunnelStage[];
  onDragStart: () => void;
  formatDate: (date: string) => string;
  getSubscriptionBadge: (tier: string | null, status: string | null) => string;
  onMoveToStage: (stageId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleOpenMenu = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 4, left: rect.right - 160 });
    }
    setShowActions(!showActions);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition cursor-grab active:cursor-grabbing"
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
            <div className="min-w-0">
              <h4 className="font-medium text-slate-900 truncate">{org.name}</h4>
              <p className="text-xs text-slate-500 truncate">/{org.slug}</p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
              ref={buttonRef}
              onClick={handleOpenMenu}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {showActions && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => { setShowActions(false); setShowMoveMenu(false); }} />
                <div 
                  className="fixed w-40 bg-white rounded-lg shadow-lg border z-50 py-1"
                  style={{ top: menuPosition.top, left: menuPosition.left }}
                >
                  <Link
                    href={`/admin/organizations/${org.id}`}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Page
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setShowMoveMenu(!showMoveMenu)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-2">
                        <ArrowRightCircle className="w-4 h-4" />
                        Move to
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {showMoveMenu && (
                      <div className="absolute left-full top-0 ml-1 w-40 bg-white rounded-lg shadow-lg border z-50 py-1">
                        {stages.map((stage) => (
                          <button
                            key={stage.id}
                            onClick={() => {
                              onMoveToStage(stage.id);
                              setShowActions(false);
                              setShowMoveMenu(false);
                            }}
                            disabled={stage.id === (org.sales_funnel_stage || "new_signup")}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 ${
                              stage.id === (org.sales_funnel_stage || "new_signup")
                                ? "text-slate-400"
                                : "text-slate-700"
                            }`}
                          >
                            {stage.id === (org.sales_funnel_stage || "new_signup") && (
                              <Check className="w-4 h-4 text-emerald-500" />
                            )}
                            {stage.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-sm">
          {org.owner && (
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="w-3.5 h-3.5" />
              <span className="truncate">{org.owner.full_name || org.owner.email}</span>
            </div>
          )}
          {org.email && (
            <div className="flex items-center gap-2 text-slate-500">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate">{org.email}</span>
            </div>
          )}
          {org.phone && (
            <div className="flex items-center gap-2 text-slate-500">
              <Phone className="w-3.5 h-3.5" />
              <span>{org.phone}</span>
            </div>
          )}
          {org.deal_value !== null && org.deal_value > 0 && (
            <div className="flex items-center gap-2 text-emerald-600 font-medium">
              <DollarSign className="w-3.5 h-3.5" />
              <span>CHF {org.deal_value.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className={`text-xs px-2 py-1 rounded-full ${getSubscriptionBadge(org.subscription_tier, org.subscription_status)}`}>
            {org.subscription_tier || "free"} · {org.subscription_status || "trialing"}
          </span>
          <span className="text-xs text-slate-400">{formatDate(org.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

function UsersView({ users, formatDate }: { users: User[]; formatDate: (date: string) => string }) {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">Registered Users</h1>
        <p className="text-sm text-slate-500">All users who have signed up on the platform</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">
                User
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">
                Email
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">
                Organization
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">
                Role
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{user.full_name || "-"}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-600">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  {user.organization ? (
                    <div className="text-sm">
                      <span className="text-slate-900">{user.organization.name}</span>
                      <span className="text-slate-400 ml-1">/{user.organization.slug}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">No organization</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full capitalize">
                    {user.role || "staff"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-500">{formatDate(user.created_at)}</span>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
