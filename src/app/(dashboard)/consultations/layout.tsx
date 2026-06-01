import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consultation Form | ALiice",
  description: "Patient consultation form",
};

export default function ConsultationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
