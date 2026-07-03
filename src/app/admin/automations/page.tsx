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
  Eye,
  LayoutTemplate,
} from "lucide-react";
import EmailBuilder from "@/components/admin/EmailBuilder";

const STAGES = [
  { id: "new_signup", label: "New Signup" },
  { id: "contacted", label: "Contacted" },
  { id: "demo_scheduled", label: "Demo Scheduled" },
  { id: "onboarding", label: "Onboarding" },
  { id: "active", label: "Active Client" },
  { id: "churned", label: "Churned" },
];

const MERGE_TAGS = [
  "{{contact.name}}",
  "{{contact.first_name}}",
  "{{org.name}}",
  "{{org.email}}",
  "{{org.phone}}",
  "{{org.city}}",
  "{{org.country}}",
  "{{org.tier}}",
  "{{stage.label}}",
  "{{from_stage.label}}",
];

// Sample data used only for the live preview so merge tags render nicely.
const PREVIEW_CONTEXT: Record<string, string> = {
  "contact.name": "Dr. Tenorio",
  "contact.first_name": "Tenorio",
  "contact.name_encoded": encodeURIComponent("Dr. Tenorio"),
  "org.name": "Aesthetics Clinic",
  "org.email": "contact@aesthetics-clinic.com",
  "org.email_encoded": encodeURIComponent("contact@aesthetics-clinic.com"),
  "org.phone": "+41 22 000 0000",
  "org.city": "Geneva",
  "org.country": "Switzerland",
  "org.tier": "professional",
  "stage.label": "Demo Scheduled",
  "from_stage.label": "Contacted",
};

/** Lightweight client-side merge renderer for previews. */
function renderPreview(template: string): string {
  if (!template) return "";
  return template.replace(/{{\s*([^}]+?)\s*}}/g, (_m, path) => {
    const key = String(path).trim();
    return PREVIEW_CONTEXT[key] ?? "";
  });
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  subject_fr: string | null;
  body_html_fr: string | null;
  design_json: Record<string, unknown> | null;
  design_json_fr: Record<string, unknown> | null;
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
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

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
                      onClick={() => setPreviewTemplate(t)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-50 rounded"
                      title="Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingTemplate(t);
                        setShowTemplateModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-50 rounded"
                      title="Edit"
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
                <div className="mb-1.5 flex items-center gap-1">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">EN</span>
                  {t.body_html_fr && t.body_html_fr.trim() ? (
                    <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-600">FR</span>
                  ) : null}
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
          onPreview={(t) => setPreviewTemplate(t)}
        />
      )}

      {previewTemplate && (
        <PreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
      )}
    </div>
  );
}

function PreviewModal({ template, onClose }: { template: Template; onClose: () => void }) {
  const hasFr = !!(template.body_html_fr && template.body_html_fr.trim());
  const [lang, setLang] = useState<"en" | "fr">("en");
  const subject = lang === "fr" ? template.subject_fr || template.subject : template.subject;
  const body = lang === "fr" ? template.body_html_fr || template.body_html : template.body_html;
  const html = renderPreview(body);
  const renderedSubject = renderPreview(subject);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400">Preview · {template.name}</p>
            <p className="truncate text-sm font-semibold text-slate-800">
              {renderedSubject || "(no subject)"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-slate-200 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setLang("en")}
                className={`rounded-full px-3 py-1 transition ${
                  lang === "en" ? "bg-sky-600 text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => hasFr && setLang("fr")}
                disabled={!hasFr}
                title={hasFr ? "" : "No French version"}
                className={`rounded-full px-3 py-1 transition ${
                  lang === "fr" ? "bg-sky-600 text-white" : "text-slate-500 hover:text-slate-800"
                } ${!hasFr ? "cursor-not-allowed opacity-40" : ""}`}
              >
                FR
              </button>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden bg-slate-100">
          <iframe
            title="Email preview"
            className="h-full w-full border-0 bg-white"
            sandbox=""
            srcDoc={html || "<p style='font-family:sans-serif;color:#94a3b8;padding:24px'>Empty body</p>"}
          />
        </div>
      </div>
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
  const [subjectFr, setSubjectFr] = useState(template?.subject_fr || "");
  const [bodyFr, setBodyFr] = useState(template?.body_html_fr || "");
  const [designEn, setDesignEn] = useState<Record<string, unknown> | null>(
    template?.design_json || null
  );
  const [designFr, setDesignFr] = useState<Record<string, unknown> | null>(
    template?.design_json_fr || null
  );
  const [editLang, setEditLang] = useState<"en" | "fr">("en");
  const [showPreview, setShowPreview] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);

  const curSubject = editLang === "fr" ? subjectFr : subject;
  const curBody = editLang === "fr" ? bodyFr : bodyHtml;
  const setCurSubject = editLang === "fr" ? setSubjectFr : setSubject;
  const setCurBody = editLang === "fr" ? setBodyFr : setBodyHtml;
  const curDesign = editLang === "fr" ? designFr : designEn;

  const handleBuilderSave = (html: string, design: Record<string, unknown>) => {
    if (editLang === "fr") {
      setBodyFr(html);
      setDesignFr(design);
    } else {
      setBodyHtml(html);
      setDesignEn(design);
    }
    setBuilderOpen(false);
  };

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

          {/* Language tabs */}
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex gap-1">
              {(["en", "fr"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setEditLang(l);
                    setShowPreview(false);
                  }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                    editLang === l
                      ? "border-sky-600 text-sky-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {l === "en" ? "English" : "Français"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBuilderOpen(true)}
                className="flex items-center gap-1.5 rounded-md bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
              >
                <LayoutTemplate className="h-3.5 w-3.5" />
                Design email
              </button>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-sky-700"
              >
                <Eye className="h-3.5 w-3.5" />
                {showPreview ? "Edit" : "Preview"}
              </button>
            </div>
          </div>

          {showPreview ? (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="border-b bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <span className="font-medium">Subject:</span>{" "}
                {renderPreview(curSubject) || "(no subject)"}
              </div>
              <iframe
                title="Template preview"
                className="h-[420px] w-full border-0 bg-white"
                sandbox=""
                srcDoc={
                  renderPreview(curBody) ||
                  "<p style='font-family:sans-serif;color:#94a3b8;padding:24px'>Empty body</p>"
                }
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subject {editLang === "fr" && <span className="text-slate-400">(FR)</span>}
                </label>
                <input
                  value={curSubject}
                  onChange={(e) => setCurSubject(e.target.value)}
                  placeholder={
                    editLang === "fr"
                      ? "Bienvenue chez Aliice, {{org.name}} !"
                      : "Welcome to Aliice, {{org.name}}!"
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Body (HTML) {editLang === "fr" && <span className="text-slate-400">(FR)</span>}
                </label>
                <textarea
                  value={curBody}
                  onChange={(e) => setCurBody(e.target.value)}
                  rows={10}
                  placeholder="<p>Hi {{contact.name}},</p><p>Thanks for signing up...</p>"
                  className="w-full px-3 py-2 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                {editLang === "fr" && (
                  <p className="mt-1 text-xs text-slate-400">
                    Leave French empty to always send the English version.
                  </p>
                )}
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
            </>
          )}
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
                subject,
                body_html: bodyHtml,
                subject_fr: subjectFr || null,
                body_html_fr: bodyFr || null,
                design_json: designEn,
                design_json_fr: designFr,
              })
            }
            disabled={saving || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {template ? "Save Changes" : "Create Template"}
          </button>
        </div>
      </div>

      {builderOpen && (
        <EmailBuilder
          title={`${name || "Untitled template"} · ${editLang === "fr" ? "Français" : "English"}`}
          initialDesign={curDesign}
          initialHtml={curBody}
          onSave={handleBuilderSave}
          onClose={() => setBuilderOpen(false)}
        />
      )}
    </div>
  );
}

function AutomationModal({
  automation,
  templates,
  saving,
  onClose,
  onSave,
  onPreview,
}: {
  automation: Automation | null;
  templates: Template[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: Partial<Automation>) => void;
  onPreview: (t: Template) => void;
}) {
  const [name, setName] = useState(automation?.name || "");
  const [triggerStage, setTriggerStage] = useState(automation?.trigger_stage || "new_signup");
  const [actionType, setActionType] = useState(automation?.action_type || "send_email");
  const [templateId, setTemplateId] = useState(automation?.template_id || "");
  const [adminEmail, setAdminEmail] = useState(automation?.admin_email || "");
  const [active, setActive] = useState(automation?.active ?? true);

  const selectedTemplate = templates.find((t) => t.id === templateId) || null;

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

            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Using template</label>
              {selectedTemplate && (
                <button
                  type="button"
                  onClick={() => onPreview(selectedTemplate)}
                  className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
              )}
            </div>
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
