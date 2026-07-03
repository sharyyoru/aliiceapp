"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Loader2,
  Mail,
  Send,
  Inbox,
  Eye,
  X,
  RefreshCw,
  AlertCircle,
  CornerUpLeft,
} from "lucide-react";

interface OrgEmail {
  id: string;
  direction: "inbound" | "outbound" | string;
  status: string;
  subject: string;
  to_address: string | null;
  from_address: string | null;
  body: string;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

interface EmailStats {
  total: number;
  sent: number;
  received: number;
  read: number;
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(email: OrgEmail): { label: string; cls: string } {
  if (email.direction === "inbound") return { label: "Received", cls: "bg-violet-50 text-violet-700" };
  if (email.status === "failed") return { label: "Failed", cls: "bg-rose-50 text-rose-600" };
  if (email.status === "read" || email.read_at) return { label: "Read", cls: "bg-emerald-50 text-emerald-700" };
  if (email.status === "queued" || email.status === "sending") return { label: "Queued", cls: "bg-amber-50 text-amber-700" };
  return { label: "Sent", cls: "bg-sky-50 text-sky-700" };
}

export default function OrgEmailsTab({
  orgId,
  orgEmail,
  orgName,
}: {
  orgId: string;
  orgEmail: string | null;
  orgName: string;
}) {
  const [emails, setEmails] = useState<OrgEmail[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL | outbound | inbound | read

  const [selected, setSelected] = useState<OrgEmail | null>(null);

  const [composeOpen, setComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ to: orgEmail || "", subject: "", body: "" });
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [composeError, setComposeError] = useState<string | null>(null);

  const [gmail, setGmail] = useState<{ configured: boolean; connected: boolean; googleEmail: string | null }>({
    configured: false,
    connected: false,
    googleEmail: null,
  });
  const [syncing, setSyncing] = useState(false);

  const fetchGmailStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/gmail/status");
      if (res.ok) setGmail(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchGmailStatus();
  }, [fetchGmailStatus]);

  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ organization_id: orgId });
      if (q) params.set("q", q);
      if (filter === "outbound" || filter === "inbound") params.set("direction", filter);
      else if (filter === "read") params.set("status", "read");
      const res = await fetch(`/api/admin/organizations/emails?${params.toString()}`);
      if (!res.ok) {
        setError(res.status === 401 ? "Not authorized." : "Failed to load emails.");
        setEmails([]);
        setStats(null);
        return;
      }
      const data = await res.json();
      setEmails(data.emails || []);
      setStats(data.stats || null);
    } catch {
      setError("Failed to load emails.");
    } finally {
      setLoading(false);
    }
  }, [orgId, q, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCompose = (replyTo?: OrgEmail) => {
    setComposeError(null);
    if (replyTo) {
      const target = replyTo.direction === "inbound" ? replyTo.from_address : replyTo.to_address;
      setForm({
        to: target || orgEmail || "",
        subject: replyTo.subject.startsWith("Re:") ? replyTo.subject : `Re: ${replyTo.subject}`,
        body: "",
      });
      setReplyToId(replyTo.id);
    } else {
      setForm({ to: orgEmail || "", subject: "", body: "" });
      setReplyToId(null);
    }
    setComposeOpen(true);
  };

  const syncReplies = async () => {
    setSyncing(true);
    try {
      await fetch(`/api/admin/organizations/emails/sync?organization_id=${orgId}`, { method: "POST" });
      await fetchData();
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  };

  const send = async () => {
    setComposeError(null);
    if (!form.subject.trim() || !form.body.trim()) {
      setComposeError("Subject and message are required.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/organizations/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: orgId,
          to: form.to.trim() || undefined,
          subject: form.subject,
          html: form.body,
          inReplyToEmailId: replyToId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setComposeError(data.error || "Failed to send email.");
        return;
      }
      setComposeOpen(false);
      setForm({ to: orgEmail || "", subject: "", body: "" });
      await fetchData();
    } catch {
      setComposeError("Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  const kpis = [
    { label: "Total", value: stats?.total ?? 0, icon: Mail, tint: "text-slate-600" },
    { label: "Sent", value: stats?.sent ?? 0, icon: Send, tint: "text-sky-600" },
    { label: "Received", value: stats?.received ?? 0, icon: Inbox, tint: "text-violet-600" },
    { label: "Read", value: stats?.read ?? 0, icon: Eye, tint: "text-emerald-600" },
  ];

  const connectHref = `/api/admin/gmail/connect?returnTo=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.pathname : "/admin/organizations"
  )}`;

  return (
    <div className="space-y-4">
      {/* Gmail connection banner */}
      {gmail.configured && !gmail.connected && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <Mail className="w-4 h-4" />
            Connect your Gmail to send from your own address and sync replies here.
          </div>
          <a
            href={connectHref}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Connect Gmail
          </a>
        </div>
      )}
      {gmail.connected && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <Mail className="w-4 h-4" />
            Sending as <span className="font-semibold">{gmail.googleEmail}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={syncReplies}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {syncing ? "Syncing…" : "Sync replies"}
            </button>
            <button
              onClick={async () => {
                await fetch("/api/admin/gmail/disconnect", { method: "POST" });
                fetchGmailStatus();
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3">
            <k.icon className={`w-5 h-5 ${k.tint}`} />
            <div>
              <p className="text-sm text-slate-500">{k.label}</p>
              <p className="text-xl font-bold text-slate-900">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search subject, address or content…"
              className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
          >
            <option value="ALL">All emails</option>
            <option value="outbound">Sent</option>
            <option value="inbound">Received</option>
            <option value="read">Read</option>
          </select>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => openCompose()}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Send className="w-4 h-4" />
            Compose
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {error ? (
          <div className="p-10 text-center text-sm text-rose-600">{error}</div>
        ) : loading ? (
          <div className="p-10 flex flex-col items-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-sm">Loading emails…</span>
          </div>
        ) : emails.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No emails yet</p>
            <p className="text-xs text-slate-400 mt-1">Compose an email to start the conversation.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {emails.map((email) => {
              const badge = statusBadge(email);
              const inbound = email.direction === "inbound";
              return (
                <li
                  key={email.id}
                  onClick={() => setSelected(email)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/70 cursor-pointer transition"
                >
                  <div className={`p-2 rounded-lg ${inbound ? "bg-violet-50" : "bg-sky-50"}`}>
                    {inbound ? <Inbox className="w-4 h-4 text-violet-600" /> : <Send className="w-4 h-4 text-sky-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 truncate">{email.subject || "(no subject)"}</span>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {inbound ? `From ${email.from_address || "unknown"}` : `To ${email.to_address || "unknown"}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{fmtDateTime(email.sent_at || email.created_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between p-5 border-b">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 truncate">{selected.subject || "(no subject)"}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {selected.direction === "inbound"
                    ? `From ${selected.from_address || "unknown"}`
                    : `To ${selected.to_address || "unknown"}`}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{fmtDateTime(selected.sent_at || selected.created_at)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <div
                className="prose prose-sm max-w-none text-slate-700"
                dangerouslySetInnerHTML={{ __html: selected.body || "<p>(no content)</p>" }}
              />
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => {
                  const target = selected;
                  setSelected(null);
                  openCompose(target);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                <CornerUpLeft className="w-4 h-4" />
                Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose modal */}
      {composeOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold text-slate-900">New email to {orgName}</h3>
              <button onClick={() => setComposeOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {composeError && (
                <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {composeError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                <input
                  type="email"
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  placeholder={orgEmail || "recipient@example.com"}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Subject"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={10}
                  placeholder="Write your message… (plain text or HTML)"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none resize-y"
                />
                <p className="mt-1 text-xs text-slate-400">
                  A tracking pixel is added automatically so you can see when it&apos;s read. Replies are captured in this mailbox.
                </p>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setComposeOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={send}
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Sending…" : "Send email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
