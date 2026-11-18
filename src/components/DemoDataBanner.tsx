"use client";

import { useOrganization } from "@/contexts/OrganizationContext";

/** Shows a "demo data only" strip when the active org is the L'Abeille demo tenant. */
export default function DemoDataBanner() {
  const { organization } = useOrganization();
  if (organization?.slug !== "labeille") return null;
  return (
    <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-1.5 text-center text-[11px] font-medium text-amber-800 sm:px-6 lg:px-8">
      Environnement de démonstration — toutes les données sont fictives et
      fournies uniquement à des fins de démo.
    </div>
  );
}
