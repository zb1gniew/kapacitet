"use client";

import Link from "next/link";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import { AuthInput } from "@/components/auth/AuthInput";
import { BrandIcon, EmailIcon, InfoIcon, LockIcon } from "@/components/auth/icons";

export function LoginScreen() {
  const { t } = useLocalizedScreen();

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[linear-gradient(151.85deg,#f5f5f5_0%,#f8fafc_50%,#f5f5f5_100%)] px-4 py-8"
      data-name="Login Screen"
      data-node-id="1:7"
    >
      <div className="w-full max-w-[448px]">
        <header className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[14px] bg-blue-600 text-white shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
            <BrandIcon className="h-8 w-8" />
          </div>
          <h1 className="text-center text-2xl font-bold tracking-[0.0703px] text-neutral-900">
            KapacitetNet
          </h1>
          <p className="mt-2 text-center text-sm tracking-[-0.1504px] text-neutral-600">
            {t("Capacity coordination")}
          </p>
        </header>

        <section className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
          <h2 className="text-[20px] font-bold tracking-[-0.4492px] text-neutral-900">
            {t("Sign in to your account")}
          </h2>
          <p className="mt-2 max-w-[310px] text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
            {t("Access your company's capacity coordination dashboard")}
          </p>

          <form
            className="mt-6 space-y-5"
            aria-label={t("Sign in form")}
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const email = formData.get("email");
              const loginUrl = new URL(
                APP_ROUTES.authLoginApi,
                window.location.origin,
              );

              loginUrl.searchParams.set("return_to", APP_ROUTES.dashboard);

              if (typeof email === "string" && email.trim().length > 0) {
                loginUrl.searchParams.set("login_hint", email.trim());
              }

              window.location.assign(loginUrl.toString());
            }}
          >
            <AuthInput
              id="email"
              label={t("Email address")}
              type="email"
              placeholder="admin@company.com"
              autoComplete="email"
              icon={<EmailIcon className="h-[18px] w-[18px]" />}
            />
            <AuthInput
              id="password"
              label={t("Password")}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              icon={<LockIcon className="h-[18px] w-[18px]" />}
              required={false}
            />
            <p className="text-xs tracking-[-0.1504px] text-neutral-500">
              {t(
                "Secure sign-in is handled by your identity provider after redirect.",
              )}
            </p>

            <div className="flex justify-end">
              <a
                href="#"
                className="text-sm font-medium tracking-[-0.1504px] text-blue-600 hover:underline"
              >
                {t("Forgot password?")}
              </a>
            </div>

            <button
              type="submit"
              className="h-[52px] w-full rounded-[10px] bg-blue-600 text-base font-semibold tracking-[-0.3125px] text-white shadow-[0_10px_15px_rgba(0,0,0,0.10),0_4px_6px_rgba(0,0,0,0.10)] transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              {t("Sign in")}
            </button>
          </form>

          <div className="relative my-6">
            <div className="border-t border-neutral-300" />
            <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm tracking-[-0.1504px] text-neutral-500">
              {t("or")}
            </span>
          </div>

          <Link
            href={APP_ROUTES.requestAccess}
            className="inline-flex h-[50px] w-full items-center justify-center rounded-[10px] border border-neutral-300 text-base font-semibold tracking-[-0.3125px] text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            {t("Request platform access")}
          </Link>
        </section>

        <aside className="mt-4 rounded-[10px] border border-[#bedbff] bg-[#eff6ff] p-4 text-[#193cb8]">
          <div className="flex items-start gap-2.5">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs leading-[19.5px]">
              <span className="font-semibold">
                {t("Controlled access network.")}
              </span>{" "}
              {t(
                "This platform is available to verified companies participating in the capacity coordination network.",
              )}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
