"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Columns3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Trash2,
  X,
  Check,
} from "lucide-react";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  street_address: string | null;
  city: string | null;
  country: string | null;
  google_maps_link: string | null;
  specialties: string[] | null;
  languages: string[] | null;
  notes: string | null;
  multiple_centers: boolean | null;
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

export interface FunnelStage {
  id: string;
  label: string;
  color: string;
}

type ColumnKey =
  | "name"
  | "email"
  | "phone"
  | "city"
  | "country"
  | "specialties"
  | "sales_funnel_stage"
  | "subscription_tier"
  | "subscription_status"
  | "deal_value"
  | "owner"
  | "created_at";

interface ColumnDef {
  key: ColumnKey;
  label: string;
  sortable: boolean;
  editable?: boolean;
  always?: boolean; // cannot be hidden
}

const COLUMNS: ColumnDef[] = [
  { key: "name", label: "Organization", sortable: true, always: true },
  { key: "sales_funnel_stage", label: "Stage", sortable: true, editable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "phone", label: "Phone", sortable: false },
  { key: "city", label: "City", sortable: true },
  { key: "country", label: "Country", sortable: true },
  { key: "specialties", label: "Specialties", sortable: false },
  { key: "subscription_tier", label: "Tier", sortable: true, editable: true },
  { key: "subscription_status", label: "Status", sortable: true },
  { key: "deal_value", label: "Deal Value", sortable: true, editable: true },
  { key: "owner", label: "Owner", sortable: true },
  { key: "created_at", label: "Created", sortable: true },
];

const DEFAULT_VISIBLE: ColumnKey[] = [
  "name",
  "sales_funnel_stage",
  "email",
  "phone",
  "subscription_tier",
  "deal_value",
  "created_at",
];

const STORAGE_KEY = "aliice.pipeline.listColumns";

const TIER_OPTIONS = ["free", "starter", "professional", "enterprise"];
const STATUS_OPTIONS = ["trialing", "active", "past_due", "canceled"];

const tierBadge: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  starter: "bg-blue-100 text-blue-700",
  professional: "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
};

export default function PipelineListView({
  organizations,
  stages,
  updateOrgStage,
  updateOrgField,
  deleteOrg,
  formatDate,
  formatCurrency,
}: {
  organizations: Organization[];
  stages: FunnelStage[];
  updateOrgStage: (orgId: string, newStage: string) => void;
  updateOrgField: (orgId: string, field: string, value: unknown) => void;
  deleteOrg: (orgId: string) => void;
  formatDate: (date: string) => string;
  formatCurrency: (value: number) => string;
}) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [tierFilter, setTierFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [sortKey, setSortKey] = useState<ColumnKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visibleCols, setVisibleCols] = useState<ColumnKey[]>(DEFAULT_VISIBLE);
  const [editingCell, setEditingCell] = useState<{ id: string; key: ColumnKey } | null>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Load persisted column preferences
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ColumnKey[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVisibleCols(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const persistCols = (cols: ColumnKey[]) => {
    setVisibleCols(cols);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cols));
    } catch {
      // ignore
    }
  };

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setShowColumns(false);
      }
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const stageLabel = (id: string | null) =>
    stages.find((s) => s.id === (id || "new_signup"))?.label || id || "—";

  const toggleFromArray = (arr: string[], value: string, setter: (v: string[]) => void) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const activeFilterCount =
    stageFilter.length + tierFilter.length + statusFilter.length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = organizations.filter((o) => {
      if (q) {
        const haystack = [o.name, o.email, o.phone, o.slug, o.city, o.country]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (stageFilter.length > 0 && !stageFilter.includes(o.sales_funnel_stage || "new_signup")) {
        return false;
      }
      if (tierFilter.length > 0 && !tierFilter.includes(o.subscription_tier || "free")) {
        return false;
      }
      if (statusFilter.length > 0 && !statusFilter.includes(o.subscription_status || "")) {
        return false;
      }
      if (dateFrom && new Date(o.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(o.created_at) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });

    rows = [...rows].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      switch (sortKey) {
        case "deal_value":
          av = a.deal_value || 0;
          bv = b.deal_value || 0;
          break;
        case "created_at":
          av = new Date(a.created_at).getTime();
          bv = new Date(b.created_at).getTime();
          break;
        case "owner":
          av = a.owner?.full_name || "";
          bv = b.owner?.full_name || "";
          break;
        case "sales_funnel_stage":
          av = stageLabel(a.sales_funnel_stage);
          bv = stageLabel(b.sales_funnel_stage);
          break;
        default: {
          av = ((a[sortKey as keyof Organization] as string) || "").toString().toLowerCase();
          bv = ((b[sortKey as keyof Organization] as string) || "").toString().toLowerCase();
        }
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizations, search, stageFilter, tierFilter, statusFilter, dateFrom, dateTo, sortKey, sortDir]);

  const handleSort = (key: ColumnKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const orderedVisibleCols = COLUMNS.filter((c) => visibleCols.includes(c.key) || c.always);

  const clearFilters = () => {
    setStageFilter([]);
    setTierFilter([]);
    setStatusFilter([]);
    setDateFrom("");
    setDateTo("");
  };

  const renderCell = (org: Organization, col: ColumnDef) => {
    const isEditing = editingCell?.id === org.id && editingCell?.key === col.key;

    switch (col.key) {
      case "name":
        return (
          <div className="min-w-0">
            <div className="font-medium text-slate-900 truncate">{org.name}</div>
            <div className="text-xs text-slate-400 truncate">/{org.slug}</div>
          </div>
        );
      case "sales_funnel_stage":
        return (
          <select
            value={org.sales_funnel_stage || "new_signup"}
            onChange={(e) => updateOrgStage(org.id, e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        );
      case "subscription_tier":
        return (
          <select
            value={org.subscription_tier || "free"}
            onChange={(e) => updateOrgField(org.id, "subscription_tier", e.target.value)}
            className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 focus:outline-none focus:ring-1 focus:ring-sky-500 ${
              tierBadge[org.subscription_tier || "free"]
            }`}
          >
            {TIER_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        );
      case "subscription_status":
        return <span className="text-slate-600 capitalize">{org.subscription_status || "—"}</span>;
      case "deal_value":
        return isEditing ? (
          <input
            type="number"
            autoFocus
            defaultValue={org.deal_value || 0}
            onBlur={(e) => {
              updateOrgField(org.id, "deal_value", parseFloat(e.target.value) || 0);
              setEditingCell(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setEditingCell(null);
            }}
            className="w-24 rounded-md border border-sky-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        ) : (
          <button
            onClick={() => setEditingCell({ id: org.id, key: "deal_value" })}
            className="text-slate-700 hover:text-sky-600 hover:underline"
          >
            {formatCurrency(org.deal_value || 0)}
          </button>
        );
      case "specialties":
        return (
          <div className="flex flex-wrap gap-1">
            {(org.specialties || []).slice(0, 3).map((s) => (
              <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                {s}
              </span>
            ))}
            {(org.specialties || []).length > 3 && (
              <span className="text-[10px] text-slate-400">+{(org.specialties || []).length - 3}</span>
            )}
          </div>
        );
      case "owner":
        return <span className="text-slate-600">{org.owner?.full_name || "—"}</span>;
      case "created_at":
        return <span className="text-slate-500">{formatDate(org.created_at)}</span>;
      case "email":
        return <span className="text-slate-600 truncate block max-w-[220px]">{org.email || "—"}</span>;
      case "phone":
        return <span className="text-slate-600">{org.phone || "—"}</span>;
      case "city":
        return <span className="text-slate-600">{org.city || "—"}</span>;
      case "country":
        return <span className="text-slate-600">{org.country || "—"}</span>;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Smart search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, city..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Filters */}
        <div className="relative" ref={filtersRef}>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              activeFilterCount > 0
                ? "border-sky-300 bg-sky-50 text-sky-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-sky-600 px-1.5 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          {showFilters && (
            <div className="absolute right-0 z-50 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
              <div className="mb-3">
                <p className="mb-1.5 text-xs font-semibold text-slate-700">Stage</p>
                <div className="flex flex-wrap gap-1.5">
                  {stages.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => toggleFromArray(stageFilter, s.id, setStageFilter)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition ${
                        stageFilter.includes(s.id)
                          ? "border-sky-300 bg-sky-100 text-sky-700"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <p className="mb-1.5 text-xs font-semibold text-slate-700">Tier</p>
                <div className="flex flex-wrap gap-1.5">
                  {TIER_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleFromArray(tierFilter, t, setTierFilter)}
                      className={`rounded-full border px-2.5 py-1 text-xs capitalize transition ${
                        tierFilter.includes(t)
                          ? "border-sky-300 bg-sky-100 text-sky-700"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <p className="mb-1.5 text-xs font-semibold text-slate-700">Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleFromArray(statusFilter, s, setStatusFilter)}
                      className={`rounded-full border px-2.5 py-1 text-xs capitalize transition ${
                        statusFilter.includes(s)
                          ? "border-sky-300 bg-sky-100 text-sky-700"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-700">Created from</p>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-700">Created to</p>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Columns picker */}
        <div className="relative" ref={columnsRef}>
          <button
            onClick={() => setShowColumns((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <Columns3 className="h-4 w-4" />
            Columns
          </button>
          {showColumns && (
            <div className="absolute right-0 z-50 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <p className="px-2 py-1 text-xs font-semibold text-slate-500">Toggle columns</p>
              {COLUMNS.map((c) => {
                const checked = c.always || visibleCols.includes(c.key);
                return (
                  <button
                    key={c.key}
                    disabled={c.always}
                    onClick={() =>
                      persistCols(
                        visibleCols.includes(c.key)
                          ? visibleCols.filter((k) => k !== c.key)
                          : [...visibleCols, c.key]
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                      c.always ? "text-slate-400" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {c.label}
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        checked ? "border-sky-500 bg-sky-500 text-white" : "border-slate-300"
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="mb-2 text-xs text-slate-500">
        {filtered.length} {filtered.length === 1 ? "record" : "records"}
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              {orderedVisibleCols.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              <th className="w-24 px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((org) => (
              <tr key={org.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                {orderedVisibleCols.map((col) => (
                  <td key={col.key} className="px-4 py-3 align-middle">
                    {renderCell(org, col)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-sky-600"
                      title="View page"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete "${org.name}"? This permanently removes the record and cannot be undone.`
                          )
                        ) {
                          deleteOrg(org.id);
                        }
                      }}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={orderedVisibleCols.length + 1} className="px-4 py-12 text-center text-slate-400">
                  No organizations match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
