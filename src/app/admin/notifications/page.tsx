"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, ClipboardList, AtSign, CheckCheck, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  type: "assigned" | "mentioned" | "comment";
  task_id: string;
  task_title: string | null;
  actor_email: string | null;
  actor_name: string | null;
  read_at: string | null;
  created_at: string;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tasks" | "mentions">("tasks");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/notifications");
    const d = await res.json();
    setNotifications(d.notifications || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    load();
  };

  const markRead = async (id: string) => {
    await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    load();
  };

  const taskNotifs = notifications.filter((n) => n.type !== "mentioned");
  const mentionNotifs = notifications.filter((n) => n.type === "mentioned");
  const displayed = tab === "tasks" ? taskNotifs : mentionNotifs;
  const unread = notifications.filter((n) => !n.read_at).length;

  const handleClick = async (n: Notification) => {
    if (!n.read_at) await markRead(n.id);
    router.push(`/admin/tasks?task=${n.task_id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-sky-600" />
            <span className="text-lg font-semibold text-slate-800">Notifications</span>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="ml-auto text-sm text-sky-600 hover:underline font-medium">
              Mark all read
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {(["tasks", "mentions"] as const).map((t) => {
            const list = t === "tasks" ? taskNotifs : mentionNotifs;
            const u = list.filter((n) => !n.read_at).length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
                  tab === t ? "border-sky-600 text-sky-700" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {t === "tasks" ? <ClipboardList className="w-4 h-4" /> : <AtSign className="w-4 h-4" />}
                {t === "tasks" ? "Tasks" : "Mentions"}
                {u > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {u}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <CheckCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm mt-1">No {tab === "mentions" ? "mentions" : "task notifications"} yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {displayed.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-5 py-4 hover:bg-slate-50 transition flex items-start gap-4 ${
                  !n.read_at ? "bg-sky-50/50" : ""
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold mt-0.5 ${
                  n.type === "mentioned" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"
                }`}>
                  {(n.actor_name || n.actor_email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">
                    <span className="font-semibold">{n.actor_name || n.actor_email}</span>{" "}
                    {n.type === "assigned" && "assigned you a task"}
                    {n.type === "comment" && "commented on a task"}
                    {n.type === "mentioned" && "mentioned you in a comment"}
                  </p>
                  {n.task_title && (
                    <p className="text-sm font-medium text-sky-700 mt-0.5">"{n.task_title}"</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{fmtDateTime(n.created_at)}</p>
                </div>
                {!n.read_at && (
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0 mt-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
