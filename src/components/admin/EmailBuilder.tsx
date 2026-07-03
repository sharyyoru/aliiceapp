"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X, Loader2, Save } from "lucide-react";

// Unlayer must only load in the browser (it injects a remote script and needs window).
const EmailEditor = dynamic(() => import("react-email-editor"), { ssr: false });

/* eslint-disable @typescript-eslint/no-explicit-any */

// Personalization tags shared with the automation engine's {{merge}} syntax.
const MERGE_TAGS: Record<string, { name: string; value: string }> = {
  contact_name: { name: "Contact name", value: "{{contact.name}}" },
  contact_first_name: { name: "Contact first name", value: "{{contact.first_name}}" },
  org_name: { name: "Organization name", value: "{{org.name}}" },
  org_email: { name: "Organization email", value: "{{org.email}}" },
  org_phone: { name: "Organization phone", value: "{{org.phone}}" },
  org_city: { name: "City", value: "{{org.city}}" },
  org_country: { name: "Country", value: "{{org.country}}" },
  stage_label: { name: "Stage", value: "{{stage.label}}" },
};

// Wrap raw HTML (e.g. an existing SQL-seeded template) in a minimal Unlayer
// design containing a single HTML block so it can be opened in the builder.
function htmlToDesign(html: string): any {
  // Guard against oversized images/tables overflowing the editor canvas when
  // importing an existing HTML template that relies on width attributes only.
  const guardedHtml = `<style>img{max-width:100%!important;height:auto;}table{max-width:100%;}</style>${html}`;
  return {
    counters: { u_row: 1, u_column: 1, u_content_html: 1 },
    body: {
      id: "body",
      rows: [
        {
          id: "row-1",
          cells: [1],
          columns: [
            {
              id: "col-1",
              contents: [
                {
                  id: "html-1",
                  type: "html",
                  values: {
                    html: guardedHtml,
                    hideDesktop: false,
                    displayCondition: null,
                    _meta: { htmlID: "u_content_html_1", htmlClassNames: "u_content_html" },
                    selectable: true,
                    draggable: true,
                    duplicatable: true,
                    deletable: true,
                  },
                },
              ],
              values: {},
            },
          ],
          values: {},
        },
      ],
      values: { contentWidth: "600px", backgroundColor: "#eef2f7" },
    },
    schemaVersion: 16,
  };
}

export interface EmailBuilderProps {
  title: string;
  initialDesign?: Record<string, unknown> | null;
  initialHtml?: string;
  onSave: (html: string, design: Record<string, unknown>) => void;
  onClose: () => void;
}

export default function EmailBuilder({
  title,
  initialDesign,
  initialHtml,
  onSave,
  onClose,
}: EmailBuilderProps) {
  const editorRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleReady = (unlayer: any) => {
    editorRef.current = unlayer;
    setReady(true);
    try {
      if (initialDesign && Object.keys(initialDesign).length > 0) {
        unlayer.loadDesign(initialDesign);
      } else if (initialHtml && initialHtml.trim()) {
        unlayer.loadDesign(htmlToDesign(initialHtml));
      }
    } catch {
      // Fall back to a blank canvas if the design can't be parsed.
    }
  };

  const handleSave = () => {
    if (!editorRef.current) return;
    setSaving(true);
    editorRef.current.exportHtml((data: { design: Record<string, unknown>; html: string }) => {
      onSave(data.html, data.design);
      setSaving(false);
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="rounded bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-600">
            Email Builder
          </span>
          <span className="truncate text-sm font-medium text-slate-600">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!ready || saving}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save design
          </button>
        </div>
      </header>
      <div className="relative flex-1 min-h-0">
        {!ready && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
            <span className="ml-2 text-sm text-slate-500">Loading editor…</span>
          </div>
        )}
        <EmailEditor
          onReady={handleReady}
          minHeight="calc(100vh - 52px)"
          options={{
            mergeTags: MERGE_TAGS,
            appearance: { theme: "modern_light" },
            features: { preview: true },
            displayMode: "email",
          }}
          style={{ height: "calc(100vh - 52px)" }}
        />
      </div>
    </div>
  );
}
