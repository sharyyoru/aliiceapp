"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Loader2,
  Receipt,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";

interface ClientInvoice {
  id: string;
  invoice_number: string;
  invoice_type?: string | null;
  issue_date: string;
  due_date: string | null;
  total: number;
  paid_amount: number | null;
  currency: string;
  status: string;
  payrexx_payment_link: string | null;
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

const STATUS_META: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Open", cls: "bg-slate-100 text-slate-600" },
  PAID: { label: "Paid", cls: "bg-emerald-50 text-emerald-700" },
  PARTIAL_LOSS: { label: "Partial", cls: "bg-amber-50 text-amber-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-rose-50 text-rose-600" },
};

function fmtMoney(v: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "CHF" }).format(v || 0);
  } catch {
    return `${(v || 0).toFixed(2)} ${currency || ""}`.trim();
  }
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function OrgInvoicesTab({ orgId }: { orgId: string }) {
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ organization_id: orgId, pageSize: "200" });
      if (q) params.set("q", q);
      if (statusFilter === "OVERDUE") params.set("overdue", "1");
      else if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      const res = await fetch(`/api/admin/client-invoices?${params.toString()}`);
      if (!res.ok) {
        setError(res.status === 401 ? "Not authorized." : "Failed to load invoices.");
        setInvoices([]);
        setStats(null);
        return;
      }
      const data = await res.json();
      setInvoices(data.invoices || []);
      setStats(data.stats || null);
    } catch {
      setError("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }, [orgId, q, statusFilter, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyLink = async (inv: ClientInvoice) => {
    if (!inv.payrexx_payment_link) return;
    await navigator.clipboard.writeText(inv.payrexx_payment_link);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId((c) => (c === inv.id ? null : c)), 1600);
  };

  const kpis = useMemo(
    () => [
      { label: "Invoices", value: stats ? String(stats.count) : "—" },
      { label: "Collected", value: stats ? fmtMoney(stats.paidAmount, invoices[0]?.currency || "CHF") : "—" },
      { label: "Outstanding", value: stats ? fmtMoney(stats.outstandingAmount, invoices[0]?.currency || "CHF") : "—" },
      { label: "Overdue", value: stats ? String(stats.overdueCount) : "—" },
    ],
    [stats, invoices]
  );

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border shadow-sm p-4">
            <p className="text-sm text-slate-500">{k.label}</p>
            <p className="text-xl font-bold text-slate-900">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search invoice #, amount, status…"
              className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
          >
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL_LOSS">Partial</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
          >
            <option value="ALL">All types</option>
            <option value="manual">Manual</option>
            <option value="subscription">Subscription</option>
          </select>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {error ? (
          <div className="p-10 text-center text-sm text-rose-600">{error}</div>
        ) : loading ? (
          <div className="p-10 flex flex-col items-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-sm">Loading invoices…</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No invoices found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-semibold">Invoice</th>
                  <th className="px-4 py-3 font-semibold">Issued</th>
                  <th className="px-4 py-3 font-semibold">Due</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Pay link</th>
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
                          <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 align-middle">
                            SUB
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{fmtDate(inv.issue_date)}</td>
                      <td className="px-4 py-3">
                        <span className={overdue ? "text-rose-600 font-semibold" : "text-slate-600"}>
                          {fmtDate(inv.due_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        {fmtMoney(Number(inv.total), inv.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${overdue ? "bg-rose-50 text-rose-600" : meta.cls}`}>
                          {overdue ? "Overdue" : meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.payrexx_payment_link ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => copyLink(inv)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                              title="Copy pay link"
                            >
                              {copiedId === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <a
                              href={inv.payrexx_payment_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-sky-600 hover:bg-sky-50 rounded-lg"
                              title="Open pay link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
