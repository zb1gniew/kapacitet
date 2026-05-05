"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import { CityAutocomplete } from "@/components/availability/CityAutocomplete";
import { CategoryMultiSelect } from "@/components/availability/CategoryMultiSelect";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { OnboardingProgressDots } from "@/components/auth/OnboardingProgressDots";
import { ArrowRightIcon } from "@/components/auth/icons";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import { completeOnboarding } from "@/lib/onboarding/complete-onboarding";
import type { CompanyDetails } from "@/types/onboarding";
import {
  type OnboardingFieldErrors,
  validateOnboardingDetails,
  hasErrors,
} from "@/lib/validation/onboarding";

type Props = {
  company: CompanyDetails;
};

export function ConfirmCompanyDetailsScreen({ company }: Props) {
  const { t } = useLocalizedScreen();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<OnboardingFieldErrors>({});
  const [locationValue, setLocationValue] = useState(
    company.defaultLocation ?? "",
  );
  const [categories, setCategories] = useState<string[]>(
    company.categories ?? [],
  );
  const [contactPhone, setContactPhone] = useState(company.contactPhone ?? "");

  async function handleConfirm() {
    setErrorMessage("");
    setFieldErrors({});

    const location = locationValue.trim();

    const errors = validateOnboardingDetails(t, {
      categories: categories.length > 0 ? categories : undefined,
      location: location || undefined,
    });
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    const result = await completeOnboarding({
      categories: categories.length > 0 ? categories : undefined,
      defaultLocation: location || undefined,
      contactPhone: contactPhone || undefined,
    });

    if (result.ok) {
      router.push(APP_ROUTES.onboardingFirstAction);
    } else {
      setErrorMessage(result.message);
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    setErrorMessage("");
    setSubmitting(true);
    const result = await completeOnboarding();
    if (result.ok) {
      router.push(APP_ROUTES.onboardingFirstAction);
    } else {
      setErrorMessage(result.message);
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      maxWidthClassName="max-w-[672px]"
      dataName="Welcome Screen 2"
      dataNodeId="1:234"
    >
      <section className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
        <header>
          <h1 className="text-[24px] font-bold leading-8 tracking-[0.0703px] text-neutral-900">
            {t("Confirm company details")}
          </h1>
          <p className="mt-3 max-w-[570px] text-base leading-[26px] tracking-[-0.3125px] text-neutral-600">
            {t(
              "Review and confirm the information associated with your company account. This information will be visible to cooperation partners after mutual confirmation.",
            )}
          </p>
        </header>

        <div className="mt-8 space-y-5">
          <AuthField
            id="companyName"
            label={t("Company name")}
            value={company.name}
            readOnly
            helperText={t(
              "Company name changes are handled separately and cannot be made during onboarding.",
            )}
          />

          {company.cvr ? (
            <AuthField
              id="cvr"
              label={t("CVR number")}
              value={company.cvr}
              readOnly
              helperText={t("Company registration number — cannot be changed")}
            />
          ) : null}

          <div className="space-y-2">
            <label className="block text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
              {t("Categories")}
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
                {t(fieldErrors.categories)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="location"
              className="block text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900"
            >
              {t("Primary location")}
            </label>
            <CityAutocomplete
              value={locationValue}
              onChange={(v) => {
                setLocationValue(v);
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
            value={company.contactEmail}
            readOnly
          />

          <div className="space-y-2">
            <label className="block text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
              {t("Contact phone")}
            </label>
            <PhoneInput
              value={contactPhone}
              onChange={setContactPhone}
              size="md"
              t={t}
            />
          </div>
        </div>

        <div className="mt-6 border-t border-neutral-200 pt-6">
          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {t(errorMessage)}
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSkip}
              disabled={submitting}
              className="inline-flex h-[54px] w-full items-center justify-center rounded-[10px] border border-neutral-300 text-base font-semibold tracking-[-0.3125px] text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 sm:flex-1"
            >
              {t("Skip for now")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-[10px] bg-blue-600 text-base font-semibold tracking-[-0.3125px] text-white shadow-[0_10px_15px_rgba(0,0,0,0.10),0_4px_6px_rgba(0,0,0,0.10)] transition hover:bg-blue-700 disabled:opacity-50 sm:flex-1"
            >
              <span>{t("Confirm and continue")}</span>
              <ArrowRightIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </section>

      <OnboardingProgressDots activeStep={2} />
    </AuthShell>
  );
}
