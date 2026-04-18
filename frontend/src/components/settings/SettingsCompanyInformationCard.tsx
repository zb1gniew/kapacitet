"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CircleCheckIcon,
  EmailIcon,
  InfoIcon,
  MapPinIcon,
} from "@/components/auth/icons";
import { parseProblemDetails } from "@/lib/backend/errors";
import type { TranslateFn } from "@/types/i18n";

type SettingsCompanyInformationCardProps = {
  t: TranslateFn;
};

type CompanyInformation = {
  name: string;
  industry: string;
  defaultLocation: string;
  contactEmail: string;
  contactPhone: string | null;
};

function Label({ label }: { label: string }) {
  return (
    <label className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
      {label}
    </label>
  );
}

function Input({
  value,
  onChange,
  icon,
  type = "text",
  disabled,
  error,
}: {
  value: string;
  onChange?: (v: string) => void;
  icon?: "location" | "email";
  type?: "text" | "email" | "tel";
  disabled?: boolean;
  error?: string;
}) {
  const leadingIcon =
    icon === "location" ? (
      <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
    ) : icon === "email" ? (
      <EmailIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
    ) : null;

  return (
    <div className="relative">
      {leadingIcon}
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        aria-invalid={Boolean(error)}
        className={`h-[42px] w-full rounded-[10px] border bg-white pr-4 text-sm tracking-[-0.1504px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-500 ${
          error
            ? "border-red-300 focus:border-red-500"
            : "border-neutral-300 focus:border-blue-600"
        } ${icon ? "pl-11" : "pl-4"}`}
      />
    </div>
  );
}

export function SettingsCompanyInformationCard({
  t,
}: SettingsCompanyInformationCardProps) {
  const [info, setInfo] = useState<CompanyInformation | null>(null);
  const [draft, setDraft] = useState<CompanyInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const loadInformation = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch("/api/company/information", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error((await parseProblemDetails(response)).message);
      }

      const data = (await response.json()) as CompanyInformation;
      setInfo(data);
      setDraft(data);
    } catch (error) {
      setInfo(null);
      setDraft(null);
      setLoadError(
        error instanceof Error
          ? error.message
          : t("Unable to load company information right now."),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadInformation();
  }, [loadInformation]);

  function patch(field: keyof CompanyInformation, value: string) {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
    setStatus("idle");
    setErrorMessage("");
    setFieldErrors((prev) => {
      if (!(field in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setStatus("idle");
    setErrorMessage("");
    setFieldErrors({});
    try {
      const res = await fetch("/api/company/information", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          industry: draft.industry,
          defaultLocation: draft.defaultLocation,
          contactPhone: draft.contactPhone ?? "",
        }),
      });
      if (res.ok) {
        const updated: CompanyInformation = await res.json();
        setInfo(updated);
        setDraft(updated);
        setStatus("saved");
      } else {
        const problemDetails = await parseProblemDetails(res);
        setFieldErrors(problemDetails.fieldErrors);
        setErrorMessage(problemDetails.message);
        setStatus("error");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("Unable to save company information right now."),
      );
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(info);
    setStatus("idle");
    setErrorMessage("");
    setFieldErrors({});
  }

  if (loading) {
    return (
      <article className="rounded-[14px] border border-neutral-200 bg-white p-6 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
        <div className="h-6 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="mt-5 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
              <div className="h-[42px] animate-pulse rounded-[10px] bg-neutral-100" />
            </div>
          ))}
        </div>
      </article>
    );
  }

  if (loadError || !draft) {
    return (
      <article className="rounded-[14px] border border-neutral-200 bg-white p-6 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
        <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
          {t("Company information")}
        </h2>
        <div className="mt-5 rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>
            {loadError || t("Unable to load company information right now.")}
          </p>
          <button
            type="button"
            onClick={() => void loadInformation()}
            className="mt-3 inline-flex h-10 items-center rounded-[10px] border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            {t("Try again")}
          </button>
        </div>
      </article>
    );
  }

  const industryError = fieldErrors.industry?.[0];
  const defaultLocationError = fieldErrors.defaultLocation?.[0];
  const contactPhoneError = fieldErrors.contactPhone?.[0];

  return (
    <article className="rounded-[14px] border border-neutral-200 bg-white p-6 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
        {t("Company information")}
      </h2>

      <div className="mt-4 rounded-[10px] border border-[#bedbff] bg-[#eff6ff] p-3">
        <div className="flex items-start gap-2 text-[#193cb8]">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs leading-[19.5px] tracking-[-0.1172px]">
            {t(
              "This information is used internally for account management and displayed to cooperation partners only after mutual confirmation. Changes require administrator approval.",
            )}
          </p>
        </div>
      </div>

      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="space-y-2">
          <Label label={t("Company name")} />
          <Input value={draft.name} disabled />
          <p className="text-[11px] leading-4 text-neutral-500">
            {t("Contact support to update company name")}
          </p>
        </div>

        <div className="space-y-2">
          <Label label={t("Industry")} />
          <Input
            value={draft.industry}
            onChange={(v) => patch("industry", v)}
            error={industryError}
          />
          {industryError ? (
            <p className="text-[11px] leading-4 text-red-600">
              {t(industryError)}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label label={t("Primary location")} />
          <Input
            value={draft.defaultLocation}
            onChange={(v) => patch("defaultLocation", v)}
            icon="location"
            error={defaultLocationError}
          />
          {defaultLocationError ? (
            <p className="text-[11px] leading-4 text-red-600">
              {t(defaultLocationError)}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label label={t("Contact email")} />
          <Input
            value={draft.contactEmail}
            icon="email"
            type="email"
            disabled
          />
          <p className="text-[11px] leading-4 text-neutral-500">
            {t("Primary contact for platform communications")}
          </p>
        </div>

        <div className="space-y-2">
          <Label label={t("Contact phone")} />
          <Input
            value={draft.contactPhone ?? ""}
            onChange={(v) => patch("contactPhone", v)}
            type="tel"
            error={contactPhoneError}
          />
          {contactPhoneError ? (
            <p className="text-[11px] leading-4 text-red-600">
              {t(contactPhoneError)}
            </p>
          ) : null}
        </div>

        {status === "saved" && (
          <p className="text-sm font-medium text-green-600">
            {t("Changes saved successfully.")}
          </p>
        )}
        {status === "error" && (
          <p className="text-sm font-medium text-red-600">
            {t(errorMessage || "Failed to save changes. Please try again.")}
          </p>
        )}

        <div className="flex items-center gap-3 border-t border-neutral-200 pt-4">
          <button
            type="submit"
            disabled={saving || loading || !draft}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-blue-600 px-4 text-sm font-semibold tracking-[-0.1504px] text-white shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] transition hover:bg-blue-700 disabled:opacity-60"
          >
            <CircleCheckIcon className="h-4 w-4" />
            {saving ? t("Saving…") : t("Save changes")}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="inline-flex h-10 items-center rounded-[10px] border border-neutral-300 bg-white px-4 text-sm font-semibold tracking-[-0.1504px] text-neutral-700 transition hover:bg-neutral-100"
          >
            {t("Cancel")}
          </button>
        </div>
      </form>
    </article>
  );
}
