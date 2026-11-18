/**
 * Seed script: L'Abeille Medical Concierge demo tenant.
 *
 * Creates: organization + branding, a demo login (owner), 8 concierge doctors,
 * ~12 demo patients with medical history, a simulated year of appointments,
 * branded email templates and sample workflows.
 *
 * Usage:
 *   node scripts/seed-labeille-demo.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * (reads .env.local automatically if present).
 *
 * Idempotent: safe to re-run; existing rows are reused/updated, not duplicated.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── env ──────────────────────────────────────────────────────────────────────
for (const file of [".env.local", ".env"]) {
  const p = resolve(ROOT, file);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const SUPABASE_URL = process.env.NEW_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.NEW_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.aliice.app").replace(/\/$/, "");
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (set them or create .env.local)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── constants ────────────────────────────────────────────────────────────────
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
  primary_color: "#C9A227",
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
  "Consultation initiale",
  "Bilan de santé annuel",
  "Suivi post-traitement",
  "Consultation de contrôle",
  "Deuxième avis médical",
  "Téléconsultation",
  "Résultats d'analyses",
  "Plan de traitement",
];

const LOGO_ABS = `${APP_URL}/logos/labeille-logo.jpg`;
const GOLD = "#C9A227";

// ── helpers ──────────────────────────────────────────────────────────────────
const ok = (label) => console.log(`  ✓ ${label}`);
const fail = (label, err) => {
  console.error(`  ✗ ${label}:`, err?.message || err);
};

function labeilleEmail(subject, bodyHtml) {
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

// ── seed steps ───────────────────────────────────────────────────────────────
async function getOrCreateOrg() {
  const { data: existing } = await supabase.from("organizations").select("*").eq("slug", ORG.slug).maybeSingle();
  if (existing) {
    await supabase.from("organizations").update(ORG).eq("id", existing.id);
    ok(`organization reused (${existing.id})`);
    return existing.id;
  }
  const { data, error } = await supabase.from("organizations").insert(ORG).select("id").single();
  if (error) throw error;
  ok(`organization created (${data.id})`);
  return data.id;
}

async function getOrCreateDemoUser(orgId) {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  let user = list?.users?.find((u) => u.email?.toLowerCase() === DEMO_USER.email);
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_USER.email,
      password: DEMO_USER.password,
      email_confirm: true,
      user_metadata: { full_name: DEMO_USER.full_name },
    });
    if (error) throw error;
    user = data.user;
    ok(`auth user created: ${DEMO_USER.email}`);
  } else {
    await supabase.auth.admin.updateUserById(user.id, { password: DEMO_USER.password });
    ok(`auth user reused: ${DEMO_USER.email}`);
  }

  await supabase.from("users").upsert({
    id: user.id,
    email: DEMO_USER.email,
    full_name: DEMO_USER.full_name,
    role: "admin",
    current_organization_id: orgId,
    onboarding_completed: true,
  });

  const { error: mErr } = await supabase.from("organization_members").upsert(
    { organization_id: orgId, user_id: user.id, role: "owner", job_title: "Director", is_active: true },
    { onConflict: "organization_id,user_id" }
  );
  if (mErr) fail("organization_members", mErr);

  await supabase.from("organizations").update({ owner_user_id: user.id }).eq("id", orgId);
  await supabase.from("organization_settings").upsert(
    { organization_id: orgId, default_language: "fr", currency: "CHF", appointment_slot_duration: 30 },
    { onConflict: "organization_id" }
  );
  ok("membership + settings set");
  return user.id;
}

async function seedDoctors(orgId) {
  const ids = [];
  for (const [i, d] of DOCTORS.entries()) {
    const email = `doctor${i + 1}@labeille-demo.ch`;
    const { data: existing } = await supabase
      .from("providers").select("id").eq("organization_id", orgId).eq("name", d.name).maybeSingle();
    if (existing) { ids.push(existing.id); continue; }
    const { data, error } = await supabase.from("providers").insert({
      name: d.name, specialty: d.specialty, email, organization_id: orgId, role: "doctor",
    }).select("id").single();
    if (error) { fail(`provider ${d.name}`, error); continue; }
    ids.push(data.id);
  }
  ok(`${ids.length} doctors`);
  return ids;
}

async function seedPatients(orgId, userId) {
  const ids = [];
  for (const [i, p] of PATIENTS.entries()) {
    const email = `${p.first_name.toLowerCase().replace(/[^a-z]/g, "")}.${p.last_name.toLowerCase().replace(/[^a-z]/g, "")}@labeille-demo.ch`;
    let id;
    const { data: existing } = await supabase.from("patients").select("id").eq("email", email).maybeSingle();
    if (existing) {
      id = existing.id;
    } else {
      const { data, error } = await supabase.from("patients").insert({
        ...p, email, phone: `+41 79 000 ${String(100 + i).slice(1)}`,
        street_address: "Rue du Rhône", postal_code: "1204", country: "Switzerland",
        source: "manual", language_preference: "fr", lifecycle_stage: "patient",
        organization_id: orgId, created_by_user_id: userId,
        notes: "Patient démo — L'Abeille Medical Concierge.",
      }).select("id").single();
      if (error) { fail(`patient ${email}`, error); continue; }
      id = data.id;
    }
    ids.push(id);

    const { data: existBg } = await supabase.from("patient_health_background").select("id").eq("patient_id", id).limit(1);
    if (!existBg?.length) {
      await supabase.from("patient_health_background").insert({
        patient_id: id,
        weight_kg: 55 + ((i * 7) % 40), height_cm: 160 + ((i * 5) % 30),
        known_illnesses: i % 3 === 0 ? "Hypertension artérielle" : "Aucune connue",
        previous_surgeries: i % 4 === 0 ? "Appendicectomie (2010)" : "Aucune",
        allergies: i % 5 === 0 ? "Pénicilline" : "Aucune allergie connue",
        medications: i % 3 === 0 ? "Amlodipine 5mg 1x/jour" : "Aucun",
        cigarettes: i % 4 === 0 ? "Non-fumeur" : "Occasionnel",
        alcohol_consumption: "Modéré",
        sports_activity: "2-3 fois par semaine",
      });
    }

    await supabase.from("medical_records").upsert({
      patient_id: id,
      ap_content: `Anamnèse: patient(e) référé(e) par L'Abeille concierge. Bon état général. Motif: bilan préventif et suivi coordonné multi-spécialistes.`,
      af_content: `Antécédents familiaux: ${i % 2 === 0 ? "père diabétique type 2" : "sans particularité"}.`,
      notes_content: `Notes de coordination: privilégier les téléconsultations. Préférence de langue: français.`,
    }, { onConflict: "patient_id" });

    const { data: existIns } = await supabase.from("patient_insurances").select("id").eq("patient_id", id).limit(1);
    if (!existIns?.length) {
      await supabase.from("patient_insurances").insert({
        patient_id: id,
        provider_name: ["Helsana", "CSS", "Swica", "Groupe Mutuel"][i % 4],
        card_number: `807560${String(10000000 + i * 137913).slice(0, 8)}`,
        insurance_type: ["private", "semi_private", "basic"][i % 3],
      });
    }

    const { data: existNote } = await supabase.from("patient_notes").select("id").eq("patient_id", id).limit(1);
    if (!existNote?.length) {
      await supabase.from("patient_notes").insert({
        patient_id: id,
        body: "Premier contact via Martha Schiller (L'Abeille). Souhaite un parcours de soins coordonné sur l'année.",
        author_user_id: userId,
        author_name: DEMO_USER.full_name,
      });
    }

    const { data: existCons } = await supabase.from("consultations").select("id").eq("patient_id", id).limit(1);
    if (!existCons?.length) {
      await supabase.from("consultations").insert([
        {
          patient_id: id, consultation_id: `LAB-${String(i + 1).padStart(3, "0")}-A`,
          title: "Consultation d'accueil", record_type: "notes",
          doctor_name: "Dr Mensah", scheduled_at: new Date(Date.now() - 90 * 864e5).toISOString(),
          content: "Prise en charge initiale: recueil des antécédents, objectifs de santé, planification du parcours annuel.",
          organization_id: orgId,
        },
        {
          patient_id: id, consultation_id: `LAB-${String(i + 1).padStart(3, "0")}-B`,
          title: "Prescription bilan sanguin", record_type: "prescription",
          doctor_name: "Swiss Longevity Gate", scheduled_at: new Date(Date.now() - 60 * 864e5).toISOString(),
          content: "Bilan sanguin complet: NFS, lipidogramme, HbA1c, vitamine D, hormones thyroïdiennes.",
          organization_id: orgId,
        },
      ]);
    }
  }
  ok(`${ids.length} patients + history`);
  return ids;
}

async function seedAppointments(orgId, patientIds, doctorIds) {
  let created = 0;
  const now = Date.now();
  for (const [pi, pid] of patientIds.entries()) {
    const { data: existing } = await supabase.from("appointments").select("id").eq("patient_id", pid).limit(1);
    if (existing?.length) continue;
    const rows = [];
    // ~quarterly appointments across a 15-month window (past + future year)
    for (let m = -3; m <= 12; m += 3) {
      const start = new Date(now + m * 30 * 864e5 + ((pi * 37 + m * 11) % 9) * 36e5);
      start.setMinutes(0, 0, 0);
      const end = new Date(start.getTime() + 45 * 6e4);
      rows.push({
        patient_id: pid,
        provider_id: doctorIds[(pi + Math.max(0, m)) % doctorIds.length],
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: m < 0 ? "completed" : "scheduled",
        reason: APPOINTMENT_REASONS[(pi + m + 12) % APPOINTMENT_REASONS.length],
        location: "Genève / Téléconsultation",
        source: "manual",
        organization_id: orgId,
      });
    }
    const { error } = await supabase.from("appointments").insert(rows);
    if (error) fail(`appointments patient ${pid}`, error);
    else created += rows.length;
  }
  ok(`${created} appointments (yearly calendar)`);
}

async function seedEmailsAndWorkflows(orgId) {
  const templates = [
    {
      name: "L'Abeille — Bienvenue",
      type: "workflow",
      subject_template: "Bienvenue chez L'Abeille Medical Concierge, {{patient.first_name}}",
      body_template: "Bienvenue {{patient.first_name}} {{patient.last_name}}. Votre parcours de soins coordonné commence maintenant.",
      html_content: labeilleEmail("Bienvenue chez L'Abeille", `<p>Bonjour {{patient.first_name}},</p>
        <p>Nous sommes ravis de vous accueillir. Votre case manager vous contactera sous 24h pour planifier votre premier rendez-vous.</p>
        <p style="color:${GOLD};font-weight:600;">Votre santé, notre priorité.</p>`),
    },
    {
      name: "L'Abeille — Confirmation de rendez-vous",
      type: "workflow",
      subject_template: "Confirmation de votre rendez-vous — {{appointment.date}}",
      body_template: "Votre rendez-vous est confirmé le {{appointment.date}} à {{appointment.time}}. Lien vidéo: {{appointment.meet_link}}",
      html_content: labeilleEmail("Rendez-vous confirmé", `<p>Bonjour {{patient.first_name}},</p>
        <p>Votre rendez-vous avec <strong>{{appointment.doctor}}</strong> est confirmé:</p>
        <p><strong>Date:</strong> {{appointment.date}}<br><strong>Heure:</strong> {{appointment.time}}<br>
        <strong>Lieu:</strong> {{appointment.location}}</p>
        <p><a href="{{appointment.meet_link}}" style="display:inline-block;background:${GOLD};color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;">Rejoindre la téléconsultation</a></p>`),
    },
    {
      name: "L'Abeille — Suivi après consultation",
      type: "workflow",
      subject_template: "Votre suivi personnalisé — L'Abeille",
      body_template: "Merci pour votre visite. Voici votre compte-rendu et les prochaines étapes.",
      html_content: labeilleEmail("Votre suivi", `<p>Bonjour {{patient.first_name}},</p>
        <p>Merci pour votre consultation. Votre compte-rendu est disponible dans votre dossier patient. Votre prochaine étape: {{next_step}}.</p>
        <p>N'hésitez pas à répondre à cet e-mail pour toute question.</p>`),
    },
  ];

  const templateIds = {};
  for (const t of templates) {
    const { data: existing } = await supabase.from("email_templates")
      .select("id").eq("organization_id", orgId).eq("name", t.name).maybeSingle();
    if (existing) {
      await supabase.from("email_templates").update({ ...t, organization_id: orgId }).eq("id", existing.id);
      templateIds[t.name] = existing.id;
    } else {
      const { data, error } = await supabase.from("email_templates")
        .insert({ ...t, organization_id: orgId }).select("id").single();
      if (error) { fail(`template ${t.name}`, error); continue; }
      templateIds[t.name] = data.id;
    }
  }
  ok(`${Object.keys(templateIds).length} branded email templates`);

  const wf = (name, triggerType, templateName, subject) => ({
    name,
    trigger_type: triggerType,
    active: true,
    organization_id: orgId,
    config: {
      nodes: [
        { id: "trigger-1", type: "trigger", data: { triggerType, config: {} }, nextNodeId: "action-1" },
        {
          id: "action-1", type: "action",
          data: {
            actionType: "send_email",
            config: { template_id: templateIds[templateName] || null, recipient: "patient", subject },
          },
        },
      ],
    },
  });

  const workflows = [
    wf("L'Abeille — Accueil nouveau patient", "patient_created", "L'Abeille — Bienvenue", "Bienvenue chez L'Abeille Medical Concierge"),
    wf("L'Abeille — Confirmation rendez-vous", "appointment_created", "L'Abeille — Confirmation de rendez-vous", "Confirmation de votre rendez-vous"),
    wf("L'Abeille — Suivi post-consultation", "appointment_completed", "L'Abeille — Suivi après consultation", "Votre suivi personnalisé"),
  ];

  for (const w of workflows) {
    const { data: existing } = await supabase.from("workflows")
      .select("id").eq("organization_id", orgId).eq("name", w.name).maybeSingle();
    if (existing) {
      await supabase.from("workflows").update(w).eq("id", existing.id);
    } else {
      const { error } = await supabase.from("workflows").insert(w);
      if (error) { fail(`workflow ${w.name}`, error); continue; }
    }
  }
  ok(`${workflows.length} workflows`);
}

// ── main ─────────────────────────────────────────────────────────────────────
const main = async () => {
  console.log("Seeding L'Abeille demo tenant…");
  const orgId = await getOrCreateOrg();
  const userId = await getOrCreateDemoUser(orgId);
  const doctorIds = await seedDoctors(orgId);
  const patientIds = await seedPatients(orgId, userId);
  await seedAppointments(orgId, patientIds, doctorIds);
  await seedEmailsAndWorkflows(orgId);
  console.log("\nDone.");
  console.log(`  Org slug : ${ORG.slug}`);
  console.log(`  Login    : ${DEMO_USER.email}`);
  console.log(`  Password : ${DEMO_USER.password}`);
};

main().catch((e) => { console.error(e); process.exit(1); });
