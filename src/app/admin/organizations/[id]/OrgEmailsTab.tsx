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
  Video,
  CalendarPlus,
  Check,
  Paperclip,
  Clock,
  Trash2,
} from "lucide-react";
import { toDatetimeLocal, datetimeLocalToISO, localTimeZone } from "@/app/admin/agenda/lib";
import TaskModal from "@/components/admin/TaskModal";

interface OrgEmail {
  id: string;
  direction: "inbound" | "outbound" | string;
  status: string;
  subject: string;
  to_address: string | null;
  cc_addresses: string[] | null;
  bcc_addresses: string[] | null;
  from_address: string | null;
  body: string;
  attachments: { filename: string; contentType?: string }[] | null;
  scheduled_for: string | null;
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
  if (email.status === "scheduled") return { label: "Scheduled", cls: "bg-indigo-50 text-indigo-700" };
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
  const [form, setForm] = useState({
    to: orgEmail || "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
  });
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [attachments, setAttachments] = useState<{ filename: string; contentType: string; content: string; size: number }[]>([]);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [composeError, setComposeError] = useState<string | null>(null);

  const [gmail, setGmail] = useState<{ configured: boolean; connected: boolean; googleEmail: string | null }>({
    configured: false,
    connected: false,
    googleEmail: null,
  });
  const [syncing, setSyncing] = useState(false);
  const [taskPrefill, setTaskPrefill] = useState<{ source_type: string; source_id: string; title: string } | null>(null);

  // Meeting composer state
  const defaultMeeting = () => {
    const start = new Date();
    start.setMinutes(start.getMinutes() < 30 ? 30 : 0, 0, 0);
    if (start.getMinutes() === 0) start.setHours(start.getHours() + 1);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    return {
      enabled: false,
      title: "",
      startLocal: toDatetimeLocal(start),
      endLocal: toDatetimeLocal(end),
      addMeet: true,
      inviteRecipient: true,
    };
  };
  const [meeting, setMeeting] = useState(defaultMeeting);
  const [meetingCreating, setMeetingCreating] = useState(false);
  const [meetingAdded, setMeetingAdded] = useState<{ meetLink: string | null; when: string } | null>(null);

  const createMeeting = async () => {
    setComposeError(null);
    const title = (meeting.title || form.subject || "Meeting").trim();
    if (new Date(meeting.endLocal) <= new Date(meeting.startLocal)) {
      setComposeError("Meeting end time must be after the start time.");
      return;
    }
    setMeetingCreating(true);
    try {
      const attendees =
        meeting.inviteRecipient && form.to.trim().includes("@") ? [form.to.trim()] : [];
      const res = await fetch("/api/admin/agenda/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: title,
          start: datetimeLocalToISO(meeting.startLocal),
          end: datetimeLocalToISO(meeting.endLocal),
          timeZone: localTimeZone(),
          attendees,
          addMeet: meeting.addMeet,
          sendUpdates: attendees.length ? "all" : "none",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setComposeError(data.details || data.error || "Failed to create meeting.");
        return;
      }
      const meetLink: string | null = data.event?.hangoutLink || null;
      const when = new Date(meeting.startLocal).toLocaleString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      // Append a meeting block to the email body.
      const block =
        `\n\n---\n📅 Meeting: ${title}\n🕒 ${when}` +
        (meetLink ? `\n🎥 Join Google Meet: ${meetLink}` : "");
      setForm((f) => ({ ...f, body: `${f.body}${block}` }));
      setMeetingAdded({ meetLink, when });
    } catch {
      setComposeError("Failed to create meeting.");
    } finally {
      setMeetingCreating(false);
    }
  };

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
        let detail = "";
        try {
          const err = await res.json();
          detail = err.details || err.error || "";
        } catch {
          // ignore
        }
        setError(
          res.status === 401
            ? "Not authorized."
            : `Failed to load emails${detail ? `: ${detail}` : "."}`
        );
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
    setShowCcBcc(false);
    setAttachments([]);
    setScheduleMode(false);
    setScheduledFor("");
    if (replyTo) {
      const target = replyTo.direction === "inbound" ? replyTo.from_address : replyTo.to_address;
      setForm({
        to: target || orgEmail || "",
        cc: "",
        bcc: "",
        subject: replyTo.subject.startsWith("Re:") ? replyTo.subject : `Re: ${replyTo.subject}`,
        body: "",
      });
      setReplyToId(replyTo.id);
    } else {
      setForm({ to: orgEmail || "", cc: "", bcc: "", subject: "", body: "" });
      setReplyToId(null);
    }
    setMeeting(defaultMeeting());
    setMeetingAdded(null);
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

  const parseEmails = (input: string) =>
    input
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.includes("@"));

  const handleAttachmentSelect = async (files: FileList | null) => {
    if (!files) return;
    const newAttachments = await Promise.all(
      Array.from(files).map(async (file) => {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(",").pop() || "");
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        return {
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          content,
          size: file.size,
        };
      })
    );
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const send = async () => {
    setComposeError(null);
    if (!form.subject.trim() || !form.body.trim()) {
      setComposeError("Subject and message are required.");
      return;
    }
    const to = form.to.trim() || orgEmail || "";
    if (!to) {
      setComposeError("Please enter a recipient.");
      return;
    }

    const scheduleTime = scheduleMode && scheduledFor ? new Date(scheduledFor).toISOString() : null;
    if (scheduleMode && scheduledFor && new Date(scheduledFor).getTime() <= Date.now()) {
      setComposeError("Schedule time must be in the future.");
      return;
    }

    setSending(true);
    try {
      const cc = parseEmails(form.cc);
      const bcc = parseEmails(form.bcc);
      const res = await fetch("/api/admin/organizations/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: orgId,
          to,
          cc: cc.length ? cc : undefined,
          bcc: bcc.length ? bcc : undefined,
          subject: form.subject,
          html: form.body,
          attachments: attachments.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
          scheduledFor: scheduleTime || undefined,
          inReplyToEmailId: replyToId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setComposeError(data.error || "Failed to send email.");
        return;
      }
      setComposeOpen(false);
      setForm({ to: orgEmail || "", cc: "", bcc: "", subject: "", body: "" });
      setAttachments([]);
      setScheduleMode(false);
      setScheduledFor("");
      setShowCcBcc(false);
      setMeeting(defaultMeeting());
      setMeetingAdded(null);
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
                      {inbound
                        ? `From ${email.from_address || "unknown"}`
                        : `To ${email.to_address || "unknown"}${email.cc_addresses?.length ? ` · Cc ${email.cc_addresses.length}` : ""}${email.bcc_addresses?.length ? ` · Bcc ${email.bcc_addresses.length}` : ""}`}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {(email.attachments?.length ?? 0) > 0 && <Paperclip className="w-3.5 h-3.5 text-slate-400" />}
                    <span className="text-xs text-slate-400">
                      {email.status === "scheduled" ? `Scheduled ${fmtDateTime(email.scheduled_for)}` : fmtDateTime(email.sent_at || email.created_at)}
                    </span>
                  </div>
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
                {selected.cc_addresses && selected.cc_addresses.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">Cc: {selected.cc_addresses.join(", ")}</p>
                )}
                {selected.bcc_addresses && selected.bcc_addresses.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">Bcc: {selected.bcc_addresses.join(", ")}</p>
                )}
                <p className="text-xs text-slate-400 mt-0.5">
                  {selected.status === "scheduled" ? `Scheduled ${fmtDateTime(selected.scheduled_for)}` : fmtDateTime(selected.sent_at || selected.created_at)}
                </p>
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
            <div className="p-4 border-t flex justify-between">
              <button
                onClick={() => setTaskPrefill({ source_type: "email", source_id: selected!.id, title: `Follow up: ${selected!.subject}` })}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Check className="w-4 h-4 text-sky-600" />
                Create Task
              </button>
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
                <div className="mt-1.5 flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowCcBcc((s) => !s)}
                    className="text-sky-600 hover:text-sky-700 font-medium"
                  >
                    {showCcBcc ? "Hide Cc/Bcc" : "Cc / Bcc"}
                  </button>
                  <span className="text-slate-400">Separate multiple emails with commas</span>
                </div>
              </div>

              {showCcBcc && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cc</label>
                    <input
                      type="text"
                      value={form.cc}
                      onChange={(e) => setForm({ ...form, cc: e.target.value })}
                      placeholder="cc@example.com, another@example.com"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bcc</label>
                    <input
                      type="text"
                      value={form.bcc}
                      onChange={(e) => setForm({ ...form, bcc: e.target.value })}
                      placeholder="bcc@example.com"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

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

              {/* Attachments */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <Paperclip className="h-4 w-4 text-slate-500" />
                    Attach files
                    <input
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={(e) => handleAttachmentSelect(e.target.files)}
                    />
                  </label>
                  <span className="text-xs text-slate-400">
                    {attachments.length > 0 ? `${attachments.length} file${attachments.length === 1 ? "" : "s"} attached` : "No attachments"}
                  </span>
                </div>
                {attachments.length > 0 && (
                  <ul className="space-y-1.5">
                    {attachments.map((att, idx) => (
                      <li key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate text-slate-700">{att.filename}</span>
                          <span className="text-xs text-slate-400 shrink-0">({(att.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Schedule send */}
              <div className="rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setScheduleMode((s) => !s)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700"
                >
                  <Clock className="h-4 w-4 text-sky-600" />
                  Schedule send
                  <span className="ml-auto text-xs text-slate-400">{scheduleMode ? "Hide" : "Show"}</span>
                </button>
                {scheduleMode && (
                  <div className="border-t px-3 py-3">
                    <label className="mb-1 block text-xs font-medium text-slate-500">Send at</label>
                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      min={toDatetimeLocal(new Date())}
                      className="w-full rounded-lg border px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                      Your local timezone is used. The email will sit as Scheduled and be sent by the hourly cron job.
                    </p>
                  </div>
                )}
              </div>

              {/* Meeting / Google Meet */}
              <div className="rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMeeting((m) => ({ ...m, enabled: !m.enabled }))}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700"
                >
                  <CalendarPlus className="h-4 w-4 text-sky-600" />
                  Add a meeting to the calendar
                  <span className="ml-auto text-xs text-slate-400">{meeting.enabled ? "Hide" : "Show"}</span>
                </button>

                {meeting.enabled && (
                  <div className="space-y-3 border-t px-3 py-3">
                    <input
                      value={meeting.title}
                      onChange={(e) => setMeeting({ ...meeting, title: e.target.value })}
                      placeholder={form.subject || "Meeting title"}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Starts</label>
                        <input
                          type="datetime-local"
                          value={meeting.startLocal}
                          onChange={(e) => {
                            const startLocal = e.target.value;
                            const dur =
                              new Date(meeting.endLocal).getTime() - new Date(meeting.startLocal).getTime();
                            const end = new Date(new Date(startLocal).getTime() + Math.max(dur, 30 * 60 * 1000));
                            setMeeting({ ...meeting, startLocal, endLocal: toDatetimeLocal(end) });
                          }}
                          className="w-full rounded-lg border px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Ends</label>
                        <input
                          type="datetime-local"
                          value={meeting.endLocal}
                          onChange={(e) => setMeeting({ ...meeting, endLocal: e.target.value })}
                          className="w-full rounded-lg border px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={meeting.addMeet}
                          onChange={(e) => setMeeting({ ...meeting, addMeet: e.target.checked })}
                          className="h-4 w-4 accent-sky-600"
                        />
                        <Video className="h-4 w-4 text-sky-600" />
                        Generate Google Meet link
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={meeting.inviteRecipient}
                          onChange={(e) => setMeeting({ ...meeting, inviteRecipient: e.target.checked })}
                          className="h-4 w-4 accent-sky-600"
                        />
                        Send calendar invite to recipient
                      </label>
                    </div>

                    {meetingAdded ? (
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        <Check className="h-4 w-4" />
                        Meeting created for {meetingAdded.when} and added to the email.
                        {meetingAdded.meetLink && (
                          <a href={meetingAdded.meetLink} target="_blank" rel="noreferrer" className="ml-auto font-semibold underline">
                            Join
                          </a>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={createMeeting}
                        disabled={meetingCreating || !gmail.connected}
                        className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50"
                      >
                        {meetingCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                        {meetingCreating ? "Creating…" : "Create meeting & insert into email"}
                      </button>
                    )}
                    {!gmail.connected && (
                      <p className="text-xs text-amber-600">Connect Google above to create meetings.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-between items-center">
              <button
                type="button"
                onClick={() => setTaskPrefill({ source_type: "email", source_id: "compose", title: form.subject ? `Follow up: ${form.subject}` : "Email follow-up" })}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Check className="w-4 h-4 text-sky-600" />
                Create Task
              </button>
              <div className="flex gap-2">
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
                  {sending ? (scheduleMode ? "Scheduling…" : "Sending…") : scheduleMode ? "Schedule email" : "Send email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {taskPrefill && (
        <TaskModal
          orgId={orgId}
          prefill={taskPrefill}
          onClose={() => setTaskPrefill(null)}
          onSaved={() => setTaskPrefill(null)}
        />
      )}
    </div>
  );
}
