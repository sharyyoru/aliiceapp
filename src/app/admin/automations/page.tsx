"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  X,
  Loader2,
  Trash2,
  Mail,
  Zap,
  ArrowLeft,
  Pencil,
  Power,
} from "lucide-react";

const STAGES = [
  { id: "new_signup", label: "New Signup" },
  { id: "contacted", label: "Contacted" },
  { id: "demo_scheduled", label: "Demo Scheduled" },
  { id: "onboarding", label: "Onboarding" },
  { id: "active", label: "Active Client" },
  { id: "churned", label: "Churned" },
];

const MERGE_TAGS = [
  "{{org.name}}",
  "{{org.email}}",
  "{{org.phone}}",
  "{{org.city}}",
  "{{org.country}}",
  "{{org.tier}}",
  "{{stage.label}}",
  "{{from_stage.label}}",
];

interface Template {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  description: string | null;
  created_at: string;
}

interface Automation {
  id: string;
  name: string;
  trigger_stage: string;
  active: boolean;
  action_type: string;
  template_id: string | null;
  admin_email: string | null;
  template?: { id: string; name: string } | null;
  created_at: string;
}

export default function PipelineAutomationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"automations" | "templates">("automations");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([
        fetch("/api/admin/pipeline-templates"),
        fetch("/api/admin/pipeline-automations"),
      ]);
      if (tRes.status === 401 || aRes.status === 401) {
        router.push("/admin/login");
        return;
      }
      const tData = await tRes.json();
      const aData = await aRes.json();
      setTemplates(tData.templates || []);
      setAutomations(aData.automations || []);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.label || id;

  // ---- Template CRUD ----
  const saveTemplate = async (payload: Partial<Template>) => {
    setSaving(true);
    try {
      const method = editingTemplate ? "PATCH" : "POST";
      const body = editingTemplate ? { id: editingTemplate.id, ...payload } : payload;
      const res = await fetch("/api/admin/pipeline-templates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchAll();
        setShowTemplateModal(false);
        setEditingTemplate(null);
      } else {
        setError("Failed to save template");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this template? Automations using it will lose their template.")) return;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/admin/pipeline-templates?id=${id}`, { method: "DELETE" });
    fetchAll();
  };

  // ---- Automation CRUD ----
  const saveAutomation = async (payload: Partial<Automation>) => {
    setSaving(true);
    try {
      const method = editingAutomation ? "PATCH" : "POST";
      const body = editingAutomation ? { id: editingAutomation.id, ...payload } : payload;
      const res = await fetch("/api/admin/pipeline-automations", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchAll();
        setShowAutomationModal(false);
        setEditingAutomation(null);
      } else {
        setError("Failed to save automation");
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleAutomation = async (a: Automation) => {
    setAutomations((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x))
    );
    await fetch("/api/admin/pipeline-automations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, active: !a.active }),
    });
  };

  const deleteAutomation = async (id: string) => {
    if (!confirm("Delete this automation?")) return;
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/admin/pipeline-automations?id=${id}`, { method: "DELETE" });
    fetchAll();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/logos/aliice-logo.png" alt="Aliice Logo" width={100} height={32} />
            <span className="text-slate-300">|</span>
            <span className="text-sm font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded">
              Pipeline Automations
            </span>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pipeline
          </Link>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            {error}
            <button onClick={() => setError("")}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("automations")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                tab === "automations" ? "bg-sky-100 text-sky-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Zap className="w-4 h-4" />
              Automations
              <span className="bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">
                {automations.length}
              </span>
            </button>
            <button
              onClick={() => setTab("templates")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                tab === "templates" ? "bg-sky-100 text-sky-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Mail className="w-4 h-4" />
              Email Templates
              <span className="bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">
                {templates.length}
              </span>
            </button>
          </div>
          {tab === "automations" ? (
            <button
              onClick={() => {
                setEditingAutomation(null);
                setShowAutomationModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
            >
              <Plus className="w-4 h-4" />
              New Automation
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingTemplate(null);
                setShowTemplateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          </div>
        ) : tab === "automations" ? (
          <div className="space-y-3">
            {automations.length === 0 && (
              <div className="text-center py-16 text-slate-400 bg-white rounded-xl border">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No automations yet. Create one to trigger emails when leads change stage.</p>
              </div>
            )}
            {automations.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <button
                    onClick={() => toggleAutomation(a)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                      a.active ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                    }`}
                    title={a.active ? "Active — click to pause" : "Paused — click to activate"}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{a.name}</p>
                    <p className="text-xs text-slate-500">
                      When stage &rarr;{" "}
                      <span className="font-medium text-slate-700">{stageLabel(a.trigger_stage)}</span>
                      {" · "}
                      {a.action_type === "send_email_to_admin" ? "Notify team" : "Email lead"}
                      {a.template?.name ? ` · ${a.template.name}` : " · (no template)"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      a.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {a.active ? "Active" : "Paused"}
                  </span>
                  <button
                    onClick={() => {
                      setEditingAutomation(a);
                      setShowAutomationModal(true);
                    }}
                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-slate-50 rounded-lg"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAutomation(a.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.length === 0 && (
              <div className="col-span-full text-center py-16 text-slate-400 bg-white rounded-xl border">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No templates yet. Create one to use in your stage automations.</p>
              </div>
            )}
            {templates.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border shadow-sm p-4 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-slate-900">{t.name}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingTemplate(t);
                        setShowTemplateModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-50 rounded"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(t.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-1">
                  <span className="font-medium">Subject:</span> {t.subject || "—"}
                </p>
                <p className="text-xs text-slate-400 line-clamp-3">
                  {t.body_html.replace(/<[^>]+>/g, " ").slice(0, 140) || "Empty body"}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {showTemplateModal && (
        <TemplateModal
          template={editingTemplate}
          saving={saving}
          onClose={() => {
            setShowTemplateModal(false);
            setEditingTemplate(null);
          }}
          onSave={saveTemplate}
        />
      )}

      {showAutomationModal && (
        <AutomationModal
          automation={editingAutomation}
          templates={templates}
          saving={saving}
          onClose={() => {
            setShowAutomationModal(false);
            setEditingAutomation(null);
          }}
          onSave={saveAutomation}
        />
      )}
    </div>
  );
}

function TemplateModal({
  template,
  saving,
  onClose,
  onSave,
}: {
  template: Template | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: Partial<Template>) => void;
}) {
  const [name, setName] = useState(template?.name || "");
  const [subject, setSubject] = useState(template?.subject || "");
  const [bodyHtml, setBodyHtml] = useState(template?.body_html || "");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {template ? "Edit Template" : "New Email Template"}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Welcome email"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Welcome to Aliice, {{org.name}}!"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Body (HTML)</label>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={10}
              placeholder="<p>Hi {{org.name}},</p><p>Thanks for signing up...</p>"
              className="w-full px-3 py-2 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Merge tags (click to copy)</p>
            <div className="flex flex-wrap gap-1.5">
              {MERGE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(tag)}
                  className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-mono text-slate-600 hover:bg-sky-100 hover:text-sky-700"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ name, subject, body_html: bodyHtml })}
            disabled={saving || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {template ? "Save Changes" : "Create Template"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AutomationModal({
  automation,
  templates,
  saving,
  onClose,
  onSave,
}: {
  automation: Automation | null;
  templates: Template[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: Partial<Automation>) => void;
}) {
  const [name, setName] = useState(automation?.name || "");
  const [triggerStage, setTriggerStage] = useState(automation?.trigger_stage || "new_signup");
  const [actionType, setActionType] = useState(automation?.action_type || "send_email");
  const [templateId, setTemplateId] = useState(automation?.template_id || "");
  const [adminEmail, setAdminEmail] = useState(automation?.admin_email || "");
  const [active, setActive] = useState(automation?.active ?? true);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {automation ? "Edit Automation" : "New Automation"}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Automation Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Send welcome email on signup"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Trigger</p>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              When an organization moves to stage
            </label>
            <select
              value={triggerStage}
              onChange={(e) => setTriggerStage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Action</p>
            <label className="block text-sm font-medium text-slate-700 mb-1">Do this</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none mb-3"
            >
              <option value="send_email">Send email to the lead</option>
              <option value="send_email_to_admin">Send internal notification to team</option>
            </select>

            <label className="block text-sm font-medium text-slate-700 mb-1">Using template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">Select a template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {actionType === "send_email_to_admin" && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Notify email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="sales@aliice.app"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-slate-300"
            />
            Active
          </label>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                name,
                trigger_stage: triggerStage,
                action_type: actionType,
                template_id: templateId || null,
                admin_email: adminEmail || null,
                active,
              })
            }
            disabled={saving || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {automation ? "Save Changes" : "Create Automation"}
          </button>
        </div>
      </div>
    </div>
  );
}
