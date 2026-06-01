import type { Metadata } from "next";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata: Metadata = {
  title: "Manage Appointment | ALiice",
  description: "Reschedule or cancel your appointment",
};

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
