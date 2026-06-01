import type { Metadata } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { CommentsUnreadProvider } from "@/components/CommentsUnreadContext";
import { TasksNotificationsProvider } from "@/components/TasksNotificationsContext";
import { EmailNotificationsProvider } from "@/components/EmailNotificationsContext";
import { PatientTabsProvider } from "@/components/PatientTabsContext";
import { AuthProvider } from "@/components/AuthContext";
import GlobalLoader from "@/components/GlobalLoader";
import TalkToAliice from "@/components/TalkToAliice";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Aliice App",
    template: "Aliice App - %s",
  },
  description: "Multi-tenant medical CRM and ERP for aesthetics clinics",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${manrope.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef2ff,_#e0f2fe_40%,_#fdf2ff_80%)] px-4 py-6 sm:px-6 lg:px-8">
          <GlobalLoader />
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AuthProvider>
              <CommentsUnreadProvider>
                <TasksNotificationsProvider>
                  <EmailNotificationsProvider>
                    <PatientTabsProvider>
                      {children}
                      <TalkToAliice />
                    </PatientTabsProvider>
                  </EmailNotificationsProvider>
                </TasksNotificationsProvider>
              </CommentsUnreadProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </div>
      </body>
    </html>
  );
}
