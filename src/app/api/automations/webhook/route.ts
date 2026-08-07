import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSystemEmailUnified } from "@/lib/email";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { record, type } = body;

    // Only handle organization updates
    if (type !== "UPDATE" || !record || !record.id || !record.sales_funnel_stage) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch active automations for this stage
    const { data: automations } = await supabase
      .from("sales_pipeline_automations")
      .select("*, template:sales_pipeline_email_templates(*)")
      .eq("trigger_stage", record.sales_funnel_stage)
      .eq("active", true);

    if (!automations || automations.length === 0) {
      return NextResponse.json({ ok: true, no_automations: true });
    }

    // Fetch organization details for email templating
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", record.id)
      .single();

    if (!org) {
      console.error("[automation webhook] Organization not found:", record.id);
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Execute each automation
    const results = await Promise.allSettled(
      automations.map(async (automation: any) => {
        if (automation.action_type !== "send_email" || !automation.template) {
          return { skipped: true, reason: "Not an email automation" };
        }

        const template = automation.template;
        const recipientEmail = automation.admin_email || org.email || "info@aliice.app";

        // Simple template variable replacement
        let subject = template.subject || "Aliice Update";
        let html = template.body_html || "";

        // Replace {{org.name}}, {{org.email}}, etc.
        subject = subject.replace(/\{\{org\.name\}\}/g, org.name || "");
        subject = subject.replace(/\{\{org\.email\}\}/g, org.email || "");
        html = html.replace(/\{\{org\.name\}\}/g, org.name || "");
        html = html.replace(/\{\{org\.email\}\}/g, org.email || "");
        html = html.replace(/\{\{org\.phone\}\}/g, org.phone || "");
        html = html.replace(/\{\{org\.slug\}\}/g, org.slug || "");

        const result = await sendSystemEmailUnified({
          to: recipientEmail,
          subject,
          html,
          replyTo: org.email || undefined,
        });

        return { sent: result.success, messageId: result.messageId, template: template.name };
      })
    );

    const failures = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.sent));
    if (failures.length > 0) {
      console.error("[automation webhook] Some automations failed:", failures);
    }

    return NextResponse.json({ ok: true, executed: results.length, failures: failures.length });
  } catch (error) {
    console.error("[automation webhook] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
