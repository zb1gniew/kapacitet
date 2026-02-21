"use client";

import { useState } from "react";
import { AvailabilityActionBar } from "@/components/availability/AvailabilityActionBar";
import { AvailabilityPageShell } from "@/components/availability/AvailabilityPageShell";
import { AvailabilitySurfaceCard } from "@/components/availability/AvailabilitySurfaceCard";
import { AlertIcon } from "@/components/availability/icons";
import {
  AVAILABILITY_CERTIFICATE_OPTIONS,
  AVAILABILITY_EXPERIENCE_OPTIONS,
} from "@/constants/availability";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";

type DeclareAvailabilityWorkersStep2ScreenProps = {
  user: AuthenticatedUser;
};

function Label({
  label,
  required = true,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
      {label}
      {required ? <span className="text-red-600">*</span> : null}
    </label>
  );
}

export function DeclareAvailabilityWorkersStep2Screen({
  user,
}: DeclareAvailabilityWorkersStep2ScreenProps) {
  const { t } = useLocalizedScreen();

  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string>("");

  const toggleCertificate = (certificateId: string) => {
    setSelectedCertificates((current) => {
      if (current.includes(certificateId)) {
        return current.filter((id) => id !== certificateId);
      }

      return [...current, certificateId];
    });
  };

  return (
    <AvailabilityPageShell
      user={user}
      t={t}
      currentStep={2}
      dataName="Declare Availability Step 2"
      dataNodeId="1:810"
    >
      <AvailabilitySurfaceCard>
        <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
          {t("Worker details")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Provide details about the capacity you're sharing. This information will be used for anonymous matching.",
          )}
        </p>

        <form className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label label={t("Number of workers available")} />
            <input
              type="number"
              inputMode="numeric"
              placeholder={t("e.g., 3")}
              className="h-[50px] w-full rounded-[10px] border border-neutral-300 px-4 text-base tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <Label label={t("Skill or trade")} />
            <input
              type="text"
              placeholder={t("e.g., Welders, Electricians, Carpenters")}
              className="h-[50px] w-full rounded-[10px] border border-neutral-300 px-4 text-base tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <Label label={t("Required certificates")} />

            <div className="flex items-start gap-2 rounded-[10px] border border-[#fee685] bg-[#fffbeb] px-4 py-4 text-[#973c00]">
              <AlertIcon className="mt-0.5 h-[18px] w-[18px] shrink-0" />
              <p className="text-xs leading-[19.5px] tracking-[-0.1172px]">
                {t(
                  "Certificates are mandatory for matching. Only select certificates that workers currently hold.",
                )}
              </p>
            </div>

            <div className="grid gap-3 pt-1 md:grid-cols-2">
              {AVAILABILITY_CERTIFICATE_OPTIONS.map((certificate) => {
                const isSelected = selectedCertificates.includes(certificate.id);

                return (
                  <button
                    key={certificate.id}
                    type="button"
                    onClick={() => toggleCertificate(certificate.id)}
                    className={`h-[46px] rounded-[10px] border px-4 text-left text-sm font-medium tracking-[-0.1504px] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-blue-300"
                    }`}
                  >
                    {t(certificate.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label label={t("Experience level")} />
            <div className="grid gap-3 md:grid-cols-3">
              {AVAILABILITY_EXPERIENCE_OPTIONS.map((option) => {
                const isSelected = selectedExperience === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedExperience(option.id)}
                    className={`h-[46px] rounded-[10px] border px-4 text-center text-sm font-medium tracking-[-0.1504px] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-blue-300"
                    }`}
                  >
                    {t(option.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              label={`${t("Additional notes")} ${t("(Optional)")}`}
              required={false}
            />
            <textarea
              placeholder={t(
                "Add any additional information that might be relevant for matching...",
              )}
              className="h-[122px] w-full resize-none rounded-[10px] border border-neutral-300 px-4 py-3 text-base tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </form>
      </AvailabilitySurfaceCard>

      <AvailabilityActionBar
        t={t}
        backHref={APP_ROUTES.declareAvailabilityWorkersStep1}
        nextHref={APP_ROUTES.declareAvailabilityWorkersStep3}
        nextLabelKey="Continue"
        nextVariant="primary"
      />
    </AvailabilityPageShell>
  );
}
