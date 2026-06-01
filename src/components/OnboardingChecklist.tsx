"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";
import { CheckCircle2, Circle, Users, Calendar, CreditCard, Settings, Stethoscope, ArrowRight, Sparkles, Globe } from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  completed: boolean;
  checkFn: () => Promise<boolean>;
}

export default function OnboardingChecklist() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        // Check if user has dismissed onboarding
        const { data: userData } = await supabaseClient.auth.getUser();
        const user = userData?.user;
        if (!user) return;

        const meta = user.user_metadata as Record<string, unknown> || {};
        if (meta.onboarding_dismissed) {
          setDismissed(true);
          setLoading(false);
          return;
        }

        // Define onboarding steps with their completion checks
        const onboardingSteps: OnboardingStep[] = [
          {
            id: "add_patient",
            title: "Add your first patient",
            description: "Start by adding patient information to your clinic",
            href: "/patients",
            icon: <Users className="h-5 w-5" />,
            completed: false,
            checkFn: async () => {
              const { count } = await supabaseClient
                .from("patients")
                .select("*", { count: "exact", head: true });
              return (count || 0) > 0;
            },
          },
          {
            id: "add_service",
            title: "Set up your services",
            description: "Define the treatments and services you offer",
            href: "/services",
            icon: <Stethoscope className="h-5 w-5" />,
            completed: false,
            checkFn: async () => {
              const { count } = await supabaseClient
                .from("services")
                .select("*", { count: "exact", head: true });
              return (count || 0) > 0;
            },
          },
          {
            id: "setup_booking_page",
            title: "Create your booking page",
            description: "Set up your online booking page to accept appointments",
            href: "/cms/book-appointment",
            icon: <Globe className="h-5 w-5" />,
            completed: false,
            checkFn: async () => {
              // Check if booking page has been customized
              try {
                const res = await fetch("/api/settings/content-translations");
                const data = await res.json();
                return !!data?.bookingPages || !!data?.pageConfig;
              } catch {
                return false;
              }
            },
          },
          {
            id: "schedule_appointment",
            title: "Schedule an appointment",
            description: "Book your first patient consultation",
            href: "/appointments",
            icon: <Calendar className="h-5 w-5" />,
            completed: false,
            checkFn: async () => {
              const { count } = await supabaseClient
                .from("appointments")
                .select("*", { count: "exact", head: true });
              return (count || 0) > 0;
            },
          },
          {
            id: "configure_settings",
            title: "Configure clinic settings",
            description: "Customize your calendar and booking preferences",
            href: "/settings",
            icon: <Settings className="h-5 w-5" />,
            completed: false,
            checkFn: async () => {
              const { count } = await supabaseClient
                .from("doctor_scheduling_settings")
                .select("*", { count: "exact", head: true });
              return (count || 0) > 0;
            },
          },
          {
            id: "setup_payments",
            title: "Set up payments",
            description: "Configure your payment methods and invoicing",
            href: "/financials",
            icon: <CreditCard className="h-5 w-5" />,
            completed: false,
            checkFn: async () => {
              const { count } = await supabaseClient
                .from("invoices")
                .select("*", { count: "exact", head: true });
              return (count || 0) > 0;
            },
          },
        ];

        // Check completion status for each step
        const stepsWithStatus = await Promise.all(
          onboardingSteps.map(async (step) => {
            try {
              const completed = await step.checkFn();
              return { ...step, completed };
            } catch {
              return { ...step, completed: false };
            }
          })
        );

        const completed = stepsWithStatus.filter((s) => s.completed).length;
        setCompletedCount(completed);
        setSteps(stepsWithStatus);

        // Auto-dismiss if all steps are completed
        if (completed === stepsWithStatus.length) {
          setDismissed(true);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setLoading(false);
      }
    }

    checkOnboardingStatus();
  }, []);

  async function handleDismiss() {
    try {
      await supabaseClient.auth.updateUser({
        data: { onboarding_dismissed: true },
      });
      setDismissed(true);
    } catch (error) {
      console.error("Error dismissing onboarding:", error);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-sky-50 to-indigo-50 p-6 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-200/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (dismissed) {
    return null;
  }

  const progressPercentage = (completedCount / steps.length) * 100;

  return (
    <div className="rounded-2xl border border-sky-200/60 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6 shadow-[0_8px_30px_rgba(14,165,233,0.12)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Get started with ALiice
            </h2>
            <p className="text-xs text-slate-500">
              Complete these steps to set up your clinic
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Dismiss
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-600">
            {completedCount} of {steps.length} completed
          </span>
          <span className="text-xs font-semibold text-sky-600">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200/70 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <Link
            key={step.id}
            href={step.href}
            className={`group flex items-center gap-4 rounded-xl p-3 transition-all duration-200 ${
              step.completed
                ? "bg-emerald-50/80 hover:bg-emerald-100/80"
                : "bg-white/80 hover:bg-sky-50/80 hover:shadow-md"
            }`}
          >
            {/* Step number/check */}
            <div
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                step.completed
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-400 group-hover:bg-sky-500 group-hover:text-white"
              }`}
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3
                className={`text-sm font-medium ${
                  step.completed ? "text-emerald-700" : "text-slate-900"
                }`}
              >
                {step.title}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {step.description}
              </p>
            </div>

            {/* Icon & Arrow */}
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  step.completed
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-slate-100 text-slate-400 group-hover:bg-sky-100 group-hover:text-sky-600"
                }`}
              >
                {step.icon}
              </div>
              {!step.completed && (
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-sky-500 transition-colors" />
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Completion message */}
      {completedCount === steps.length && (
        <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white text-center">
          <p className="text-sm font-semibold">🎉 Congratulations!</p>
          <p className="text-xs opacity-90">
            You&apos;ve completed all setup steps. Your clinic is ready to go!
          </p>
        </div>
      )}
    </div>
  );
}
