"use client";

import { useEffect, useState } from "react";
import {
  CircleCheckIcon,
  EmailIcon,
  InfoIcon,
  MapPinIcon,
} from "@/components/auth/icons";
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
}: {
  value: string;
  onChange?: (v: string) => void;
  icon?: "location" | "email";
  type?: "text" | "email" | "tel";
  disabled?: boolean;
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
        className={`h-[42px] w-full rounded-[10px] border border-neutral-300 bg-white pr-4 text-sm tracking-[-0.1504px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] focus:border-blue-600 focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-500 ${
          icon ? "pl-11" : "pl-4"
        }`}
      />
    </div>
  );
}

export function SettingsCompanyInformationCard({
  t,
}: SettingsCompanyInformationCardProps) {
  const [info, setInfo] = useState<CompanyInformation | null>(null);
  const [draft, setDraft] = useState<CompanyInformation | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/company/information")
      .then((r) => r.json())
      .then((data: CompanyInformation) => {
        setInfo(data);
        setDraft(data);
      })
      .catch(() => {});
  }, []);

  function patch(field: keyof CompanyInformation, value: string) {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
    setStatus("idle");
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setStatus("idle");
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
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(info);
    setStatus("idle");
  }

  if (!draft) {
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
          />
        </div>

        <div className="space-y-2">
          <Label label={t("Primary location")} />
          <Input
            value={draft.defaultLocation}
            onChange={(v) => patch("defaultLocation", v)}
            icon="location"
          />
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
          />
        </div>

        {status === "saved" && (
          <p className="text-sm font-medium text-green-600">
            {t("Changes saved successfully.")}
          </p>
        )}
        {status === "error" && (
          <p className="text-sm font-medium text-red-600">
            {t("Failed to save changes. Please try again.")}
          </p>
        )}

        <div className="flex items-center gap-3 border-t border-neutral-200 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-blue-600 px-4 text-sm font-semibold tracking-[-0.1504px] text-white shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] transition hover:bg-blue-700 disabled:opacity-60"
          >
            <CircleCheckIcon className="h-4 w-4" />
            {saving ? t("Saving…") : t("Save changes")}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex h-10 items-center rounded-[10px] border border-neutral-300 bg-white px-4 text-sm font-semibold tracking-[-0.1504px] text-neutral-700 transition hover:bg-neutral-100"
          >
            {t("Cancel")}
          </button>
        </div>
      </form>
    </article>
  );
}
