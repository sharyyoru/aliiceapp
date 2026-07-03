"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus, Loader2, CheckCircle2, Circle, Clock, Trash2, User, Calendar, Flag,
} from "lucide-react";
import TaskModal from "@/components/admin/TaskModal";
import type { AdminTask } from "@/app/admin/tasks/page";

const STATUS_META = {
  todo: { label: "To Do", Icon: Circle, color: "text-slate-400" },
  in_progress: { label: "In Progress", Icon: Clock, color: "text-sky-500" },
  done: { label: "Done", Icon: CheckCircle2, color: "text-emerald-500" },
};

const PRIORITY_COLOR = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-600",
};

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function OrgTasksTab({ orgId }: { orgId: string }) {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<AdminTask | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/tasks?org_id=${orgId}&sort=created_at_desc`);
    const d = await res.json();
    setTasks(d.tasks || []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const quickStatus = async (task: AdminTask, status: AdminTask["status"]) => {
    await fetch(`/api/admin/tasks?id=${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const del = async (task: AdminTask) => {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/admin/tasks?id=${task.id}`, { method: "DELETE" });
    load();
  };

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
        <h2 className="text-base font-semibold text-slate-800">Tasks for this Organization</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No tasks yet for this organization.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const sm = STATUS_META[task.status];
            const StatusIcon = sm.Icon;
            const overdue = task.status !== "done" && task.due_date && new Date(task.due_date) < new Date();
            return (
              <div
                key={task.id}
                onClick={() => setSelected(task)}
                className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-sky-300 hover:shadow-sm transition group"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const next: Record<string, AdminTask["status"]> = { todo: "in_progress", in_progress: "done", done: "todo" };
                    quickStatus(task, next[task.status]);
                  }}
                  className={`shrink-0 ${sm.color} hover:scale-110 transition`}
                >
                  <StatusIcon className="w-5 h-5" />
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-slate-400" : "text-slate-800"}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                    {task.assignee_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />{task.assignee_name}
                      </span>
                    )}
                    {task.due_date && (
                      <span className={`flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : ""}`}>
                        <Calendar className="w-3 h-3" />
                        {overdue ? "Overdue · " : ""}{fmtDate(task.due_date)}
                      </span>
                    )}
                    {task.source_type && task.source_type !== "manual" && (
                      <span className="capitalize bg-slate-100 px-1.5 py-0.5 rounded">{task.source_type}</span>
                    )}
                  </div>
                </div>

                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${PRIORITY_COLOR[task.priority]}`}>
                  {task.priority}
                </span>

                <button
                  onClick={(e) => { e.stopPropagation(); del(task); }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <TaskModal
          orgId={orgId}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); load(); }}
        />
      )}
      {selected && (
        <TaskModal
          task={selected}
          orgId={orgId}
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); load(); }}
          onDeleted={() => { setSelected(null); load(); }}
        />
      )}
    </div>
  );
}
