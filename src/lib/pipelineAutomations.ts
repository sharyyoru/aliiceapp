import { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, isEmailConfigured } from "@/lib/email";

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

export function buildOrgContext(org: AutomationOrg, toStageId: string, fromStageId: string | null) {
  return {
    org: {
      name: org.name || "",
      slug: org.slug || "",
      email: org.email || "",
      phone: org.phone || "",
      city: org.city || "",
      country: org.country || "",
      tier: org.subscription_tier || "free",
      deal_value: org.deal_value || 0,
    },
    stage: {
      id: toStageId,
      label: STAGE_LABELS[toStageId] || toStageId,
    },
    from_stage: {
      id: fromStageId || "",
      label: fromStageId ? STAGE_LABELS[fromStageId] || fromStageId : "",
    },
  };
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

    const context = buildOrgContext(org, toStageId, fromStageId);

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
          .select("id, subject, body_html")
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

        const subject = renderTemplate(tpl.subject, context) || "Update from Aliice";
        const html = renderTemplate(tpl.body_html, context);

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
          await logRun("success", { recipient, subject, messageId: result.messageId });
        } else {
          await logRun("failed", { recipient, subject, error: result.error });
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
