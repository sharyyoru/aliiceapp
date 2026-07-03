"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, MessageCircle, Loader2, Search, ChevronDown, ChevronRight,
  User, Bot, Clock, MessageSquare, Building2, RefreshCw,
} from "lucide-react";

interface ChatSession {
  id: string;
  organization_id: string | null;
  organization_name: string | null;
  user_email: string | null;
  user_name: string | null;
  started_at: string;
  ended_at: string | null;
  message_count: number;
  transcript: { role: string; content: string }[];
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function durationLabel(start: string, end: string | null) {
  if (!end) return "Ongoing";
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 1) return "< 1 min";
  return `${mins} min${mins !== 1 ? "s" : ""}`;
}

export default function ChatLogsPage() {
  const searchParams = useSearchParams();
  const focusSession = searchParams.get("session");

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(focusSession);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/chat/session?limit=200");
    const d = await res.json();
    setSessions(d.sessions || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (focusSession) {
      setExpanded(focusSession);
      setTimeout(() => {
        document.getElementById(`session-${focusSession}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
  }, [focusSession]);

  const filtered = sessions.filter((s) => {
    if (!q) return true;
    const lq = q.toLowerCase();
    return (
      (s.user_name || "").toLowerCase().includes(lq) ||
      (s.user_email || "").toLowerCase().includes(lq) ||
      (s.organization_name || "").toLowerCase().includes(lq) ||
      s.transcript?.some((m) => m.content.toLowerCase().includes(lq))
    );
  });

  const activeCount = sessions.filter((s) => !s.ended_at).length;
  const totalMsgs = sessions.reduce((a, s) => a + (s.message_count || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-sky-600" />
            <span className="text-lg font-semibold text-slate-800">Live Chat Logs</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex gap-4 text-sm text-slate-500">
              <span><span className="font-semibold text-slate-800">{sessions.length}</span> sessions</span>
              {activeCount > 0 && (
                <span className="text-emerald-600 font-semibold">{activeCount} active</span>
              )}
              <span><span className="font-semibold text-slate-800">{totalMsgs}</span> messages</span>
            </div>
            <button onClick={load} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by user, organization, or message content…"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 bg-white"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No sessions found</p>
            {q && <p className="text-sm mt-1">Try a different search term</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <div
                key={s.id}
                id={`session-${s.id}`}
                className={`bg-white rounded-xl border overflow-hidden transition ${
                  s.id === focusSession ? "border-sky-400 shadow-md" : "border-slate-200"
                }`}
              >
                <button
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition"
                >
                  <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {s.user_name || s.user_email || "Unknown user"}
                      </p>
                      {s.organization_name && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                          <Building2 className="w-3 h-3" />{s.organization_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{fmtDateTime(s.started_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />{s.message_count} msg{s.message_count !== 1 ? "s" : ""}
                      </span>
                      <span>{durationLabel(s.started_at, s.ended_at)}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    s.ended_at ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {s.ended_at ? "Ended" : "Active"}
                  </span>
                  {s.organization_id && (
                    <Link
                      href={`/admin/organizations/${s.organization_id}?tab=chat`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-sky-600 hover:underline shrink-0"
                    >
                      Org →
                    </Link>
                  )}
                  {expanded === s.id
                    ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  }
                </button>

                {expanded === s.id && (
                  <div className="border-t px-4 py-4 bg-slate-50 space-y-2 max-h-[500px] overflow-y-auto">
                    {/* Session meta */}
                    <div className="flex gap-6 text-xs text-slate-500 mb-3 pb-3 border-b border-slate-200">
                      {s.user_email && <span><span className="font-medium">Email:</span> {s.user_email}</span>}
                      <span><span className="font-medium">Started:</span> {fmtDateTime(s.started_at)}</span>
                      {s.ended_at && <span><span className="font-medium">Ended:</span> {fmtDateTime(s.ended_at)}</span>}
                      <span className="text-slate-400 font-mono">{s.id}</span>
                    </div>

                    {(!s.transcript || s.transcript.length === 0) ? (
                      <p className="text-sm text-slate-400 italic">No transcript available.</p>
                    ) : (
                      s.transcript.filter(m => m.role !== "system").map((m, i) => (
                        <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                          {m.role !== "user" && (
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                              <Bot className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                          )}
                          <div className={`max-w-[78%] rounded-xl px-3 py-2 text-sm ${
                            m.role === "user"
                              ? "bg-sky-600 text-white rounded-br-sm"
                              : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm"
                          }`}>
                            {m.content}
                          </div>
                          {m.role === "user" && (
                            <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                              <User className="w-3.5 h-3.5 text-sky-600" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
