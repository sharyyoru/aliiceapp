import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import RequireAuth from "@/components/RequireAuth";
import { ShellSidebar, ShellHeader, ShellFrame } from "@/components/ShellVisibility";
import HeaderUser from "@/components/HeaderUser";
import HeaderCommentsButton from "@/components/HeaderCommentsButton";
import HeaderNotificationsButton from "@/components/HeaderNotificationsButton";
import HeaderTasksButton from "@/components/HeaderTasksButton";
import HeaderWhatsAppButton from "@/components/HeaderWhatsAppButton";
import GlobalPatientSearch from "@/components/GlobalPatientSearch";
import CrmLanguageToggle from "@/components/CrmLanguageToggle";
import PatientTabBar from "@/components/PatientTabBar";
import SidebarLeadImportDropdown from "@/components/SidebarLeadImportDropdown";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tNav = await getTranslations("nav");
  const tHeader = await getTranslations("header");

  return (
    <ShellFrame>
      <div className="flex min-h-[80vh] flex-1 overflow-hidden">
        <input
          id="sidebar-toggle"
          type="checkbox"
          className="peer sr-only"
        />
        <ShellSidebar>
          <aside className="hidden w-60 border-r border-slate-100/80 bg-gradient-to-b from-slate-50/90 to-slate-50/40 px-4 py-5 transition-all duration-200 ease-out sm:flex sm:flex-col peer-checked:sm:w-0 peer-checked:sm:border-r-0 peer-checked:sm:px-0 peer-checked:sm:opacity-0 peer-checked:sm:pointer-events-none app-shell-sidebar">
            <div className="mb-6 flex justify-center px-2">
              <Image
                src="/logos/aliice-logo.png"
                alt="ALiice logo"
                width={120}
                height={28}
                className="h-8 w-auto"
              />
            </div>
            <nav className="mt-2 text-sm">
              <div className="border-y border-slate-100/80">
                <Link
                  href="/dashboard"
                  className="group flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-sky-50/80 hover:text-slate-900 sm:text-sm"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/70 text-slate-500 shadow-[0_6px_18px_rgba(15,23,42,0.18)] backdrop-blur group-hover:bg-sky-500/90 group-hover:text-white">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 11.5 12 4l8 7.5" />
                      <path d="M5 10.5V20h4v-5h6v5h4v-9.5" />
                    </svg>
                  </span>
                  <span>{tNav("dashboard")}</span>
                </Link>
              </div>
              <div className="border-b border-slate-100/80">
                <Link href="/patients" className="group flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-sky-50/80 hover:text-slate-900 sm:text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/70 text-slate-500 shadow-[0_6px_18px_rgba(15,23,42,0.18)] backdrop-blur group-hover:bg-sky-500/90 group-hover:text-white">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
                      <path d="M4 20a6 6 0 0 1 8-5.29A6 6 0 0 1 20 20" />
                    </svg>
                  </span>
                  <span>{tNav("patients")}</span>
                </Link>
              </div>
              <div className="border-b border-slate-100/80">
                <Link href="/appointments" className="group flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-sky-50/80 hover:text-slate-900 sm:text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/70 text-slate-500 shadow-[0_6px_18px_rgba(15,23,42,0.18)] backdrop-blur group-hover:bg-sky-500/90 group-hover:text-white">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M16 3v4M8 3v4M3 11h18" />
                    </svg>
                  </span>
                  <span>{tNav("calendar")}</span>
                </Link>
              </div>
              <div className="border-b border-slate-100/80">
                <Link href="/deals" className="group flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-sky-50/80 hover:text-slate-900 sm:text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/70 text-slate-500 shadow-[0_6px_18px_rgba(15,23,42,0.18)] backdrop-blur group-hover:bg-sky-500/90 group-hover:text-white">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h4v12H3zM10 10h4v8h-4zM17 8h4v10h-4z" />
                    </svg>
                  </span>
                  <span>{tNav("dealsAndPipeline")}</span>
                </Link>
              </div>
              <SidebarLeadImportDropdown />
              <div className="border-b border-slate-100/80">
                <Link href="/financials" className="group flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-sky-50/80 hover:text-slate-900 sm:text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/70 text-slate-500 shadow-[0_6px_18px_rgba(15,23,42,0.18)] backdrop-blur group-hover:bg-sky-500/90 group-hover:text-white">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="6" width="18" height="12" rx="2" />
                      <path d="M7 10h4M7 14h2" />
                    </svg>
                  </span>
                  <span>{tNav("financials")}</span>
                </Link>
              </div>
              <div className="border-b border-slate-100/80">
                <Link href="/tasks" className="group flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-sky-50/80 hover:text-slate-900 sm:text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/70 text-slate-500 shadow-[0_6px_18px_rgba(15,23,42,0.18)] backdrop-blur group-hover:bg-sky-500/90 group-hover:text-white">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <path d="M8 9h8M8 13h5M8 17h3" />
                    </svg>
                  </span>
                  <span>{tNav("tasks")}</span>
                </Link>
              </div>
              <div className="border-b border-slate-100/80">
                <Link href="/settings" className="group flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-sky-50/80 hover:text-slate-900 sm:text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/70 text-slate-500 shadow-[0_6px_18px_rgba(15,23,42,0.18)] backdrop-blur group-hover:bg-sky-500/90 group-hover:text-white">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </span>
                  <span>{tNav("settings")}</span>
                </Link>
              </div>
            </nav>
          </aside>
        </ShellSidebar>
        <main className="flex-1 min-w-0 bg-slate-50/40">
          <RequireAuth>
            <div className="flex h-full flex-col">
              <ShellHeader>
                <header className="flex items-center justify-between border-b border-slate-100/80 bg-white/70 px-4 py-3 sm:px-6 lg:px-8 app-shell-header">
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="sidebar-toggle"
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-500 shadow-sm hover:bg-slate-50 sm:h-9 sm:w-9"
                    >
                      <span className="sr-only">{tHeader("toggleSidebar")}</span>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 6h16M4 12h10M4 18h16" />
                      </svg>
                    </label>
                    <div className="flex items-center gap-3">
                      <Link href="/dashboard" aria-label={tHeader("goToDashboard")} className="inline-flex items-center">
                        <Image
                          src="/logos/aliice-logo.png"
                          alt="ALiice logo"
                          width={90}
                          height={32}
                          className="h-8 w-auto"
                        />
                      </Link>
                    </div>
                  </div>
                  <GlobalPatientSearch />
                  <div className="flex items-center gap-2 text-slate-500">
                    <CrmLanguageToggle />
                    <HeaderTasksButton />
                    <HeaderNotificationsButton />
                    <HeaderCommentsButton />
                    <HeaderWhatsAppButton />
                    <HeaderUser />
                  </div>
                </header>
              </ShellHeader>
              <PatientTabBar />
              <div className="flex-1 px-4 py-4 sm:px-6 lg:px-8">{children}</div>
            </div>
          </RequireAuth>
        </main>
      </div>
    </ShellFrame>
  );
}
