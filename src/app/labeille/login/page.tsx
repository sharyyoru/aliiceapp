import { supabaseAdmin } from "@/lib/supabaseAdmin";
import LoginForm from "@/app/login/LoginForm";

export const dynamic = "force-dynamic";

async function getOrg() {
  const { data } = await supabaseAdmin
    .from("organizations")
    .select("name, logo_url, primary_color")
    .eq("slug", "labeille")
    .maybeSingle();
  return data;
}

export default async function LabeilleLoginPage() {
  const org = await getOrg();
  const accent = org?.primary_color || "#C9A227";
  const name = org?.name || "L'Abeille Medical Concierge";
  const logo = org?.logo_url || "/logos/labeille-logo.jpg";

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #faf9f6 0%, #f3efe4 100%)" }}
    >
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-8 text-sm shadow-[0_22px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <div className="mb-6 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={`${name} logo`} className="h-20 w-auto" />
        </div>
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-lg font-semibold text-slate-900">{name}</h1>
          <p className="text-xs text-slate-500">
            Connectez-vous à votre espace concierge
          </p>
        </div>
        <LoginForm accentColor={accent} />
        <div
          className="mt-6 rounded-xl border px-4 py-3 text-center"
          style={{ borderColor: `${accent}55`, backgroundColor: `${accent}0d` }}
        >
          <p className="text-[11px] leading-relaxed" style={{ color: "#8a7a3a" }}>
            Environnement de démonstration — toutes les données affichées sont
            fictives et fournies uniquement à des fins de démo. Aucune donnée
            réelle de patient n&apos;est utilisée.
          </p>
        </div>
        <div
          className="mt-4 border-t pt-4 text-center"
          style={{ borderColor: `${accent}33` }}
        >
          <p className="text-[11px] text-slate-400">
            Powered by <span className="font-medium">ALiice</span>
          </p>
        </div>
      </div>
    </div>
  );
}
