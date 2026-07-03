"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, Circle, Clock, AlertCircle, Plus, Search,
  ChevronDown, User, Building2, Loader2, Trash2, X, Flag, Calendar,
  CheckCheck, SlidersHorizontal,
} from "lucide-react";
import TaskModal from "@/components/admin/TaskModal";

export type AdminTask = {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  organization_id: string | null;
  organization_name: string | null;
  assignee_email: string | null;
  assignee_name: string | null;
  created_by_email: string | null;
  created_by_name: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  source_type: string | null;
};

const STATUS_META = {
  todo: { label: "To Do", icon: Circle, color: "text-slate-400" },
  in_progress: { label: "In Progress", icon: Clock, color: "text-sky-500" },
  done: { label: "Done", icon: CheckCircle2, color: "text-emerald-500" },
};

const PRIORITY_META = {
  low: { label: "Low", color: "bg-slate-100 text-slate-600" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700" },
  high: { label: "High", color: "bg-red-100 text-red-600" },
};

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(t: AdminTask) {
  return t.status !== "done" && t.due_date && new Date(t.due_date) < new Date();
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"my" | "all">("my");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("created_at_desc");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AdminTask | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch = useCallback(async (qVal = q) => {
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (view === "my") params.set("assignee", "me");
    if (statusFilter) params.set("status", statusFilter);
    if (qVal) params.set("q", qVal);
    const res = await window.fetch(`/api/admin/tasks?${params}`);
    const data = await res.json();
    setTasks(data.tasks || []);
    setLoading(false);
  }, [view, statusFilter, sort, q]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleQ = (val: string) => {
    setQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetch(val), 350);
  };

  const filtered = priorityFilter
    ? tasks.filter((t) => t.priority === priorityFilter)
    : tasks;

  const grouped = {
    todo: filtered.filter((t) => t.status === "todo"),
    in_progress: filtered.filter((t) => t.status === "in_progress"),
    done: filtered.filter((t) => t.status === "done"),
  };

  const quickStatus = async (task: AdminTask, status: AdminTask["status"]) => {
    await window.fetch(`/api/admin/tasks?id=${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetch();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <CheckCheck className="w-5 h-5 text-sky-600" />
            <span className="text-lg font-semibold text-slate-800">Tasks</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 ml-2">
            {(["my", "all"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  view === v ? "bg-white text-sky-700 shadow-sm" : "text-slate-600 hover:text-slate-800"
                }`}
              >
                {v === "my" ? "My Tasks" : "All Tasks"}
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-sm ml-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => handleQ(e.target.value)}
              placeholder="Search tasks…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="">All statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="created_at_desc">Newest first</option>
              <option value="created_at_asc">Oldest first</option>
              <option value="due_date_asc">Due date ↑</option>
              <option value="due_date_desc">Due date ↓</option>
              <option value="priority_desc">Priority ↓</option>
              <option value="title_asc">Title A–Z</option>
            </select>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <CheckCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No tasks found</p>
            <p className="text-sm mt-1">Create a task to get started</p>
          </div>
        ) : (
          <div className="space-y-8">
            {(["in_progress", "todo", "done"] as const).map((st) => {
              const list = grouped[st];
              if (list.length === 0) return null;
              const meta = STATUS_META[st];
              const Icon = meta.icon;
              return (
                <div key={st}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                      {meta.label}
                    </h2>
                    <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">
                      {list.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {list.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onOpen={() => setSelectedTask(task)}
                        onQuickStatus={quickStatus}
                        onDeleted={fetch}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showCreate && (
        <TaskModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); fetch(); }}
        />
      )}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSaved={() => { setSelectedTask(null); fetch(); }}
          onDeleted={() => { setSelectedTask(null); fetch(); }}
        />
      )}
    </div>
  );
}

function TaskRow({
  task,
  onOpen,
  onQuickStatus,
  onDeleted,
}: {
  task: AdminTask;
  onOpen: () => void;
  onQuickStatus: (t: AdminTask, s: AdminTask["status"]) => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const overdue = isOverdue(task);
  const pm = PRIORITY_META[task.priority];
  const sm = STATUS_META[task.status];
  const StatusIcon = sm.icon;

  const del = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this task?")) return;
    setDeleting(true);
    await window.fetch(`/api/admin/tasks?id=${task.id}`, { method: "DELETE" });
    onDeleted();
  };

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next: Record<string, AdminTask["status"]> = { todo: "in_progress", in_progress: "done", done: "todo" };
    onQuickStatus(task, next[task.status]);
  };

  return (
    <div
      onClick={onOpen}
      className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-sky-300 hover:shadow-sm transition group"
    >
      <button
        onClick={cycleStatus}
        className={`shrink-0 ${sm.color} hover:scale-110 transition`}
        title="Cycle status"
      >
        <StatusIcon className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-slate-400" : "text-slate-800"}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
          {task.organization_name && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {task.organization_name}
            </span>
          )}
          {task.assignee_name && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {task.assignee_name}
            </span>
          )}
          {task.due_date && (
            <span className={`flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : ""}`}>
              <Calendar className="w-3 h-3" />
              {overdue ? "Overdue · " : ""}{fmtDate(task.due_date)}
            </span>
          )}
          {task.source_type && task.source_type !== "manual" && (
            <span className="capitalize bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
              {task.source_type}
            </span>
          )}
        </div>
      </div>

      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${pm.color}`}>
        {pm.label}
      </span>

      {deleting ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-400 shrink-0" />
      ) : (
        <button
          onClick={del}
          className="shrink-0 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
