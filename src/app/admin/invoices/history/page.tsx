"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  MoreVertical,
  Trash2,
  XCircle,
  CheckCircle2,
  Download,
  Receipt,
  Wallet,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Loader2,
  Plus,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

interface ClientInvoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  client_name: string;
  client_email: string | null;
  currency: string;
  total: number;
  paid_amount: number | null;
  status: string;
  invoice_type?: string | null;
  payrexx_payment_link: string | null;
  payrexx_payment_status: string | null;
  payrexx_gateway_id: number | null;
  last_sent_at: string | null;
  created_at: string;
  is_overdue?: boolean;
}

interface Stats {
  count: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueCount: number;
  overdueAmount: number;
  byStatus: Record<string, number>;
}

interface ApiResponse {
  invoices: ClientInvoice[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: Stats;
}

type SortKey = "created_at" | "issue_date" | "due_date" | "total" | "client_name" | "status" | "invoice_number";

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmtMoney(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Open", cls: "bg-slate-100 text-slate-600" },
  PAID: { label: "Paid", cls: "bg-emerald-50 text-emerald-700" },
  PARTIAL_LOSS: { label: "Partial", cls: "bg-amber-50 text-amber-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-rose-50 text-rose-600" },
};

const DATE_PRESETS = [
  { key: "all", label: "All time" },
  { key: "month", label: "This month" },
  { key: "30d", label: "Last 30 days" },
  { key: "quarter", label: "This quarter" },
  { key: "year", label: "This year" },
] as const;

function presetRange(key: string): { from: string; to: string } {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().split("T")[0];
  const today = iso(now);
  switch (key) {
    case "month":
      return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
    case "30d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { from: iso(d), to: today };
    }
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      return { from: iso(new Date(now.getFullYear(), q * 3, 1)), to: today };
    }
    case "year":
      return { from: iso(new Date(now.getFullYear(), 0, 1)), to: today };
    default:
      return { from: "", to: "" };
  }
}

const CURRENCIES = ["USD", "EUR", "AED", "GBP", "CHF", "SAR"];

// ─── Component ──────────────────────────────────────────────────────────────

export default function ClientInvoiceHistoryPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // ALL | OPEN | PAID | PARTIAL_LOSS | CANCELLED | OVERDUE
  const [typeFilter, setTypeFilter] = useState<string>("ALL"); // ALL | manual | subscription
  const [currency, setCurrency] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [sort, setSort] = useState<SortKey>("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const buildParams = useCallback(
    (overrides?: Record<string, string>) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (statusFilter === "OVERDUE") params.set("overdue", "1");
      else if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (currency) params.set("currency", currency);
      const range = datePreset === "custom" ? { from: customFrom, to: customTo } : presetRange(datePreset);
      if (range.from) params.set("from", range.from);
      if (range.to) params.set("to", range.to);
      if (minAmount) params.set("minAmount", minAmount);
      if (maxAmount) params.set("maxAmount", maxAmount);
      params.set("sort", sort);
      params.set("order", order);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (overrides) for (const [k, v] of Object.entries(overrides)) params.set(k, v);
      return params;
    },
    [q, statusFilter, typeFilter, currency, datePreset, customFrom, customTo, minAmount, maxAmount, sort, order, page, pageSize]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/client-invoices?${buildParams().toString()}`);
      if (res.status === 401) {
        setError("Not authorized. Please sign in to the admin area.");
        setData(null);
        return;
      }
      const json = (await res.json()) as ApiResponse;
      if (!res.ok) throw new Error((json as unknown as { error?: string }).error || "Failed to load");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dominantCurrency = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const inv of data?.invoices || []) counts[inv.currency] = (counts[inv.currency] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "USD";
  }, [data]);

  const multiCurrency = useMemo(() => {
    const set = new Set((data?.invoices || []).map((i) => i.currency));
    return set.size > 1;
  }, [data]);

  const toggleSort = (key: SortKey) => {
    if (sort === key) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setOrder("desc");
    }
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput("");
    setQ("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setCurrency("");
    setDatePreset("all");
    setCustomFrom("");
    setCustomTo("");
    setMinAmount("");
    setMaxAmount("");
    setPage(1);
  };

  const activeFilterCount =
    (currency ? 1 : 0) +
    (datePreset !== "all" ? 1 : 0) +
    (minAmount ? 1 : 0) +
    (maxAmount ? 1 : 0);

  // ── Row actions ──
  const copyLink = async (inv: ClientInvoice) => {
    if (!inv.payrexx_payment_link) return;
    await navigator.clipboard.writeText(inv.payrexx_payment_link);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId((c) => (c === inv.id ? null : c)), 1800);
  };

  const refreshStatus = async (inv: ClientInvoice) => {
    setBusyId(inv.id);
    setOpenMenuId(null);
    try {
      const res = await fetch(`/api/admin/client-invoices/${inv.id}`, { method: "POST" });
      if (res.ok) await fetchData();
      else {
        const j = await res.json();
        alert(j.error || "Failed to refresh status");
      }
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = async (inv: ClientInvoice, status: string) => {
    setBusyId(inv.id);
    setOpenMenuId(null);
    try {
      const res = await fetch(`/api/admin/client-invoices/${inv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await fetchData();
    } finally {
      setBusyId(null);
    }
  };

  const deleteInvoice = async (inv: ClientInvoice) => {
    if (!confirm(`Delete invoice ${inv.invoice_number}? This cannot be undone.`)) return;
    setBusyId(inv.id);
    setOpenMenuId(null);
    try {
      const res = await fetch(`/api/admin/client-invoices/${inv.id}`, { method: "DELETE" });
      if (res.ok) await fetchData();
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      // Pull all filtered rows across pages (API caps pageSize at 100).
      const all: ClientInvoice[] = [];
      const first = await fetch(`/api/admin/client-invoices?${buildParams({ page: "1", pageSize: "100" }).toString()}`);
      const firstJson = (await first.json()) as ApiResponse;
      all.push(...(firstJson.invoices || []));
      for (let p = 2; p <= (firstJson.totalPages || 1); p++) {
        const r = await fetch(`/api/admin/client-invoices?${buildParams({ page: String(p), pageSize: "100" }).toString()}`);
        const j = (await r.json()) as ApiResponse;
        all.push(...(j.invoices || []));
      }
      const headers = ["Invoice #", "Client", "Email", "Issue date", "Due date", "Currency", "Total", "Paid", "Status", "Payment link"];
      const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines = [headers.join(",")];
      for (const inv of all) {
        lines.push(
          [
            inv.invoice_number,
            inv.client_name,
            inv.client_email || "",
            inv.issue_date,
            inv.due_date || "",
            inv.currency,
            Number(inv.total).toFixed(2),
            Number(inv.paid_amount || 0).toFixed(2),
            inv.is_overdue && inv.status !== "PAID" ? "OVERDUE" : inv.status,
            inv.payrexx_payment_link || "",
          ]
            .map(escape)
            .join(",")
        );
      }
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `client-invoices-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const stats = data?.stats;
  const invoices = data?.invoices || [];

  const kpiFmt = (n: number) => (multiCurrency ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : fmtMoney(n, dominantCurrency));

  const SortHeader = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className={`inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-800 transition ${className || ""}`}
    >
      {label}
      {sort === k ? (
        order === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
      ) : (
        <ArrowDown className="w-3 h-3 opacity-20" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50" onClick={() => setOpenMenuId(null)}>
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/admin/invoices" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Generator
          </Link>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-sky-600" />
            <h1 className="font-semibold text-slate-900 text-lg">Client Invoices</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={exporting || invoices.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
          <Link
            href="/admin/invoices"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Receipt className="w-4 h-4" />}
            tint="sky"
            label="Total invoiced"
            value={stats ? kpiFmt(stats.totalAmount) : "—"}
            sub={stats ? `${stats.count} invoice${stats.count === 1 ? "" : "s"}` : ""}
          />
          <KpiCard
            icon={<Wallet className="w-4 h-4" />}
            tint="emerald"
            label="Collected"
            value={stats ? kpiFmt(stats.paidAmount) : "—"}
            sub={stats ? `${stats.byStatus.PAID || 0} paid` : ""}
          />
          <KpiCard
            icon={<Clock className="w-4 h-4" />}
            tint="amber"
            label="Outstanding"
            value={stats ? kpiFmt(stats.outstandingAmount) : "—"}
            sub={stats ? `${(stats.byStatus.OPEN || 0) + (stats.byStatus.PARTIAL_LOSS || 0)} unpaid` : ""}
          />
          <KpiCard
            icon={<AlertTriangle className="w-4 h-4" />}
            tint="rose"
            label="Overdue"
            value={stats ? kpiFmt(stats.overdueAmount) : "—"}
            sub={stats ? `${stats.overdueCount} overdue` : ""}
          />
        </div>
        {multiCurrency && (
          <p className="text-[11px] text-slate-400 -mt-2">Totals are summed across multiple currencies and shown unformatted.</p>
        )}

        {/* Search + quick chips + filters toggle */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by invoice #, client name or email…"
                className="w-full rounded-xl border border-slate-200 pl-10 pr-9 py-2.5 text-sm text-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition placeholder:text-slate-400"
              />
              {searchInput && (
                <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${
                showFilters || activeFilterCount > 0
                  ? "bg-sky-50 border-sky-200 text-sky-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Quick status chips */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { k: "ALL", label: "All" },
              { k: "OPEN", label: "Open" },
              { k: "PAID", label: "Paid" },
              { k: "PARTIAL_LOSS", label: "Partial" },
              { k: "OVERDUE", label: "Overdue" },
              { k: "CANCELLED", label: "Cancelled" },
            ].map((c) => (
              <button
                key={c.k}
                onClick={() => {
                  setStatusFilter(c.k);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  statusFilter === c.k ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c.label}
                {c.k !== "ALL" && c.k !== "OVERDUE" && stats ? (
                  <span className="ml-1.5 opacity-70">{stats.byStatus[c.k] || 0}</span>
                ) : c.k === "OVERDUE" && stats ? (
                  <span className="ml-1.5 opacity-70">{stats.overdueCount}</span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mr-1">Type</span>
            {[
              { k: "ALL", label: "All" },
              { k: "manual", label: "Manual" },
              { k: "subscription", label: "Subscription" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => {
                  setTypeFilter(t.k);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  typeFilter === t.k ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Date range</label>
                <select
                  value={datePreset}
                  onChange={(e) => {
                    setDatePreset(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
                >
                  {DATE_PRESETS.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                  <option value="custom">Custom…</option>
                </select>
              </div>
              {datePreset === "custom" && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">From</label>
                    <input type="date" value={customFrom} onChange={(e) => { setCustomFrom(e.target.value); setPage(1); }} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">To</label>
                    <input type="date" value={customTo} onChange={(e) => { setCustomTo(e.target.value); setPage(1); }} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Currency</label>
                <select value={currency} onChange={(e) => { setCurrency(e.target.value); setPage(1); }} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none">
                  <option value="">Any</option>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Min</label>
                  <input type="number" value={minAmount} onChange={(e) => { setMinAmount(e.target.value); setPage(1); }} placeholder="0" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Max</label>
                  <input type="number" value={maxAmount} onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }} placeholder="∞" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none" />
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button onClick={resetFilters} className="text-xs font-semibold text-slate-500 hover:text-slate-800">Reset all filters</button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {error ? (
            <div className="p-12 text-center text-sm text-rose-600">{error}</div>
          ) : loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span className="text-sm">Loading invoices…</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-16 text-center">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">No invoices found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs">
                    <th className="px-4 py-3"><SortHeader k="invoice_number" label="Invoice" /></th>
                    <th className="px-4 py-3"><SortHeader k="client_name" label="Client" /></th>
                    <th className="px-4 py-3"><SortHeader k="issue_date" label="Issued" /></th>
                    <th className="px-4 py-3"><SortHeader k="due_date" label="Due" /></th>
                    <th className="px-4 py-3 text-right"><SortHeader k="total" label="Amount" className="justify-end" /></th>
                    <th className="px-4 py-3"><SortHeader k="status" label="Status" /></th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const meta = STATUS_META[inv.status] || STATUS_META.OPEN;
                    const overdue = inv.is_overdue && inv.status !== "PAID" && inv.status !== "CANCELLED";
                    return (
                      <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800">{inv.invoice_number}</span>
                          {inv.invoice_type === "subscription" && (
                            <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 align-middle">SUB</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{inv.client_name}</div>
                          {inv.client_email && <div className="text-xs text-slate-400">{inv.client_email}</div>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{fmtDate(inv.issue_date)}</td>
                        <td className="px-4 py-3">
                          <span className={overdue ? "text-rose-600 font-semibold" : "text-slate-600"}>{fmtDate(inv.due_date)}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmtMoney(Number(inv.total), inv.currency)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.cls}`}>
                              {inv.status === "PAID" && <CheckCircle2 className="w-3 h-3" />}
                              {meta.label}
                            </span>
                            {overdue && <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">OVERDUE</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {inv.payrexx_payment_link && (
                              <>
                                <a
                                  href={inv.payrexx_payment_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Open pay link"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => copyLink(inv)}
                                  title="Copy pay link"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                >
                                  {copiedId === inv.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </>
                            )}
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === inv.id ? null : inv.id)}
                                disabled={busyId === inv.id}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              >
                                {busyId === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                              </button>
                              {openMenuId === inv.id && (
                                <div className="absolute right-0 top-full mt-1 z-30 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                                  <MenuItem icon={<RefreshCw className="w-3.5 h-3.5" />} label="Refresh status" onClick={() => refreshStatus(inv)} disabled={!inv.payrexx_gateway_id} />
                                  {inv.status !== "PAID" && <MenuItem icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Mark as paid" onClick={() => setStatus(inv, "PAID")} />}
                                  {inv.status !== "CANCELLED" ? (
                                    <MenuItem icon={<XCircle className="w-3.5 h-3.5" />} label="Cancel invoice" onClick={() => setStatus(inv, "CANCELLED")} />
                                  ) : (
                                    <MenuItem icon={<RefreshCw className="w-3.5 h-3.5" />} label="Reopen" onClick={() => setStatus(inv, "OPEN")} />
                                  )}
                                  <div className="my-1 h-px bg-slate-100" />
                                  <MenuItem icon={<Trash2 className="w-3.5 h-3.5" />} label="Delete" onClick={() => deleteInvoice(inv)} danger />
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-sky-400"
                >
                  {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span>
                  {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={data.page <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-semibold text-slate-700">{data.page} / {data.totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={data.page >= data.totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tint: "sky" | "emerald" | "amber" | "rose";
}) {
  const tints: Record<string, string> = {
    sky: "bg-sky-50 text-sky-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${tints[tint]}`}>{icon}</span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-xl font-bold text-slate-900 truncate">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
        danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
