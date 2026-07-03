"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, AtSign, ClipboardList, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

function fmtAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"tasks" | "mentions">("tasks");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) return;
      const d = await res.json();
      setNotifications(d.notifications || []);
      setUnread(d.unread || 0);
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    load();
  };

  const markRead = async (id: string) => {
    await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [id] }) });
    load();
  };

  const taskNotifs = notifications.filter((n) => n.type === "assigned" || n.type === "comment");
  const mentionNotifs = notifications.filter((n) => n.type === "mentioned");
  const displayed = tab === "tasks" ? taskNotifs : mentionNotifs;

  const tabUnread = (list: Notification[]) => list.filter((n) => !n.read_at).length;

  const handleClick = async (n: Notification) => {
    if (!n.read_at) await markRead(n.id);
    setOpen(false);
    router.push(`/admin/tasks?task=${n.task_id}`);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-sky-600 hover:underline font-medium">
                  Mark all read
                </button>
              )}
              <Link
                href="/admin/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-slate-500 hover:text-sky-600 transition"
                title="View all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button onClick={() => setOpen(false)} className="p-0.5 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {(["tasks", "mentions"] as const).map((t) => {
              const list = t === "tasks" ? taskNotifs : mentionNotifs;
              const u = tabUnread(list);
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition ${
                    tab === t ? "border-sky-600 text-sky-700" : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t === "tasks" ? <ClipboardList className="w-3.5 h-3.5" /> : <AtSign className="w-3.5 h-3.5" />}
                  {t === "tasks" ? "Tasks" : "Mentions"}
                  {u > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {u}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {displayed.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                <CheckCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                All caught up!
              </div>
            ) : (
              displayed.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition flex items-start gap-3 ${
                    !n.read_at ? "bg-sky-50/60" : ""
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
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
                      <p className="text-xs text-slate-500 truncate mt-0.5">"{n.task_title}"</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">{fmtAgo(n.created_at)}</p>
                  </div>
                  {!n.read_at && (
                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
