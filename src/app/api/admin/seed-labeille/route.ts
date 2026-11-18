import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * TEMPORARY one-shot seed for the L'Abeille demo tenant.
 * Guarded by EXPORT_SECRET env var — DELETE after demo/migration.
 *
 *   GET /api/admin/seed-labeille?secret=...
 *
 * Idempotent: re-running reuses/updates existing rows.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.aliice.app").replace(/\/$/, "");
const LOGO_ABS = `${APP_URL}/logos/labeille-logo.jpg`;
const GOLD = "#C9A227";

const ORG = {
  name: "L'Abeille Medical Concierge",
  slug: "labeille",
  email: "partner@labelle-medical-concierge.com",
  phone: "+41 22 000 00 00",
  website: "https://labelle-medical-concierge.com",
  street_address: "Rue du Rhône",
  street_number: "1",
  postal_code: "1204",
  city: "Genève",
  canton: "GE",
  country: "Switzerland",
  logo_url: "/logos/labeille-logo.jpg",
  primary_color: GOLD,
  subscription_tier: "enterprise",
  subscription_status: "active",
};

const DEMO_USER = {
  email: "demo@labelle-medical-concierge.com",
  password: "LabeilleDemo2026!",
  full_name: "Martha Schiller",
};

const DOCTORS = [
  { name: "Swiss Smile Dentist", specialty: "Dentistry & Smile Design" },
  { name: "Swiss Longevity Gate", specialty: "Longevity & Preventive Medicine" },
  { name: "Pr Kherad — Hôpital de la Tour", specialty: "Cardiology" },
  { name: "Dr Tenorio Aesthetic Clinic", specialty: "Aesthetic Medicine" },
  { name: "Buchinger Marbella", specialty: "Therapeutic Fasting & Integrative Medicine" },
  { name: "Pragmos Clinic Madrid", specialty: "Regenerative Medicine" },
  { name: "Swiss Health Coach Meeting", specialty: "Health Coaching" },
  { name: "Dr Mensah", specialty: "Case Management" },
];

const PATIENTS = [
  { first_name: "Claire", last_name: "Dubois", gender: "female", dob: "1978-03-14", town: "Genève", nationality: "Swiss" },
  { first_name: "Jean-Marc", last_name: "Rochat", gender: "male", dob: "1965-07-02", town: "Lausanne", nationality: "Swiss" },
  { first_name: "Sofia", last_name: "Almeida", gender: "female", dob: "1990-11-25", town: "Genève", nationality: "Portuguese" },
  { first_name: "Henrik", last_name: "Larsen", gender: "male", dob: "1972-01-30", town: "Nyon", nationality: "Danish" },
  { first_name: "Amira", last_name: "Ben Salem", gender: "female", dob: "1985-05-17", town: "Genève", nationality: "Tunisian" },
  { first_name: "Oliver", last_name: "Grant", gender: "male", dob: "1980-09-08", town: "Montreux", nationality: "British" },
  { first_name: "Isabelle", last_name: "Fontaine", gender: "female", dob: "1969-12-03", town: "Genève", nationality: "French" },
  { first_name: "Rashid", last_name: "Al Mansouri", gender: "male", dob: "1975-04-21", town: "Genève", nationality: "Emirati" },
  { first_name: "Elena", last_name: "Petrova", gender: "female", dob: "1988-08-11", town: "Versoix", nationality: "Bulgarian" },
  { first_name: "Thomas", last_name: "Weber", gender: "male", dob: "1958-02-19", town: "Carouge", nationality: "German" },
  { first_name: "Nathalie", last_name: "Perrenoud", gender: "female", dob: "1993-06-27", town: "Genève", nationality: "Swiss" },
  { first_name: "Viktor", last_name: "Hessel", gender: "male", dob: "1983-10-05", town: "Morges", nationality: "Dutch" },
];

const APPOINTMENT_REASONS = [
  "Consultation initiale", "Bilan de santé annuel", "Suivi post-traitement",
  "Consultation de contrôle", "Deuxième avis médical", "Téléconsultation",
  "Résultats d'analyses", "Plan de traitement",
];

function labeilleEmail(subject: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f7f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7f5f0;">
    <tr><td align="center" style="padding:52px 20px 72px 20px;">
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:580px;background-color:#ffffff;">
        <tr><td align="center" style="padding:44px 48px 36px 48px;border-bottom:2px solid ${GOLD};">
          <img src="${LOGO_ABS}" alt="L'Abeille" width="120" style="display:block;width:120px;height:auto;margin:0 auto;">
        </td></tr>
        <tr><td style="padding:40px 48px 32px 48px;color:#1a1a18;font-size:15px;line-height:1.85;">
          <h2 style="margin:0 0 18px 0;font-size:20px;font-weight:600;color:#1a1a18;">${subject}</h2>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:28px 48px 48px 48px;border-top:1px solid #e8e3db;">
          <p style="margin:0;color:#8a8578;font-size:12px;line-height:2;letter-spacing:0.02em;">
            L'Abeille Medical Concierge<br>Rue du Rhône 1, 1204 Genève<br>partner@labelle-medical-concierge.com
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function GET(req: NextRequest) {
  const expected = process.env.EXPORT_SECRET;
  if (!expected || req.nextUrl.searchParams.get("secret") !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const log: string[] = [];
  const errors: string[] = [];
  const step = (m: string) => log.push(m);
  const fail = (m: string, e: unknown) =>
    errors.push(`${m}: ${(e as { message?: string })?.message || String(e)}`);

  try {
    // ── org ──
    const { data: existOrg } = await supabaseAdmin.from("organizations").select("id").eq("slug", ORG.slug).maybeSingle();
    let orgId: string;
    if (existOrg) {
      orgId = existOrg.id;
      await supabaseAdmin.from("organizations").update(ORG).eq("id", orgId);
      step(`org reused ${orgId}`);
    } else {
      const { data, error } = await supabaseAdmin.from("organizations").insert(ORG).select("id").single();
      if (error) throw error;
      orgId = data.id;
      step(`org created ${orgId}`);
    }

    // ── demo user ──
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    let user = list?.users?.find((u) => u.email?.toLowerCase() === DEMO_USER.email);
    if (!user) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_USER.email, password: DEMO_USER.password, email_confirm: true,
        user_metadata: { full_name: DEMO_USER.full_name },
      });
      if (error) throw error;
      user = data.user;
      step("auth user created");
    } else {
      await supabaseAdmin.auth.admin.updateUserById(user.id, { password: DEMO_USER.password });
      step("auth user reused");
    }
    const userId = user.id;

    await supabaseAdmin.from("users").upsert({
      id: userId, email: DEMO_USER.email, full_name: DEMO_USER.full_name,
      role: "admin", current_organization_id: orgId, onboarding_completed: true,
    });
    await supabaseAdmin.from("organization_members").upsert(
      { organization_id: orgId, user_id: userId, role: "owner", job_title: "Director", is_active: true },
      { onConflict: "organization_id,user_id" }
    );
    await supabaseAdmin.from("organizations").update({ owner_user_id: userId }).eq("id", orgId);
    await supabaseAdmin.from("organization_settings").upsert(
      { organization_id: orgId, default_language: "fr", currency: "CHF", appointment_slot_duration: 30 },
      { onConflict: "organization_id" }
    );
    step("membership + settings");

    // ── doctors ──
    const doctorIds: string[] = [];
    for (const [i, d] of DOCTORS.entries()) {
      const { data: ex } = await supabaseAdmin.from("providers").select("id")
        .eq("organization_id", orgId).eq("name", d.name).maybeSingle();
      if (ex) { doctorIds.push(ex.id); continue; }
      const { data, error } = await supabaseAdmin.from("providers").insert({
        name: d.name, specialty: d.specialty,
        email: `doctor${i + 1}@labeille-demo.ch`,
        organization_id: orgId, role: "doctor",
      }).select("id").single();
      if (error) { fail(`provider ${d.name}`, error); continue; }
      doctorIds.push(data.id);
    }
    step(`${doctorIds.length} doctors`);

    // ── patients + history ──
    const patientIds: string[] = [];
    const now = Date.now();
    for (const [i, p] of PATIENTS.entries()) {
      const email = `${p.first_name.toLowerCase().replace(/[^a-z]/g, "")}.${p.last_name.toLowerCase().replace(/[^a-z]/g, "")}@labeille-demo.ch`;
      const { data: ex } = await supabaseAdmin.from("patients").select("id").eq("email", email).maybeSingle();
      let pid = ex?.id as string | undefined;
      if (!pid) {
        const { data, error } = await supabaseAdmin.from("patients").insert({
          ...p, email, phone: `+41 79 000 ${String(100 + i).slice(1)}`,
          street_address: "Rue du Rhône", postal_code: "1204", country: "Switzerland",
          source: "manual", language_preference: "fr", lifecycle_stage: "patient",
          organization_id: orgId, created_by_user_id: userId,
          notes: "Patient démo — L'Abeille Medical Concierge.",
        }).select("id").single();
        if (error) { fail(`patient ${email}`, error); continue; }
        pid = data.id;
      }
      if (!pid) continue;
      patientIds.push(pid);

      const { data: exBg } = await supabaseAdmin.from("patient_health_background").select("id").eq("patient_id", pid).limit(1);
      if (!exBg?.length) {
        await supabaseAdmin.from("patient_health_background").insert({
          patient_id: pid,
          weight_kg: 55 + ((i * 7) % 40), height_cm: 160 + ((i * 5) % 30),
          known_illnesses: i % 3 === 0 ? "Hypertension artérielle" : "Aucune connue",
          previous_surgeries: i % 4 === 0 ? "Appendicectomie (2010)" : "Aucune",
          allergies: i % 5 === 0 ? "Pénicilline" : "Aucune allergie connue",
          medications: i % 3 === 0 ? "Amlodipine 5mg 1x/jour" : "Aucun",
          cigarettes: i % 4 === 0 ? "Non-fumeur" : "Occasionnel",
          alcohol_consumption: "Modéré", sports_activity: "2-3 fois par semaine",
        });
      }

      await supabaseAdmin.from("medical_records").upsert({
        patient_id: pid,
        ap_content: "Anamnèse: patient(e) référé(e) par L'Abeille concierge. Bon état général. Motif: bilan préventif et suivi coordonné multi-spécialistes.",
        af_content: `Antécédents familiaux: ${i % 2 === 0 ? "père diabétique type 2" : "sans particularité"}.`,
        notes_content: "Notes de coordination: privilégier les téléconsultations. Préférence de langue: français.",
      }, { onConflict: "patient_id" });

      const { data: exIns } = await supabaseAdmin.from("patient_insurances").select("id").eq("patient_id", pid).limit(1);
      if (!exIns?.length) {
        await supabaseAdmin.from("patient_insurances").insert({
          patient_id: pid,
          provider_name: ["Helsana", "CSS", "Swica", "Groupe Mutuel"][i % 4],
          card_number: `807560${String(10000000 + i * 137913).slice(0, 8)}`,
          insurance_type: ["private", "semi_private", "basic"][i % 3],
        });
      }

      const { data: exNote } = await supabaseAdmin.from("patient_notes").select("id").eq("patient_id", pid).limit(1);
      if (!exNote?.length) {
        await supabaseAdmin.from("patient_notes").insert({
          patient_id: pid,
          body: "Premier contact via Martha Schiller (L'Abeille). Souhaite un parcours de soins coordonné sur l'année.",
          author_user_id: userId, author_name: DEMO_USER.full_name,
        });
      }

      const { data: exCons } = await supabaseAdmin.from("consultations").select("id").eq("patient_id", pid).limit(1);
      if (!exCons?.length) {
        await supabaseAdmin.from("consultations").insert([
          {
            patient_id: pid, consultation_id: `LAB-${String(i + 1).padStart(3, "0")}-A`,
            title: "Consultation d'accueil", record_type: "notes",
            doctor_name: "Dr Mensah", scheduled_at: new Date(now - 90 * 864e5).toISOString(),
            content: "Prise en charge initiale: recueil des antécédents, objectifs de santé, planification du parcours annuel.",
            organization_id: orgId,
          },
          {
            patient_id: pid, consultation_id: `LAB-${String(i + 1).padStart(3, "0")}-B`,
            title: "Prescription bilan sanguin", record_type: "prescription",
            doctor_name: "Swiss Longevity Gate", scheduled_at: new Date(now - 60 * 864e5).toISOString(),
            content: "Bilan sanguin complet: NFS, lipidogramme, HbA1c, vitamine D, hormones thyroïdiennes.",
            organization_id: orgId,
          },
        ]);
      }
    }
    step(`${patientIds.length} patients + history`);

    // ── appointments (yearly calendar) ──
    let apptCount = 0;
    for (const [pi, pid] of patientIds.entries()) {
      const { data: ex } = await supabaseAdmin.from("appointments").select("id").eq("patient_id", pid).limit(1);
      if (ex?.length) continue;
      const rows = [];
      for (let m = -3; m <= 12; m += 3) {
        const start = new Date(now + m * 30 * 864e5 + ((pi * 37 + m * 11) % 9) * 36e5);
        start.setMinutes(0, 0, 0);
        rows.push({
          patient_id: pid,
          provider_id: doctorIds[(pi + Math.max(0, m)) % doctorIds.length],
          start_time: start.toISOString(),
          end_time: new Date(start.getTime() + 45 * 6e4).toISOString(),
          status: m < 0 ? "completed" : "scheduled",
          reason: APPOINTMENT_REASONS[(pi + m + 12) % APPOINTMENT_REASONS.length],
          location: "Genève / Téléconsultation",
          source: "manual",
          organization_id: orgId,
        });
      }
      const { error } = await supabaseAdmin.from("appointments").insert(rows);
      if (error) fail(`appointments ${pid}`, error);
      else apptCount += rows.length;
    }
    step(`${apptCount} appointments`);

    // ── branded email templates ──
    const templates = [
      {
        name: "L'Abeille — Bienvenue", type: "workflow",
        subject_template: "Bienvenue chez L'Abeille Medical Concierge, {{patient.first_name}}",
        body_template: "Bienvenue {{patient.first_name}} {{patient.last_name}}. Votre parcours de soins coordonné commence maintenant.",
        html_content: labeilleEmail("Bienvenue chez L'Abeille", `<p>Bonjour {{patient.first_name}},</p>
          <p>Nous sommes ravis de vous accueillir. Votre case manager vous contactera sous 24h pour planifier votre premier rendez-vous.</p>
          <p style="color:${GOLD};font-weight:600;">Votre santé, notre priorité.</p>`),
      },
      {
        name: "L'Abeille — Confirmation de rendez-vous", type: "workflow",
        subject_template: "Confirmation de votre rendez-vous — {{appointment.date}}",
        body_template: "Votre rendez-vous est confirmé le {{appointment.date}} à {{appointment.time}}. Lien vidéo: {{appointment.meet_link}}",
        html_content: labeilleEmail("Rendez-vous confirmé", `<p>Bonjour {{patient.first_name}},</p>
          <p>Votre rendez-vous avec <strong>{{appointment.doctor}}</strong> est confirmé:</p>
          <p><strong>Date:</strong> {{appointment.date}}<br><strong>Heure:</strong> {{appointment.time}}<br>
          <strong>Lieu:</strong> {{appointment.location}}</p>
          <p><a href="{{appointment.meet_link}}" style="display:inline-block;background:${GOLD};color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;">Rejoindre la téléconsultation</a></p>`),
      },
      {
        name: "L'Abeille — Suivi après consultation", type: "workflow",
        subject_template: "Votre suivi personnalisé — L'Abeille",
        body_template: "Merci pour votre visite. Voici votre compte-rendu et les prochaines étapes.",
        html_content: labeilleEmail("Votre suivi", `<p>Bonjour {{patient.first_name}},</p>
          <p>Merci pour votre consultation. Votre compte-rendu est disponible dans votre dossier patient. Votre prochaine étape: {{next_step}}.</p>
          <p>N'hésitez pas à répondre à cet e-mail pour toute question.</p>`),
      },
    ];

    const templateIds: Record<string, string> = {};
    for (const t of templates) {
      const { data: ex } = await supabaseAdmin.from("email_templates").select("id")
        .eq("organization_id", orgId).eq("name", t.name).maybeSingle();
      if (ex) {
        await supabaseAdmin.from("email_templates").update({ ...t, organization_id: orgId }).eq("id", ex.id);
        templateIds[t.name] = ex.id;
      } else {
        const { data, error } = await supabaseAdmin.from("email_templates")
          .insert({ ...t, organization_id: orgId }).select("id").single();
        if (error) { fail(`template ${t.name}`, error); continue; }
        templateIds[t.name] = data.id;
      }
    }
    step(`${Object.keys(templateIds).length} email templates`);

    // ── workflows ──
    const wf = (name: string, triggerType: string, templateName: string, subject: string) => ({
      name, trigger_type: triggerType, active: true, organization_id: orgId,
      config: {
        nodes: [
          { id: "trigger-1", type: "trigger", data: { triggerType, config: {} }, nextNodeId: "action-1" },
          { id: "action-1", type: "action", data: { actionType: "send_email", config: { template_id: templateIds[templateName] || null, recipient: "patient", subject } } },
        ],
      },
    });

    const workflows = [
      wf("L'Abeille — Accueil nouveau patient", "patient_created", "L'Abeille — Bienvenue", "Bienvenue chez L'Abeille Medical Concierge"),
      wf("L'Abeille — Confirmation rendez-vous", "appointment_created", "L'Abeille — Confirmation de rendez-vous", "Confirmation de votre rendez-vous"),
      wf("L'Abeille — Suivi post-consultation", "appointment_completed", "L'Abeille — Suivi après consultation", "Votre suivi personnalisé"),
    ];
    for (const w of workflows) {
      const { data: ex } = await supabaseAdmin.from("workflows").select("id")
        .eq("organization_id", orgId).eq("name", w.name).maybeSingle();
      if (ex) await supabaseAdmin.from("workflows").update(w).eq("id", ex.id);
      else {
        const { error } = await supabaseAdmin.from("workflows").insert(w);
        if (error) fail(`workflow ${w.name}`, error);
      }
    }
    step(`${workflows.length} workflows`);

    return NextResponse.json({
      ok: true,
      org: { slug: ORG.slug, id: orgId },
      login: { email: DEMO_USER.email, password: DEMO_USER.password },
      steps: log,
      errors,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), steps: log, errors }, { status: 500 });
  }
}
