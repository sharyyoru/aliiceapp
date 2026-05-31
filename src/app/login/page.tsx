import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const t = await getTranslations("loginPage");
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-8 text-sm shadow-[0_22px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logos/aliice-logo.png"
            alt="ALiice logo"
            width={120}
            height={40}
            className="h-10 w-auto"
          />
        </div>
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-lg font-semibold text-slate-900">
            {t("signInTitle")}
          </h1>
          <p className="text-xs text-slate-500">
            {t("signInSubtitle")}
          </p>
        </div>
        <LoginForm />
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-sky-600 hover:text-sky-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
