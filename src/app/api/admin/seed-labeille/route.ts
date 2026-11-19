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
  // Concierge specialist network (per partner meeting: UK/Spain/global)
  { name: "Dr Ibañez — Madrid Heart Institute", specialty: "Cardiology" },
  { name: "Dr Whitfield — Harley Street, London", specialty: "Internal Medicine" },
  { name: "Zurich Heart Centre", specialty: "Cardiology & Cardiac Surgery" },
  { name: "Dr Ortega — Barcelona Longevity Center", specialty: "Endocrinology & Longevity" },
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
  // Concierge leads — clients originate from the UK and Spain
  { first_name: "James", last_name: "Harrington", gender: "male", dob: "1971-02-11", town: "London", nationality: "British" },
  { first_name: "Charlotte", last_name: "Reeves", gender: "female", dob: "1986-09-23", town: "London", nationality: "British" },
  { first_name: "William", last_name: "Ashworth", gender: "male", dob: "1959-04-30", town: "Manchester", nationality: "British" },
  { first_name: "Lucía", last_name: "Fernández", gender: "female", dob: "1982-12-14", town: "Madrid", nationality: "Spanish" },
  { first_name: "Mateo", last_name: "Vargas", gender: "male", dob: "1977-08-19", town: "Barcelona", nationality: "Spanish" },
  { first_name: "Carmen", last_name: "Ortiz", gender: "female", dob: "1968-01-07", town: "Marbella", nationality: "Spanish" },
  { first_name: "Francesca", last_name: "Bellini", gender: "female", dob: "1991-05-28", town: "Genève", nationality: "Italian" },
  { first_name: "Mikhail", last_name: "Sorokin", gender: "male", dob: "1963-11-02", town: "Genève", nationality: "Russian" },
  { first_name: "Aïcha", last_name: "Diallo", gender: "female", dob: "1989-03-16", town: "Lausanne", nationality: "Senegalese" },
  { first_name: "George", last_name: "Papadakis", gender: "male", dob: "1974-07-25", town: "Zurich", nationality: "Greek" },
  { first_name: "Ingrid", last_name: "Solberg", gender: "female", dob: "1981-10-12", town: "Montreux", nationality: "Norwegian" },
  { first_name: "Rafael", last_name: "Dominguez", gender: "male", dob: "1966-06-03", town: "Madrid", nationality: "Spanish" },
  { first_name: "Emily", last_name: "Cartwright", gender: "female", dob: "1995-02-20", town: "London", nationality: "British" },
  { first_name: "Hassan", last_name: "El Amrani", gender: "male", dob: "1979-09-09", town: "Genève", nationality: "Moroccan" },
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

    // ── doctor login users + scheduling + booking pool ──
    // On this system a doctor's providers.id IS their auth/user id — the
    // calendar's doctor columns are keyed by doctor_scheduling_settings.
    // provider_id which the API resolves to names via users.id, while
    // appointments.provider_id FKs to providers.id. Making them equal
    // satisfies both.
    let doctorUserCount = 0;
    const doctorUserIds: string[] = [];
    for (const [i, d] of DOCTORS.entries()) {
      const email = `doctor${i + 1}@labeille-demo.ch`;
      let docUser = list?.users?.find((u) => u.email?.toLowerCase() === email);
      if (!docUser) {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email, password: DEMO_USER.password, email_confirm: true,
          user_metadata: { full_name: d.name },
        });
        if (error) { fail(`doctor user ${d.name}`, error); continue; }
        docUser = data.user;
      }
      const { error: uErr } = await supabaseAdmin.from("users").upsert({
        id: docUser.id, email, full_name: d.name,
        role: "doctor", current_organization_id: orgId, onboarding_completed: true,
      });
      if (uErr) { fail(`doctor users row ${d.name}`, uErr); continue; }
      await supabaseAdmin.from("organization_members").upsert(
        { organization_id: orgId, user_id: docUser.id, role: "doctor", job_title: d.specialty, is_active: true },
        { onConflict: "organization_id,user_id" }
      );

      // Provider row keyed by the auth user id. If an older seeded provider
      // row exists under a different id, remap appointments then remove it.
      const oldId = doctorIds[i];
      if (oldId && oldId !== docUser.id) {
        await supabaseAdmin.from("appointments").update({ provider_id: docUser.id }).eq("provider_id", oldId);
        await supabaseAdmin.from("doctor_scheduling_settings").delete().eq("provider_id", oldId);
        await supabaseAdmin.from("providers").delete().eq("id", oldId);
      }
      const { error: pErr } = await supabaseAdmin.from("providers").upsert({
        id: docUser.id, name: d.name, specialty: d.specialty,
        email, organization_id: orgId, role: "doctor",
      });
      if (pErr) { fail(`provider row ${d.name}`, pErr); continue; }
      doctorUserIds.push(docUser.id);

      await supabaseAdmin.from("doctor_scheduling_settings").upsert(
        { provider_id: docUser.id, time_interval_minutes: 30, default_duration_minutes: 45, updated_at: new Date().toISOString() },
        { onConflict: "provider_id" }
      );
      const slug = `labeille-${d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
      const { data: exBd } = await supabaseAdmin.from("booking_doctors").select("id").eq("slug", slug).maybeSingle();
      if (!exBd) {
        const { error: bdErr } = await supabaseAdmin.from("booking_doctors").insert({
          name: d.name, specialty: d.specialty, slug, enabled: true, order_index: 100 + i,
          description: `${d.specialty} — L'Abeille Medical Concierge partner specialist.`,
        });
        if (bdErr) fail(`booking doctor ${d.name}`, bdErr);
      }
      doctorUserCount++;
    }
    step(`${doctorUserCount} doctor users + scheduling + booking entries`);

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
          provider_id: (doctorUserIds.length ? doctorUserIds : doctorIds)[(pi + Math.max(0, m)) % (doctorUserIds.length ? doctorUserIds.length : doctorIds.length)],
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

    // ── dense demo schedule ──
    // Continuous daily coverage: 2 appointments per doctor per day for the
    // surrounding 6 weeks so every calendar view is populated.
    const docIdsForSchedule = doctorUserIds.length ? doctorUserIds : doctorIds;
    if (docIdsForSchedule.length && patientIds.length) {
      const { count: existingDense } = await supabaseAdmin.from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("location", "L'Abeille Concierge");
      if ((existingDense ?? 0) < 400) {
        const denseRows = [];
        for (let d = -20; d <= 24; d++) {
          for (const [di, docId] of docIdsForSchedule.entries()) {
            for (let k = 0; k < 2; k++) {
              const hour = 9 + (((di + k * 5 + d) % 8) + 8) % 8;
              const start = new Date(now + d * 864e5);
              start.setHours(hour, (di + k) % 2 * 30, 0, 0);
              denseRows.push({
                patient_id: patientIds[(di + k + d + patientIds.length * 20) % patientIds.length],
                provider_id: docId,
                start_time: start.toISOString(),
                end_time: new Date(start.getTime() + 45 * 6e4).toISOString(),
                status: d < 0 || (d === 0 && hour < new Date().getHours()) ? "completed" : "scheduled",
                reason: APPOINTMENT_REASONS[(di + k * 2 + d + 240) % APPOINTMENT_REASONS.length],
                location: "L'Abeille Concierge",
                source: "manual",
                organization_id: orgId,
              });
            }
          }
        }
        const { error } = await supabaseAdmin.from("appointments").insert(denseRows);
        if (error) fail("dense appointments", error);
        else step(`${denseRows.length} dense schedule appointments`);
      }
    }

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
      {
        name: "L'Abeille — Notification nouvelle demande", type: "workflow",
        subject_template: "Nouvelle demande de spécialiste — {{patient.first_name}} {{patient.last_name}}",
        body_template: "Un patient demande un spécialiste. Attribuer le meilleur praticien disponible et réserver le rendez-vous.",
        html_content: labeilleEmail("Nouvelle demande de spécialiste", `<p>Bonjour Martha,</p>
          <p><strong>{{patient.first_name}} {{patient.last_name}}</strong> vient de soumettre une demande de spécialiste.</p>
          <p><strong>Spécialité demandée:</strong> {{request.specialty}}<br>
          <strong>Localisation:</strong> {{request.location}}</p>
          <p>Prochaine étape: sélectionner le meilleur spécialiste partenaire — le système réservera le rendez-vous et enverra le formulaire médical au patient.</p>`),
      },
      {
        name: "L'Abeille — Nurture J+7", type: "workflow",
        subject_template: "Votre parcours de santé, {{patient.first_name}}",
        body_template: "Une semaine avec L'Abeille — conseils santé et prochaines étapes de votre programme.",
        html_content: labeilleEmail("Une semaine avec L'Abeille", `<p>Bonjour {{patient.first_name}},</p>
          <p>Cela fait une semaine que vous avez rejoint L'Abeille Medical Concierge. Votre case manager prépare déjà votre parcours personnalisé.</p>
          <p><strong>Cette semaine:</strong></p>
          <p>• Complétez votre questionnaire médical si ce n'est pas encore fait<br>
          • Découvrez nos programmes de longévité et bilans préventifs<br>
          • Répondez à cet e-mail pour toute question — nous répondons sous 24h</p>
          <p style="color:${GOLD};font-weight:600;">Votre santé, notre priorité.</p>`),
      },
      {
        name: "L'Abeille — Nurture J+30", type: "workflow",
        subject_template: "Votre bilan du mois — L'Abeille",
        body_template: "Un mois avec L'Abeille — point sur vos objectifs santé et recommandations.",
        html_content: labeilleEmail("Votre mois avec L'Abeille", `<p>Bonjour {{patient.first_name}},</p>
          <p>Un mois déjà ! Voici un point sur votre parcours :</p>
          <p>• <strong>Réalisé:</strong> vos consultations et bilans du mois<br>
          • <strong>À venir:</strong> {{next_appointment}}<br>
          • <strong>Recommandé pour vous:</strong> bilan cardiologique préventif ou programme longévité</p>
          <p>Votre case manager reste à votre disposition pour ajuster votre programme.</p>`),
      },
      {
        name: "L'Abeille — Rappel rendez-vous", type: "workflow",
        subject_template: "Rappel — votre rendez-vous demain à {{appointment.time}}",
        body_template: "Rappel de votre rendez-vous du {{appointment.date}} avec {{appointment.doctor}}.",
        html_content: labeilleEmail("Rappel de rendez-vous", `<p>Bonjour {{patient.first_name}},</p>
          <p>Petit rappel amical — votre rendez-vous est <strong>demain</strong>:</p>
          <p><strong>{{appointment.date}} à {{appointment.time}}</strong><br>
          avec <strong>{{appointment.doctor}}</strong><br>
          Lieu: {{appointment.location}}</p>
          <p>S'il s'agit d'une téléconsultation, votre lien vidéo est joint à l'invitation. À demain !</p>`),
      },
      {
        name: "L'Abeille — Invitation téléconsultation", type: "workflow",
        subject_template: "Votre lien de téléconsultation — {{appointment.date}}",
        body_template: "Votre téléconsultation avec {{appointment.doctor}} — rejoignez via ce lien: {{appointment.meet_link}}",
        html_content: labeilleEmail("Votre téléconsultation", `<p>Bonjour {{patient.first_name}},</p>
          <p>Votre consultation avec <strong>{{appointment.doctor}}</strong> se déroulera en vidéo:</p>
          <p><strong>Date:</strong> {{appointment.date}}<br><strong>Heure:</strong> {{appointment.time}}</p>
          <p><a href="{{appointment.meet_link}}" style="display:inline-block;background:${GOLD};color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;">Rejoindre la visioconférence</a></p>
          <p style="color:#8a8578;font-size:13px;">Conseil: rejoignez 5 minutes avant l'heure prévue pour vérifier votre caméra et microphone.</p>`),
      },
      {
        name: "L'Abeille — Formulaire médical", type: "workflow",
        subject_template: "À compléter avant votre rendez-vous — formulaire médical",
        body_template: "Merci de compléter votre formulaire médical avant votre consultation.",
        html_content: labeilleEmail("Votre formulaire médical", `<p>Bonjour {{patient.first_name}},</p>
          <p>Afin que {{appointment.doctor}} prépare au mieux votre consultation, merci de compléter votre questionnaire médical:</p>
          <p><a href="{{form.link}}" style="display:inline-block;background:${GOLD};color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;">Compléter le formulaire</a></p>
          <p style="color:#8a8578;font-size:13px;">Cela ne prend que 5 minutes et permet une consultation plus efficace.</p>`),
      },
    ];

    // Older DBs may lack html_content / organization_id — probe once, adapt.
    let hasHtmlContent = true;
    let hasOrgCol = true;
    {
      const { error } = await supabaseAdmin.from("email_templates").select("html_content, organization_id").limit(1);
      if (error) {
        if (/html_content/.test(error.message)) hasHtmlContent = false;
        if (/organization_id/.test(error.message)) hasOrgCol = false;
      }
    }
    // Some DBs use a narrower email_template_type enum without "workflow" —
    // reuse an existing row's type in that case.
    let templateType: string | null = "workflow";
    {
      const { data: anyTpl } = await supabaseAdmin.from("email_templates").select("type").limit(1).maybeSingle();
      if (anyTpl?.type && anyTpl.type !== "workflow") templateType = anyTpl.type;
    }

    const templateIds: Record<string, string> = {};
    for (const t of templates) {
      const row: Record<string, unknown> = hasHtmlContent
        ? { ...t, type: templateType ?? t.type }
        : { name: t.name, type: templateType ?? t.type, subject_template: t.subject_template, body_template: t.html_content };
      if (hasOrgCol) row.organization_id = orgId;
      const q = supabaseAdmin.from("email_templates").select("id").eq("name", t.name);
      if (hasOrgCol) q.eq("organization_id", orgId);
      const { data: ex } = await q.maybeSingle();
      if (ex) {
        const { error } = await supabaseAdmin.from("email_templates").update(row).eq("id", ex.id);
        if (error) { fail(`template ${t.name}`, error); continue; }
        templateIds[t.name] = ex.id;
      } else {
        let { data, error } = await supabaseAdmin.from("email_templates")
          .insert(row).select("id").single();
        // Older DBs have a narrower email_template_type enum — fall back
        // through the values known to exist in the original schema.
        for (const candidate of ["patient", "insurance", "post_op"]) {
          if (!error || !/email_template_type/.test(error.message)) break;
          const retry = await supabaseAdmin.from("email_templates")
            .insert({ ...row, type: candidate }).select("id").single();
          data = retry.data; error = retry.error;
        }
        if (error || !data) { fail(`template ${t.name}`, error); continue; }
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
      wf("L'Abeille — Nurture J+7", "patient_created", "L'Abeille — Nurture J+7", "Votre parcours de santé"),
      wf("L'Abeille — Nurture J+30", "patient_created", "L'Abeille — Nurture J+30", "Votre bilan du mois"),
      wf("L'Abeille — Rappel rendez-vous", "appointment_created", "L'Abeille — Rappel rendez-vous", "Rappel — votre rendez-vous demain"),
      wf("L'Abeille — Invitation téléconsultation", "appointment_updated", "L'Abeille — Invitation téléconsultation", "Votre lien de téléconsultation"),
      wf("L'Abeille — Formulaire médical", "appointment_created", "L'Abeille — Formulaire médical", "À compléter avant votre rendez-vous"),
      {
        name: "L'Abeille — Demande de spécialiste",
        trigger_type: "form_submitted",
        active: true,
        organization_id: orgId,
        config: {
          nodes: [
            { id: "trigger-1", type: "trigger", data: { triggerType: "form_submitted", config: {} }, nextNodeId: "action-1" },
            {
              id: "action-1", type: "action", nextNodeId: "action-2",
              data: {
                actionType: "send_email",
                config: {
                  template_id: templateIds["L'Abeille — Notification nouvelle demande"] || null,
                  recipient: "specific_email",
                  email_address: "partner@labelle-medical-concierge.com",
                  subject: "Nouvelle demande de spécialiste — {{patient.first_name}} {{patient.last_name}}",
                },
              },
            },
            {
              id: "action-2", type: "action",
              data: {
                actionType: "create_task",
                config: {
                  title: "Assigner un spécialiste pour {{patient.first_name}} {{patient.last_name}}",
                  assign_to_users: [userId],
                  due_days: 1,
                },
              },
            },
          ],
        },
      },
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

    // ── concierge pipeline: categories, services, stages, deals, tasks ──
    const CATS = [
      { name: "Concierge Cardiology", description: "Cardiac screening, second opinions and specialist referrals", sort_order: 1 },
      { name: "Concierge Dentistry", description: "Smile design, implants and dental rehabilitation", sort_order: 2 },
      { name: "Longevity Programs", description: "Preventive health, biomarkers and longevity protocols", sort_order: 3 },
      { name: "Global Specialist Referral", description: "Access to partner specialists worldwide (UK, Spain, Switzerland)", sort_order: 4 },
    ];
    const SERVICES = [
      { cat: "Concierge Cardiology", name: "Cardiac health check-up", price: 1200 },
      { cat: "Concierge Cardiology", name: "Cardiologist referral & coordination", price: 450 },
      { cat: "Concierge Dentistry", name: "Full smile assessment", price: 800 },
      { cat: "Concierge Dentistry", name: "Implant consultation", price: 600 },
      { cat: "Longevity Programs", name: "Annual longevity programme", price: 9500 },
      { cat: "Longevity Programs", name: "Buchinger fasting week (Marbella)", price: 4200 },
      { cat: "Global Specialist Referral", name: "Specialist request & placement", price: 350 },
      { cat: "Global Specialist Referral", name: "International second opinion", price: 900 },
    ];
    const catIds: Record<string, string> = {};
    for (const c of CATS) {
      const { data: ex } = await supabaseAdmin.from("service_categories").select("id")
        .eq("organization_id", orgId).eq("name", c.name).maybeSingle();
      if (ex) { catIds[c.name] = ex.id; continue; }
      const { data, error } = await supabaseAdmin.from("service_categories")
        .insert({ ...c, organization_id: orgId }).select("id").single();
      if (error) { fail(`category ${c.name}`, error); continue; }
      catIds[c.name] = data.id;
    }
    const serviceIds: string[] = [];
    for (const s of SERVICES) {
      if (!catIds[s.cat]) continue;
      const { data: ex } = await supabaseAdmin.from("services").select("id")
        .eq("organization_id", orgId).eq("name", s.name).maybeSingle();
      if (ex) { serviceIds.push(ex.id); continue; }
      const { data, error } = await supabaseAdmin.from("services").insert({
        name: s.name, description: s.name, category_id: catIds[s.cat],
        base_price: s.price, organization_id: orgId, duration_minutes: 45,
      }).select("id").single();
      if (error) { fail(`service ${s.name}`, error); continue; }
      serviceIds.push(data.id);
    }
    step(`${serviceIds.length} concierge services`);

    // Pipeline stages mirror the agreed flow: lead → specialist request →
    // Marta assigns → booked → follow-up.
    const STAGES = [
      { name: "New Lead", type: "lead", sort_order: 1, is_default: true },
      { name: "Specialist Requested", type: "lead", sort_order: 2 },
      { name: "Assigned to Specialist", type: "consultation", sort_order: 3 },
      { name: "Appointment Booked", type: "consultation", sort_order: 4 },
      { name: "In Treatment", type: "surgery", sort_order: 5 },
      { name: "Follow-Up Care", type: "follow_up", sort_order: 6 },
      { name: "Closed Won", type: "other", sort_order: 7 },
    ];
    const stageIds: string[] = [];
    for (const s of STAGES) {
      const { data: ex } = await supabaseAdmin.from("deal_stages").select("id")
        .eq("organization_id", orgId).eq("name", s.name).maybeSingle();
      if (ex) { stageIds.push(ex.id); continue; }
      const { data, error } = await supabaseAdmin.from("deal_stages")
        .insert({ ...s, organization_id: orgId }).select("id").single();
      if (error) { fail(`stage ${s.name}`, error); continue; }
      stageIds.push(data.id);
    }
    step(`${stageIds.length} pipeline stages`);

    let dealCount = 0;
    for (const [i, pid] of patientIds.entries()) {
      const { data: ex } = await supabaseAdmin.from("deals").select("id").eq("patient_id", pid).limit(1);
      if (ex?.length) continue;
      const { error } = await supabaseAdmin.from("deals").insert({
        patient_id: pid,
        stage_id: stageIds[i % stageIds.length],
        service_id: serviceIds.length ? serviceIds[i % serviceIds.length] : null,
        pipeline: "Concierge Referrals",
        title: "Concierge referral — L'Abeille",
        value: 1500 + (i * 1370) % 20000,
        location: ["Genève", "Madrid", "London", "Marbella"][i % 4],
        owner_id: userId, owner_name: "Martha Schiller",
        organization_id: orgId,
        notes: "Lead concierge — demande de spécialiste traitée par Martha.",
      });
      if (error) fail(`deal ${pid}`, error);
      else dealCount++;
    }
    step(`${dealCount} deals`);

    const TASKS = [
      { name: "Assigner un cardiologue à Madrid", content: "Lead James Harrington demande un cardiologue à Madrid — vérifier dispos Dr Ibañez, bloquer créneau.", type: "todo", priority: "high" },
      { name: "Envoyer questionnaire médical", content: "Envoyer le formulaire médical au patient avant le rendez-vous.", type: "email", priority: "medium" },
      { name: "Confirmer le rendez-vous", content: "Appeler le patient pour confirmer la téléconsultation.", type: "call", priority: "medium" },
      { name: "Relance formulaire non complété", content: "Le patient n'a pas encore rempli le formulaire médical — relancer.", type: "email", priority: "low" },
      { name: "Compte-rendu post-consultation", content: "Transmettre le compte-rendu du spécialiste au dossier patient.", type: "todo", priority: "medium" },
    ];
    let taskCount = 0;
    for (const [i, pid] of patientIds.entries()) {
      const { data: ex } = await supabaseAdmin.from("tasks").select("id").eq("patient_id", pid).limit(1);
      if (ex?.length) continue;
      const t = TASKS[i % TASKS.length];
      const { error } = await supabaseAdmin.from("tasks").insert({
        patient_id: pid, name: t.name, content: t.content,
        status: ["not_started", "in_progress", "completed"][i % 3],
        priority: t.priority, type: t.type,
        activity_date: new Date(Date.now() + (i % 10 - 3) * 864e5).toISOString(),
        created_by_user_id: userId, created_by_name: "Martha Schiller",
        assigned_user_id: i % 2 === 0 ? userId : null,
        assigned_user_name: i % 2 === 0 ? "Martha Schiller" : null,
        organization_id: orgId,
      });
      if (error) fail(`task ${pid}`, error);
      else taskCount++;
    }
    step(`${taskCount} tasks`);

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
