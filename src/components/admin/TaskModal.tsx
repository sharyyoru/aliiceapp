"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X, Loader2, Trash2, Send, User, Building2, Flag, Calendar,
  CheckCircle2, Circle, Clock, MessageSquare, AtSign, ChevronDown,
} from "lucide-react";
import type { AdminTask } from "@/app/admin/tasks/page";

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
}

interface Organization {
  id: string;
  name: string;
}

interface Comment {
  id: string;
  author_email: string;
  author_name: string | null;
  body: string;
  created_at: string;
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "text-slate-500" },
  { value: "medium", label: "Medium", color: "text-amber-600" },
  { value: "high", label: "High", color: "text-red-600" },
];

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do", Icon: Circle },
  { value: "in_progress", label: "In Progress", Icon: Clock },
  { value: "done", label: "Done", Icon: CheckCircle2 },
];

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function renderCommentBody(body: string) {
  const parts = body.split(/(@[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g);
  return parts.map((p, i) =>
    p.startsWith("@") ? (
      <span key={i} className="text-sky-600 font-medium bg-sky-50 rounded px-0.5">{p}</span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export default function TaskModal({
  task,
  orgId,
  onClose,
  onSaved,
  onDeleted,
  prefill,
}: {
  task?: AdminTask | null;
  orgId?: string;
  onClose: () => void;
  onSaved: (t: AdminTask) => void;
  onDeleted?: () => void;
  prefill?: { source_type?: string; source_id?: string; title?: string };
}) {
  const isNew = !task;

  const [title, setTitle] = useState(task?.title ?? prefill?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<AdminTask["status"]>(task?.status ?? "todo");
  const [priority, setPriority] = useState<AdminTask["priority"]>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [assigneeEmail, setAssigneeEmail] = useState(task?.assignee_email ?? "");
  const [assigneeName, setAssigneeName] = useState(task?.assignee_name ?? "");
  const [orgIdState, setOrgIdState] = useState(task?.organization_id ?? orgId ?? "");

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAnchor, setMentionAnchor] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/admin/admin-users").then((r) => r.json()).then((d) => setAdminUsers(d.adminUsers || []));
    fetch("/api/admin/organizations").then((r) => r.json()).then((d) => setOrganizations((d.organizations || []).map((o: any) => ({ id: o.id, name: o.name }))));
    if (task?.id) loadComments();
  }, [task?.id]);

  const loadComments = useCallback(async () => {
    if (!task?.id) return;
    const res = await fetch(`/api/admin/tasks/${task.id}/comments`);
    const d = await res.json();
    setComments(d.comments || []);
  }, [task?.id]);

  const save = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true); setError(null);
    const body: Record<string, any> = {
      title: title.trim(), description: description.trim() || null,
      status, priority, due_date: dueDate || null,
      assignee_email: assigneeEmail || null, assignee_name: assigneeName || null,
      organization_id: orgIdState || null,
      source_type: prefill?.source_type || task?.source_type || "manual",
      source_id: prefill?.source_id || null,
    };
    const url = isNew ? "/api/admin/tasks" : `/api/admin/tasks?id=${task!.id}`;
    const method = isNew ? "POST" : "PATCH";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Failed to save"); return; }
    onSaved(data.task);
  };

  const del = async () => {
    if (!task?.id || !confirm("Delete this task?")) return;
    setDeleting(true);
    await fetch(`/api/admin/tasks?id=${task.id}`, { method: "DELETE" });
    onDeleted?.();
  };

  const sendComment = async () => {
    if (!commentText.trim() || !task?.id) return;
    setSendingComment(true);
    await fetch(`/api/admin/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentText.trim() }),
    });
    setCommentText("");
    setSendingComment(false);
    loadComments();
  };

  const handleCommentKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendComment(); }
    if (mentionQuery !== null) {
      if (e.key === "Escape") { setMentionQuery(null); }
    }
  };

  const handleCommentChange = (val: string) => {
    setCommentText(val);
    const cursor = commentRef.current?.selectionStart ?? val.length;
    const textUpToCursor = val.slice(0, cursor);
    const atMatch = textUpToCursor.match(/@(\S*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionAnchor(atMatch.index ?? 0);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (user: AdminUser) => {
    const cursor = commentRef.current?.selectionStart ?? commentText.length;
    const before = commentText.slice(0, mentionAnchor);
    const after = commentText.slice(cursor);
    const mention = `@${user.email} `;
    setCommentText(before + mention + after);
    setMentionQuery(null);
    setTimeout(() => {
      commentRef.current?.focus();
      const pos = before.length + mention.length;
      commentRef.current?.setSelectionRange(pos, pos);
    }, 0);
  };

  const filteredMentions = mentionQuery !== null
    ? adminUsers.filter((u) =>
        u.email.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        (u.full_name || "").toLowerCase().includes(mentionQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const selectedOrg = organizations.find((o) => o.id === orgIdState);
  const selectedAssignee = adminUsers.find((u) => u.email === assigneeEmail);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-12 px-4" onMouseDown={onClose}>
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-slate-900">
            {isNew ? "New Task" : "Edit Task"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {/* Title */}
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full text-lg font-semibold text-slate-900 border-b-2 border-slate-200 pb-2 focus:outline-none focus:border-sky-500"
            />

            {/* Description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description…"
              rows={2}
              className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-sky-400"
            />

            {/* Meta row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                <div className="flex gap-1">
                  {STATUS_OPTIONS.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      onClick={() => setStatus(value as AdminTask["status"])}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                        status === value
                          ? "border-sky-500 bg-sky-50 text-sky-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
                <div className="flex gap-1">
                  {PRIORITY_OPTIONS.map(({ value, label, color }) => (
                    <button
                      key={value}
                      onClick={() => setPriority(value as AdminTask["priority"])}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                        priority === value
                          ? "border-sky-500 bg-sky-50 text-sky-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className={color}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  <User className="inline w-3 h-3 mr-1" />Assignee
                </label>
                <select
                  value={assigneeEmail}
                  onChange={(e) => {
                    const u = adminUsers.find((u) => u.email === e.target.value);
                    setAssigneeEmail(e.target.value);
                    setAssigneeName(u?.full_name || e.target.value);
                  }}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-sky-400"
                >
                  <option value="">Unassigned</option>
                  {adminUsers.map((u) => (
                    <option key={u.email} value={u.email}>{u.full_name || u.email}</option>
                  ))}
                </select>
              </div>

              {/* Due date */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  <Calendar className="inline w-3 h-3 mr-1" />Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-sky-400"
                />
              </div>

              {/* Organization */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  <Building2 className="inline w-3 h-3 mr-1" />Organization
                </label>
                <select
                  value={orgIdState}
                  onChange={(e) => setOrgIdState(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-sky-400"
                >
                  <option value="">No organization</option>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          {/* Comments section — only for existing tasks */}
          {!isNew && (
            <div className="border-t px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">
                  Comments {comments.length > 0 && <span className="text-slate-400 font-normal">({comments.length})</span>}
                </h3>
              </div>

              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {comments.length === 0 && (
                  <p className="text-xs text-slate-400">No comments yet. Use @email to mention someone.</p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center shrink-0 text-xs font-bold text-sky-700">
                      {(c.author_name || c.author_email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-slate-700">{c.author_name || c.author_email}</span>
                        <span className="text-xs text-slate-400">{fmtDateTime(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                        {renderCommentBody(c.body)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment composer */}
              <div className="relative">
                <textarea
                  ref={commentRef}
                  value={commentText}
                  onChange={(e) => handleCommentChange(e.target.value)}
                  onKeyDown={handleCommentKey}
                  placeholder="Add a comment… Use @email to mention someone"
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm resize-none focus:outline-none focus:border-sky-400"
                />
                <button
                  onClick={sendComment}
                  disabled={!commentText.trim() || sendingComment}
                  className="absolute right-2 bottom-2 p-1.5 bg-sky-600 text-white rounded-lg disabled:opacity-40 hover:bg-sky-700"
                >
                  {sendingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>

                {/* @mention dropdown */}
                {mentionQuery !== null && filteredMentions.length > 0 && (
                  <div className="absolute bottom-full mb-1 left-0 w-72 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-10">
                    {filteredMentions.map((u) => (
                      <button
                        key={u.email}
                        onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-sky-50 transition"
                      >
                        <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-xs font-bold text-sky-700 shrink-0">
                          {(u.full_name || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{u.full_name || u.email}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                <AtSign className="inline w-3 h-3" /> type @email or name to mention · Ctrl+Enter to send
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t bg-slate-50 rounded-b-2xl">
          <div>
            {!isNew && onDeleted && (
              <button
                onClick={del}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isNew ? "Create Task" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
