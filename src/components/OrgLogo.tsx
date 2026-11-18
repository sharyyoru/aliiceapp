"use client";

import { useOrganization } from "@/contexts/OrganizationContext";

/**
 * Shows the current organization's logo when set, otherwise the ALiice logo.
 * Uses a plain <img> so arbitrary remote logo_url values work without
 * next.config image-domain whitelisting.
 */
export default function OrgLogo({
  className = "h-8 w-auto",
  width = 120,
  height = 32,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  const { organization } = useOrganization();
  const src = organization?.logo_url || "/logos/aliice-logo.png";
  const alt = organization?.name ? `${organization.name} logo` : "ALiice logo";
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={width} height={height} className={className} />;
}
