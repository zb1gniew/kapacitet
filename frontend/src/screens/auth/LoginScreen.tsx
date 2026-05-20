"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import { AuthInput } from "@/components/auth/AuthInput";
import {
  BrandIcon,
  EmailIcon,
  InfoIcon,
  LockIcon,
} from "@/components/auth/icons";

type ScreenState =
  | { step: "email" }
  | {
      step: "set-password";
      email: string;
      token: string;
      isInvitation: boolean;
    }
  | { step: "set-name"; email: string }
  | { step: "password-set"; email: string }
  | { step: "forgot-password" }
  | { step: "forgot-password-sent"; email: string }
  | { step: "reset-password"; email: string; token: string }
  | { step: "password-reset"; email: string };

type SetupContextResponse = {
  email?: string;
  isInvitation?: boolean;
};

type MessageResponse = {
  message?: string;
};

const primaryButtonClassName =
  "h-[52px] w-full rounded-[10px] bg-blue-600 text-base font-semibold tracking-[-0.3125px] text-white shadow-[0_10px_15px_rgba(0,0,0,0.10),0_4px_6px_rgba(0,0,0,0.10)] transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-60";

const secondaryLinkClassName =
  "inline-flex h-[50px] w-full items-center justify-center rounded-[10px] border border-neutral-300 text-base font-semibold tracking-[-0.3125px] text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300";

function getTrimmedFormValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function getRawFormValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function redirectToKeycloak(email: string) {
  const loginUrl = new URL(APP_ROUTES.authLoginApi, window.location.origin);
  loginUrl.searchParams.set("return_to", APP_ROUTES.dashboard);
  loginUrl.searchParams.set("login_hint", email);
  window.location.assign(loginUrl.toString());
}

async function getSetupContext(token: string): Promise<SetupContextResponse> {
  const response = await fetch(
    `/api/account/setup-context?token=${encodeURIComponent(token)}`,
  );
  if (!response.ok) {
    throw new Error(
      await getResponseMessage(
        response,
        "This password setup link is invalid or expired.",
      ),
    );
  }

  const data = (await response.json()) as SetupContextResponse;
  if (!data.email) {
    throw new Error("This password setup link is invalid or expired.");
  }

  return data;
}

async function getResponseMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  const body = (await response
    .json()
    .catch(() => null)) as MessageResponse | null;
  return body?.message ?? fallbackMessage;
}

function PasswordSetSuccessIcon() {
  return (
    <svg
      className="h-7 w-7 text-[#16a34a]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function LoginScreen() {
  const { t } = useLocalizedScreen();
  const searchParams = useSearchParams();
  const [state, setState] = useState<ScreenState>({ step: "email" });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    searchParams.get("authError") ? t("Sign-in failed. Please try again.") : "",
  );
  const setupToken = searchParams.get("setupToken");
  const resetToken = searchParams.get("resetToken");

  useEffect(() => {
    if (!resetToken) return;

    let active = true;
    setLoading(true);
    setErrorMessage("");

    void fetch(
      `/api/account/password-reset-context?token=${encodeURIComponent(resetToken)}`,
    )
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          throw new Error(
            await getResponseMessage(
              response,
              "This password reset link is invalid or expired.",
            ),
          );
        }
        const data = (await response.json()) as SetupContextResponse;
        if (!data.email)
          throw new Error("This password reset link is invalid or expired.");
        setState({
          step: "reset-password",
          email: data.email,
          token: resetToken,
        });
      })
      .catch((error) => {
        if (!active) return;
        setState({ step: "email" });
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "This password reset link is invalid or expired.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [resetToken]);

  useEffect(() => {
    if (!setupToken) {
      return;
    }

    let active = true;
    setLoading(true);
    setErrorMessage("");

    void getSetupContext(setupToken)
      .then((ctx) => {
        if (!active) {
          return;
        }
        setState({
          step: "set-password",
          email: ctx.email!,
          token: setupToken,
          isInvitation: ctx.isInvitation ?? false,
        });
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setState({ step: "email" });
        setErrorMessage(
          error instanceof Error
            ? error.message
            : t("This password setup link is invalid or expired."),
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [setupToken, t]);

  function resetToEmailStep() {
    setState({ step: "email" });
    setErrorMessage("");
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = getTrimmedFormValue(formData, "email");
    if (!email) return;

    redirectToKeycloak(email);
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = getTrimmedFormValue(formData, "email");
    if (!email) return;

    setLoading(true);
    try {
      await fetch("/api/account/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show confirmation regardless of whether email exists (avoid enumeration).
      setState({ step: "forgot-password-sent", email });
    } catch {
      setErrorMessage(t("Unable to process request. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.step !== "reset-password") return;

    setErrorMessage("");
    const formData = new FormData(event.currentTarget);
    const password = getRawFormValue(formData, "password");
    const confirmPassword = getRawFormValue(formData, "confirmPassword");

    if (password.length < 8) {
      setErrorMessage(t("Password must be at least 8 characters."));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t("Passwords do not match."));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/account/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: state.token, password }),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseMessage(response, t("Unable to reset password.")),
        );
      }

      setState({ step: "password-reset", email: state.email });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("Unable to reset password."),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.step !== "set-password") return;

    setErrorMessage("");
    const formData = new FormData(event.currentTarget);
    const password = getRawFormValue(formData, "password");
    const confirmPassword = getRawFormValue(formData, "confirmPassword");

    if (password.length < 8) {
      setErrorMessage(t("Password must be at least 8 characters."));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t("Passwords do not match."));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/account/set-initial-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: state.token, password }),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseMessage(response, t("Unable to set password.")),
        );
      }

      if (state.isInvitation) {
        setState({ step: "set-name", email: state.email });
      } else {
        setState({ step: "password-set", email: state.email });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("Unable to set password."),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSetName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.step !== "set-name") return;

    setErrorMessage("");
    const formData = new FormData(event.currentTarget);
    const firstName = getTrimmedFormValue(formData, "firstName");
    const lastName = getTrimmedFormValue(formData, "lastName");

    if (!firstName || !lastName) {
      setErrorMessage(t("First name and last name are required."));
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/account/set-invitee-name", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: state.email, firstName, lastName }),
      });
      // Proceed to success regardless of name update result
      setState({ step: "password-set", email: state.email });
    } catch {
      setState({ step: "password-set", email: state.email });
    } finally {
      setLoading(false);
    }
  }

  function renderEmailStep() {
    return (
      <>
        <h2 className="text-[20px] font-bold tracking-[-0.4492px] text-neutral-900">
          {t("Sign in to your account")}
        </h2>

        {errorMessage ? (
          <div className="mt-3 rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
            {errorMessage}
          </div>
        ) : null}
        <p className="mt-2 max-w-[310px] text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t("Access your company's capacity coordination dashboard")}
        </p>

        <form
          className="mt-6 space-y-5"
          aria-label={t("Sign in form")}
          onSubmit={handleEmailSubmit}
        >
          <AuthInput
            id="email"
            label={t("Email address")}
            type="email"
            placeholder="admin@company.com"
            autoComplete="email"
            icon={<EmailIcon className="h-[18px] w-[18px]" />}
          />
          <p className="text-xs tracking-[-0.1504px] text-neutral-500">
            {t(
              "Continue with your email on your organization's hosted identity page.",
            )}
          </p>

          <button
            type="submit"
            disabled={loading || Boolean(setupToken)}
            className={primaryButtonClassName}
          >
            {loading && setupToken ? t("Checking...") : t("Sign in")}
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
          className={secondaryLinkClassName}
        >
          {t("Request platform access")}
        </Link>

        <div className="relative my-6">
          <div className="border-t border-neutral-300" />
          <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm tracking-[-0.1504px] text-neutral-500">
            {t("or")}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setState({ step: "forgot-password" });
            setErrorMessage("");
          }}
          className={secondaryLinkClassName}
        >
          {t("Forgot password?")}
        </button>
      </>
    );
  }

  function renderSetPasswordStep(email: string) {
    return (
      <>
        <h2 className="text-[20px] font-bold tracking-[-0.4492px] text-neutral-900">
          {t("Set your password")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Welcome! Your account has been approved. Set a password using your secure setup link to get started.",
          )}
        </p>

        <div className="mt-4 rounded-[10px] border border-[#bedbff] bg-[#eff6ff] px-4 py-3 text-xs leading-[19.5px] text-[#193cb8]">
          {t("Setting password for")}{" "}
          <span className="font-semibold">{email}</span>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-xs text-[#b91c1c]">
            {errorMessage}
          </div>
        ) : null}

        <form
          className="mt-6 space-y-5"
          aria-label={t("Set password form")}
          onSubmit={handleSetPassword}
        >
          <AuthInput
            id="password"
            label={t("New password")}
            type="password"
            placeholder={t("Min. 8 characters")}
            autoComplete="new-password"
            icon={<LockIcon className="h-[18px] w-[18px]" />}
          />
          <AuthInput
            id="confirmPassword"
            label={t("Confirm password")}
            type="password"
            placeholder={t("Repeat your password")}
            autoComplete="new-password"
            icon={<LockIcon className="h-[18px] w-[18px]" />}
          />

          <button
            type="submit"
            disabled={loading}
            className={primaryButtonClassName}
          >
            {loading ? t("Setting password...") : t("Set password")}
          </button>
        </form>

        <button
          type="button"
          onClick={resetToEmailStep}
          className="mt-4 w-full text-center text-sm text-neutral-500 hover:text-neutral-700"
        >
          {t("Back to sign in")}
        </button>
      </>
    );
  }

  function renderSetNameStep(email: string) {
    return (
      <>
        <h2 className="text-[20px] font-bold tracking-[-0.4492px] text-neutral-900">
          {t("One more step")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t("Tell us your name so your colleagues can identify you.")}
        </p>

        <div className="mt-4 rounded-[10px] border border-[#bedbff] bg-[#eff6ff] px-4 py-3 text-xs leading-[19.5px] text-[#193cb8]">
          {t("Setting up account for")}{" "}
          <span className="font-semibold">{email}</span>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-xs text-[#b91c1c]">
            {errorMessage}
          </div>
        ) : null}

        <form
          className="mt-6 space-y-5"
          aria-label={t("Set name form")}
          onSubmit={handleSetName}
        >
          <AuthInput
            id="firstName"
            label={t("First name")}
            type="text"
            placeholder={t("Your first name")}
            autoComplete="given-name"
            icon={<EmailIcon className="h-[18px] w-[18px]" />}
          />
          <AuthInput
            id="lastName"
            label={t("Last name")}
            type="text"
            placeholder={t("Your last name")}
            autoComplete="family-name"
            icon={<EmailIcon className="h-[18px] w-[18px]" />}
          />

          <button
            type="submit"
            disabled={loading}
            className={primaryButtonClassName}
          >
            {loading ? t("Saving...") : t("Continue")}
          </button>
        </form>
      </>
    );
  }

  function renderForgotPasswordStep() {
    return (
      <>
        <h2 className="text-[20px] font-bold tracking-[-0.4492px] text-neutral-900">
          {t("Reset your password")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Enter your email address and we'll send you a link to reset your password.",
          )}
        </p>

        {errorMessage ? (
          <div className="mt-3 rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
            {errorMessage}
          </div>
        ) : null}

        <form
          className="mt-6 space-y-5"
          aria-label={t("Forgot password form")}
          onSubmit={handleForgotPassword}
        >
          <AuthInput
            id="email"
            label={t("Email address")}
            type="email"
            placeholder="admin@company.com"
            autoComplete="email"
            icon={<EmailIcon className="h-[18px] w-[18px]" />}
          />

          <button
            type="submit"
            disabled={loading}
            className={primaryButtonClassName}
          >
            {loading ? t("Sending...") : t("Send reset link")}
          </button>
        </form>

        <button
          type="button"
          onClick={resetToEmailStep}
          className="mt-4 w-full text-center text-sm text-neutral-500 hover:text-neutral-700"
        >
          {t("Back to sign in")}
        </button>
      </>
    );
  }

  function renderForgotPasswordSentStep(email: string) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dbeafe]">
          <EmailIcon className="h-7 w-7 text-[#1d4ed8]" />
        </div>
        <h2 className="text-[20px] font-bold tracking-[-0.4492px] text-neutral-900">
          {t("Check your email")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "If an account exists for {{email}}, a password reset link has been sent. The link expires in 1 hour.",
            { email },
          )}
        </p>
        <button
          type="button"
          onClick={resetToEmailStep}
          className="mt-6 w-full text-center text-sm text-neutral-500 hover:text-neutral-700"
        >
          {t("Back to sign in")}
        </button>
      </div>
    );
  }

  function renderResetPasswordStep(email: string) {
    return (
      <>
        <h2 className="text-[20px] font-bold tracking-[-0.4492px] text-neutral-900">
          {t("Set a new password")}
        </h2>

        <div className="mt-4 rounded-[10px] border border-[#bedbff] bg-[#eff6ff] px-4 py-3 text-xs leading-[19.5px] text-[#193cb8]">
          {t("Resetting password for")}{" "}
          <span className="font-semibold">{email}</span>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-xs text-[#b91c1c]">
            {errorMessage}
          </div>
        ) : null}

        <form
          className="mt-6 space-y-5"
          aria-label={t("Reset password form")}
          onSubmit={handleResetPassword}
        >
          <AuthInput
            id="password"
            label={t("New password")}
            type="password"
            placeholder={t("Min. 8 characters")}
            autoComplete="new-password"
            icon={<LockIcon className="h-[18px] w-[18px]" />}
          />
          <AuthInput
            id="confirmPassword"
            label={t("Confirm password")}
            type="password"
            placeholder={t("Repeat your password")}
            autoComplete="new-password"
            icon={<LockIcon className="h-[18px] w-[18px]" />}
          />

          <button
            type="submit"
            disabled={loading}
            className={primaryButtonClassName}
          >
            {loading ? t("Resetting...") : t("Reset password")}
          </button>
        </form>
      </>
    );
  }

  function renderPasswordResetStep(email: string) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7]">
          <PasswordSetSuccessIcon />
        </div>
        <h2 className="text-[20px] font-bold tracking-[-0.4492px] text-neutral-900">
          {t("Password reset successfully")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t("Your password has been updated. Click below to sign in.")}
        </p>
        <button
          type="button"
          onClick={() => redirectToKeycloak(email)}
          className="mt-6 h-[52px] w-full rounded-[10px] bg-blue-600 text-base font-semibold tracking-[-0.3125px] text-white shadow-[0_10px_15px_rgba(0,0,0,0.10),0_4px_6px_rgba(0,0,0,0.10)] transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          {t("Sign in now")}
        </button>
      </div>
    );
  }

  function renderPasswordSetStep(email: string) {
    return (
      <>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7]">
            <PasswordSetSuccessIcon />
          </div>
          <h2 className="text-[20px] font-bold tracking-[-0.4492px] text-neutral-900">
            {t("Password set successfully")}
          </h2>
          <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
            {t(
              "Your password has been set. Click below to sign in with your new credentials.",
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => redirectToKeycloak(email)}
          className="mt-6 h-[52px] w-full rounded-[10px] bg-blue-600 text-base font-semibold tracking-[-0.3125px] text-white shadow-[0_10px_15px_rgba(0,0,0,0.10),0_4px_6px_rgba(0,0,0,0.10)] transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          {t("Sign in now")}
        </button>
      </>
    );
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_15%_16%,rgba(0,159,154,0.18),transparent_30rem),radial-gradient(circle_at_86%_10%,rgba(0,107,182,0.18),transparent_28rem),linear-gradient(151.85deg,#f8fafc_0%,#eef7f8_50%,#f5f7fb_100%)] px-4 py-10"
      data-name="Login Screen"
      data-node-id="1:7"
    >
      <div className="w-full max-w-[448px]">
        <header className="mb-8 flex flex-col items-center">
          <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/90 bg-white p-4 shadow-[0_24px_50px_rgba(0,107,182,0.18),0_12px_22px_rgba(15,23,42,0.10)] ring-1 ring-slate-900/5">
            <BrandIcon className="h-full w-full object-contain" />
          </div>
          <h1 className="text-center text-[34px] font-extrabold leading-none tracking-[-0.055em] text-[#102033] drop-shadow-[0_1px_0_rgba(255,255,255,0.72)]">
            {t("KapacitetNet")}
          </h1>
          <p className="mt-3 text-center text-sm font-semibold tracking-[-0.1504px] text-[#0f5f96]">
            {t("Capacity coordination")}
          </p>
        </header>

        <section className="rounded-3xl border border-white/80 bg-white/95 p-8 shadow-[0_28px_70px_rgba(15,23,42,0.18),0_12px_24px_rgba(15,23,42,0.08)] backdrop-blur">
          {state.step === "email" ? renderEmailStep() : null}
          {state.step === "set-password"
            ? renderSetPasswordStep(state.email)
            : null}
          {state.step === "set-name" ? renderSetNameStep(state.email) : null}
          {state.step === "password-set"
            ? renderPasswordSetStep(state.email)
            : null}
          {state.step === "forgot-password" ? renderForgotPasswordStep() : null}
          {state.step === "forgot-password-sent"
            ? renderForgotPasswordSentStep(state.email)
            : null}
          {state.step === "reset-password"
            ? renderResetPasswordStep(state.email)
            : null}
          {state.step === "password-reset"
            ? renderPasswordResetStep(state.email)
            : null}
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
