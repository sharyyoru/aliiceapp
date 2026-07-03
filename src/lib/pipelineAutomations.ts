import { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { createDemoCalendarEvent, DemoEventResult } from "@/lib/googleCalendar";

const emailFromAddress = process.env.EMAIL_FROM_ADDRESS || "info@mail.maisontoa.com";
const emailFromName = process.env.EMAIL_FROM_NAME || "Aliice";

// Sales funnel stage labels (kept in sync with the admin organizations route)
const STAGE_LABELS: Record<string, string> = {
  new_signup: "New Signup",
  contacted: "Contacted",
  demo_scheduled: "Demo Scheduled",
  onboarding: "Onboarding",
  active: "Active Client",
  churned: "Churned",
};

export interface AutomationOrg {
  id: string;
  name: string | null;
  slug: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  subscription_tier: string | null;
  deal_value: number | null;
  preferred_language?: string | null;
}

export interface AutomationContact {
  full_name?: string | null;
  first_name?: string | null;
}

function resolvePath(object: unknown, path: string): unknown {
  const parts = path.split(".").map((p) => p.trim()).filter(Boolean);
  return parts.reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    if (!(key in (current as Record<string, unknown>))) return undefined;
    return (current as Record<string, unknown>)[key];
  }, object);
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#123;/g, "{")
    .replace(/&#125;/g, "}")
    .replace(/&lbrace;/g, "{")
    .replace(/&rbrace;/g, "}")
    .replace(/&#x7b;/gi, "{")
    .replace(/&#x7d;/gi, "}");
}

/** Render {{merge.fields}} against a context object. */
export function renderTemplate(template: string, context: unknown): string {
  if (!template) return "";
  const decoded = decodeHtmlEntities(template);
  return decoded.replace(/{{\s*([^}]+?)\s*}}/g, (_m, rawPath) => {
    const value = resolvePath(context, String(rawPath));
    if (value === undefined || value === null) return "";
    return String(value);
  });
}

function formatDemoDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Zurich",
    });
  } catch {
    return iso;
  }
}

function formatDemoTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Zurich",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

export function buildOrgContext(
  org: AutomationOrg,
  toStageId: string,
  fromStageId: string | null,
  contact?: AutomationContact | null,
  demoEvent?: DemoEventResult | null
) {
  const contactFull = (contact?.full_name || "").trim();
  const contactFirst = (contact?.first_name || contactFull.split(" ")[0] || "").trim();
  const displayName = contactFull || org.name || "";
  return {
    org: {
      name: org.name || "",
      slug: org.slug || "",
      email: org.email || "",
      // URL-encoded for safe use inside link query strings.
      email_encoded: encodeURIComponent(org.email || ""),
      phone: org.phone || "",
      city: org.city || "",
      country: org.country || "",
      tier: org.subscription_tier || "free",
      deal_value: org.deal_value || 0,
    },
    contact: {
      // Falls back to the organization name so greetings are never empty.
      name: displayName,
      first_name: contactFirst || org.name || "",
      name_encoded: encodeURIComponent(displayName),
    },
    stage: {
      id: toStageId,
      label: STAGE_LABELS[toStageId] || toStageId,
    },
    from_stage: {
      id: fromStageId || "",
      label: fromStageId ? STAGE_LABELS[fromStageId] || fromStageId : "",
    },
    demo: demoEvent
      ? {
          meet_link: demoEvent.meetLink || "",
          calendar_link: demoEvent.htmlLink || "",
          date: formatDemoDate(demoEvent.start),
          time: formatDemoTime(demoEvent.start),
          start_iso: demoEvent.start,
          end_iso: demoEvent.end,
          has_meet: demoEvent.meetLink ? "true" : "",
        }
      : {
          meet_link: "",
          calendar_link: "",
          date: "",
          time: "",
          start_iso: "",
          end_iso: "",
          has_meet: "",
        },
  };
}

function normalizeLanguage(lang: string | null | undefined): "en" | "fr" {
  return String(lang || "").toLowerCase().startsWith("fr") ? "fr" : "en";
}

type AutomationRow = {
  id: string;
  name: string;
  trigger_stage: string;
  active: boolean;
  action_type: string;
  template_id: string | null;
  admin_email: string | null;
  config: Record<string, unknown> | null;
};

type TemplateRow = {
  id: string;
  subject: string;
  body_html: string;
  subject_fr?: string | null;
  body_html_fr?: string | null;
};

/**
 * Run all active automations whose trigger_stage matches `toStageId`.
 * Designed to be called after an organization's stage has changed.
 * Failures are logged but never throw — automations must not block the
 * primary stage-update flow.
 */
export async function runStageAutomations(
  supabase: SupabaseClient,
  org: AutomationOrg,
  toStageId: string,
  fromStageId: string | null
): Promise<{ triggered: number; sent: number }> {
  let triggered = 0;
  let sent = 0;

  try {
    const { data: automations, error } = await supabase
      .from("sales_pipeline_automations")
      .select("id, name, trigger_stage, active, action_type, template_id, admin_email, config")
      .eq("trigger_stage", toStageId)
      .eq("active", true);

    if (error || !automations || automations.length === 0) {
      return { triggered, sent };
    }

    // Best-effort: fetch the org's primary contact so emails can greet a person.
    let primaryContact: AutomationContact | null = null;
    try {
      const { data: contactRow } = await supabase
        .from("organization_contacts")
        .select("full_name")
        .eq("organization_id", org.id)
        .order("is_primary", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (contactRow) primaryContact = { full_name: contactRow.full_name };
    } catch {
      // contact enrichment is optional
    }

    const language = normalizeLanguage(org.preferred_language);

    // For demo_scheduled stage: auto-create a Google Calendar event with Meet.
    let demoEvent: DemoEventResult | null = null;
    if (toStageId === "demo_scheduled") {
      try {
        demoEvent = await createDemoCalendarEvent(
          org.name || "Client",
          org.email,
        );
        if (demoEvent) {
          console.log(`[agenda] Created demo event for org ${org.id}: meet=${demoEvent.meetLink}`);
        }
      } catch (calErr) {
        console.error("[agenda] Failed to create demo calendar event (non-fatal):", calErr);
      }
    }

    const context = buildOrgContext(org, toStageId, fromStageId, primaryContact, demoEvent);

    for (const automation of automations as AutomationRow[]) {
      triggered += 1;
      const logRun = async (status: string, detail: Record<string, unknown>) => {
        await supabase.from("sales_pipeline_automation_runs").insert({
          automation_id: automation.id,
          organization_id: org.id,
          from_stage: fromStageId,
          to_stage: toStageId,
          status,
          detail,
        });
      };

      if (automation.action_type === "send_email" || automation.action_type === "send_email_to_admin") {
        if (!automation.template_id) {
          await logRun("skipped", { reason: "No template configured" });
          continue;
        }

        const { data: template } = await supabase
          .from("sales_pipeline_email_templates")
          .select("*")
          .eq("id", automation.template_id)
          .single();

        if (!template) {
          await logRun("skipped", { reason: "Template not found" });
          continue;
        }

        const tpl = template as TemplateRow;
        const isAdmin = automation.action_type === "send_email_to_admin";
        const recipient = isAdmin ? automation.admin_email : org.email;

        if (!recipient) {
          await logRun("skipped", {
            reason: isAdmin ? "No admin email configured" : "Organization has no email",
          });
          continue;
        }

        // Pick the language variant. Fall back to English when the French
        // variant is missing/empty so an automation never sends blank content.
        const useFr = language === "fr" && !!(tpl.body_html_fr && tpl.body_html_fr.trim());
        const rawSubject = useFr ? tpl.subject_fr || tpl.subject : tpl.subject;
        const rawBody = useFr ? tpl.body_html_fr || tpl.body_html : tpl.body_html;

        const subject = renderTemplate(rawSubject, context) || "Update from Aliice";
        const html = renderTemplate(rawBody, context);

        if (!isEmailConfigured()) {
          await logRun("skipped", { reason: "Email service not configured", recipient, subject });
          continue;
        }

        const result = await sendEmail({
          to: recipient,
          subject,
          html,
          from: emailFromAddress,
          fromName: emailFromName,
        });

        if (result.success) {
          sent += 1;
          await logRun("success", { recipient, subject, language, messageId: result.messageId });
        } else {
          await logRun("failed", { recipient, subject, language, error: result.error });
        }
      } else {
        await logRun("skipped", { reason: `Unsupported action_type: ${automation.action_type}` });
      }
    }
  } catch (err) {
    console.error("runStageAutomations error:", err);
  }

  return { triggered, sent };
}
