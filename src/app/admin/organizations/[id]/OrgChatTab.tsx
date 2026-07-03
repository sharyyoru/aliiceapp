"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Loader2, ChevronDown, ChevronRight, User, Bot, Clock, MessageSquare } from "lucide-react";

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

export default function OrgChatTab({ orgId }: { orgId: string }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/chat/session?org_id=${orgId}&limit=100`);
    const d = await res.json();
    setSessions(d.sessions || []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-800">Live Chat Sessions</h2>
        <span className="text-sm text-slate-500">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</span>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No chat sessions yet for this organization.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition"
              >
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {s.user_name || s.user_email || "Unknown user"}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{fmtDateTime(s.started_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />{s.message_count} message{s.message_count !== 1 ? "s" : ""}
                    </span>
                    <span>{durationLabel(s.started_at, s.ended_at)}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  s.ended_at ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {s.ended_at ? "Ended" : "Active"}
                </span>
                {expanded === s.id
                  ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                }
              </button>

              {expanded === s.id && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-2 max-h-96 overflow-y-auto">
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
                        <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                          m.role === "user"
                            ? "bg-sky-600 text-white rounded-br-sm"
                            : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm"
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
    </div>
  );
}
