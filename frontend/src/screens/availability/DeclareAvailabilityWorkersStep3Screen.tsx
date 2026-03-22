"use client";

import { useMemo, useState } from "react";
import { AvailabilityActionBar } from "@/components/availability/AvailabilityActionBar";
import { AvailabilityPageShell } from "@/components/availability/AvailabilityPageShell";
import { AvailabilitySurfaceCard } from "@/components/availability/AvailabilitySurfaceCard";
import {
  BulletCheckIcon,
  CalendarIcon,
  LocationIcon,
  ShieldIcon,
} from "@/components/availability/icons";
import {
  AVAILABILITY_DEFAULT_RADIUS_KM,
  AVAILABILITY_RADIUS_MAX_KM,
  AVAILABILITY_RADIUS_MIN_KM,
} from "@/constants/availability";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";

type DeclareAvailabilityWorkersStep3ScreenProps = {
  user: AuthenticatedUser;
};

function Label({ label }: { label: string }) {
  return (
    <label className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
      {label}
      <span className="text-red-600">*</span>
    </label>
  );
}

export function DeclareAvailabilityWorkersStep3Screen({
  user,
}: DeclareAvailabilityWorkersStep3ScreenProps) {
  const { t } = useLocalizedScreen();

  const [radiusKm, setRadiusKm] = useState(AVAILABILITY_DEFAULT_RADIUS_KM);
  const sliderProgress = useMemo(() => {
    return (
      ((radiusKm - AVAILABILITY_RADIUS_MIN_KM) /
        (AVAILABILITY_RADIUS_MAX_KM - AVAILABILITY_RADIUS_MIN_KM)) *
      100
    );
  }, [radiusKm]);

  return (
    <AvailabilityPageShell
      user={user}
      t={t}
      currentStep={3}
      dataName="Declare Availability Step 3"
      dataNodeId="1:1016"
    >
      <AvailabilitySurfaceCard>
        <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
          {t("Cooperation period and control")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Define when and where this capacity is available. You maintain full control over any agreements.",
          )}
        </p>

        <form className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label label={t("Start date")} />
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
                <input
                  type="date"
                  className="h-[50px] w-full rounded-[10px] border border-neutral-300 bg-white pl-11 pr-4 text-base tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label label={t("End date")} />
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
                <input
                  type="date"
                  className="h-[50px] w-full rounded-[10px] border border-neutral-300 bg-white pl-11 pr-4 text-base tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label label={t("Location")} />
            <div className="relative">
              <LocationIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder={t("e.g., Sønderborg, Aabenraa, Syddanmark")}
                className="h-[50px] w-full rounded-[10px] border border-neutral-300 bg-white pl-11 pr-4 text-base tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
              {t("Search radius: {{value}} km", { value: radiusKm })}
            </p>
            <input
              type="range"
              min={AVAILABILITY_RADIUS_MIN_KM}
              max={AVAILABILITY_RADIUS_MAX_KM}
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
              className="availability-range"
              style={{
                background: `linear-gradient(to right, #2563eb ${sliderProgress}%, #e5e5e5 ${sliderProgress}%)`,
              }}
            />
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{t("10 km")}</span>
              <span>{t("200 km")}</span>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#bedbff] bg-[#eff6ff] p-6 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#dbeafe] text-[#1d4ed8] shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)]">
                <ShieldIcon className="h-6 w-6" />
              </span>

              <div>
                <h3 className="text-base font-bold tracking-[-0.3125px] text-[#1c398e]">
                  {t("Privacy and control protected")}
                </h3>
                <p className="mt-1 text-sm leading-[22.75px] tracking-[-0.1504px] text-[#193cb8]">
                  {t(
                    "Your declaration is shared securely within your network with these guarantees:",
                  )}
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-3 pl-10 text-sm leading-5 tracking-[-0.1504px] text-[#1c398e]">
              <li className="flex items-start gap-2">
                <BulletCheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <strong>{t("Anonymized sharing:")}</strong>{" "}
                  {t(
                    "Worker identities are never revealed until you approve a match",
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <BulletCheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <strong>{t("Temporary cooperation only:")}</strong>{" "}
                  {t(
                    "This is capacity sharing, not hiring or employment transfer",
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <BulletCheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <strong>{t("You approve every match:")}</strong>{" "}
                  {t(
                    "No agreements are made without your explicit confirmation",
                  )}
                </span>
              </li>
            </ul>
          </div>
        </form>
      </AvailabilitySurfaceCard>

      <AvailabilityActionBar
        t={t}
        backHref={APP_ROUTES.declareAvailabilityWorkersStep2}
        nextHref={APP_ROUTES.declareAvailabilityWorkersStep4}
        nextLabelKey="Continue"
        nextVariant="primary"
      />
    </AvailabilityPageShell>
  );
}
