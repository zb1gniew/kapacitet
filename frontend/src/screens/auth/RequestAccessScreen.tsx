"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import { CityAutocomplete } from "@/components/availability/CityAutocomplete";
import { CategoryMultiSelect } from "@/components/availability/CategoryMultiSelect";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import {
  ArrowRightIcon,
  BrandIcon,
  BuildingIcon,
  CircleCheckIcon,
  EmailIcon,
  InfoIcon,
} from "@/components/auth/icons";
import type { TranslateFn } from "@/types/i18n";
import type { AccessRequestSuccess } from "@/types/workflows";
import {
  type AccessRequestFieldErrors,
  validateAccessRequest,
  hasErrors,
} from "@/lib/validation/access-request";

function getApiErrorMessage(t: TranslateFn, responseText: string): string {
  if (!responseText) {
    return t("We couldn't submit the access request. Please try again.");
  }

  try {
    const parsed = JSON.parse(responseText) as { message?: string };
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    // Fall back to a generic message when the error body isn't JSON.
  }

  return t(
    "We couldn't submit the access request. Check the form values and try again.",
  );
}

export function RequestAccessScreen() {
  const { t } = useLocalizedScreen();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AccessRequestFieldErrors>({});
  const [location, setLocation] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [submittedRequestId, setSubmittedRequestId] = useState<number | null>(
    null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("companyName") ?? "").trim(),
      categories,
      location: location.trim(),
      contactEmail: String(formData.get("contactEmail") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim() || undefined,
    };

    const errors = validateAccessRequest(t, payload);
    setFieldErrors(errors);

    if (hasErrors(errors)) {
      setErrorMessage("");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSubmittedRequestId(null);

    let succeeded = false;
    try {
      const response = await fetch("/api/access-requests", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const responseText = await response.text();

      if (!response.ok) {
        setErrorMessage(getApiErrorMessage(t, responseText));
        return;
      }

      const result = JSON.parse(responseText) as Partial<AccessRequestSuccess>;
      if (typeof result.id !== "number") {
        throw new Error("Access request response did not include an ID");
      }

      succeeded = true;
      setSubmittedRequestId(result.id);
    } catch {
      if (!succeeded) {
        setErrorMessage(
          t("We couldn't reach the backend. Please try again in a moment."),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      maxWidthClassName="max-w-[672px]"
      dataName="Register Screen"
      dataNodeId="1:69"
    >
      <header className="mb-6 flex flex-col items-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/90 bg-white p-3.5 shadow-[0_22px_44px_rgba(0,107,182,0.16),0_10px_20px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5">
          <BrandIcon className="h-full w-full object-contain" />
        </div>
        <h1 className="text-center text-[30px] font-extrabold leading-none tracking-[-0.055em] text-[#102033] drop-shadow-[0_1px_0_rgba(255,255,255,0.72)]">
          {t("KapacitetNet")}
        </h1>
      </header>

      <section className="rounded-3xl border border-white/80 bg-white/95 p-8 shadow-[0_28px_70px_rgba(15,23,42,0.18),0_12px_24px_rgba(15,23,42,0.08)] backdrop-blur">
        <h2
          className="text-[24px] font-bold leading-8 tracking-[0.0703px] text-neutral-900"
          data-node-id="1:87"
        >
          {t("Request platform access")}
        </h2>

        <aside className="mt-3 rounded-[10px] border border-[#bedbff] bg-[#eff6ff] p-4 text-[#193cb8]">
          <div className="flex gap-2.5">
            <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <h3 className="text-base font-semibold leading-6 tracking-[-0.3125px] text-[#1c398e]">
                {t("This is a controlled network")}
              </h3>
              <p className="mt-1 text-sm leading-[22.75px] tracking-[-0.1504px]">
                {t(
                  "KapacitetNet is a capacity coordination platform operated for verified companies within the network. Access requests are reviewed to ensure alignment with network principles and to verify company legitimacy.",
                )}
              </p>
              <ul className="mt-3 space-y-1.5 text-xs leading-4">
                {[
                  t("Typical review time: 2-3 business days"),
                  t(
                    "You'll receive notification when your request is reviewed",
                  ),
                  t(
                    "Platform administrator may contact you for additional information",
                  ),
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CircleCheckIcon className="mt-[1px] h-[14px] w-[14px] shrink-0 text-blue-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {submittedRequestId ? (
          <aside className="mt-5 rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] p-4 text-[#166534]">
            <h3 className="text-base font-semibold leading-6 tracking-[-0.3125px]">
              {t("Access request submitted")}
            </h3>
            <p className="mt-1 text-sm leading-[22.75px] tracking-[-0.1504px]">
              {t(
                `Your request has been recorded and is awaiting platform review. Reference ID: ${submittedRequestId}.`,
              )}
            </p>
          </aside>
        ) : null}

        <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
          <AuthField
            id="companyName"
            label={t("Company name")}
            required
            placeholder={t("Your company's legal name")}
            icon={<BuildingIcon className="h-[18px] w-[18px]" />}
            error={fieldErrors.companyName}
          />
          <div className="space-y-2">
            <label className="block text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
              {t("Categories")}
              <span className="text-red-600"> *</span>
            </label>
            <CategoryMultiSelect
              value={categories}
              onChange={(v) => {
                setCategories(v);
                setFieldErrors((prev) => ({ ...prev, categories: undefined }));
              }}
              placeholder={t("Select up to 3 categories")}
              error={Boolean(fieldErrors.categories)}
            />
            {fieldErrors.categories ? (
              <p className="text-xs leading-4 tracking-[-0.15px] text-red-600">
                {fieldErrors.categories}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="location"
              className="block text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900"
            >
              {t("Primary location")}
              <span className="text-red-600"> *</span>
            </label>
            <CityAutocomplete
              value={location}
              onChange={(v) => {
                setLocation(v);
                setFieldErrors((prev) => ({ ...prev, location: undefined }));
              }}
              placeholder={t("Start typing a city…")}
            />
            {fieldErrors.location ? (
              <p className="text-xs leading-4 tracking-[-0.15px] text-red-600">
                {t(fieldErrors.location)}
              </p>
            ) : null}
          </div>
          <AuthField
            id="contactEmail"
            label={t("Contact email")}
            required
            placeholder={t("admin@company.com")}
            icon={<EmailIcon className="h-[18px] w-[18px]" />}
            helperText={t(
              "We'll use this email to notify you about your access request status",
            )}
            error={fieldErrors.contactEmail}
          />
          <AuthField
            id="message"
            label={t("Message")}
            optional
            placeholder={t(
              "Briefly explain your interest in joining the capacity coordination network or mention any existing network connections",
            )}
            multiline
            rows={4}
            error={fieldErrors.message}
          />

          {errorMessage ? (
            <p className="rounded-[10px] border border-[#fca5a5] bg-[#fff5f5] p-3 text-sm text-[#b91c1c]">
              {t(errorMessage)}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link
              href={APP_ROUTES.home}
              className="inline-flex h-[50px] w-full items-center justify-center rounded-[10px] border border-neutral-300 text-base font-semibold tracking-[-0.3125px] text-neutral-700 transition hover:bg-neutral-50 sm:flex-1"
            >
              {t("Back to sign in")}
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-[10px] bg-blue-600 text-base font-semibold tracking-[-0.3125px] text-white shadow-[0_10px_15px_rgba(0,0,0,0.10),0_4px_6px_rgba(0,0,0,0.10)] transition hover:bg-blue-700 sm:flex-1"
            >
              <span>
                {t(isSubmitting ? "Submitting..." : "Submit request")}
              </span>
              <ArrowRightIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </form>
      </section>

      <p className="mt-4 text-center text-xs leading-[19.5px] tracking-[-0.1504px] text-neutral-500">
        {t(
          "By submitting an access request, you acknowledge that your company information will be reviewed by platform administrators. Your data is handled in accordance with applicable data protection regulations.",
        )}
      </p>
    </AuthShell>
  );
}
