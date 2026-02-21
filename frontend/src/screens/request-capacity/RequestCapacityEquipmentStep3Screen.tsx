"use client";

import { useMemo, useState } from "react";
import { AvailabilityActionBar } from "@/components/availability/AvailabilityActionBar";
import { AvailabilityPageShell } from "@/components/availability/AvailabilityPageShell";
import { AvailabilitySurfaceCard } from "@/components/availability/AvailabilitySurfaceCard";
import { AlertIcon, CalendarIcon, LocationIcon } from "@/components/availability/icons";
import {
  AVAILABILITY_DEFAULT_RADIUS_KM,
  AVAILABILITY_RADIUS_MAX_KM,
  AVAILABILITY_RADIUS_MIN_KM,
} from "@/constants/availability";
import { REQUEST_CAPACITY_STEPS } from "@/constants/request-capacity";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";

type RequestCapacityEquipmentStep3ScreenProps = {
  user: AuthenticatedUser;
};

type RequestUrgency = "normal" | "urgent";

function Label({ label }: { label: string }) {
  return (
    <label className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
      {label}
      <span className="text-red-600">*</span>
    </label>
  );
}

function UrgencyCard({
  title,
  description,
  selected,
  tone,
  onSelect,
}: {
  title: string;
  description: string;
  selected: boolean;
  tone: "primary" | "warning";
  onSelect: () => void;
}) {
  const selectedClass =
    tone === "warning"
      ? "border-[#e17100] bg-[#fffbeb]"
      : "border-blue-600 bg-[#eff6ff]";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-[10px] border p-4 text-left shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] transition ${
        selected
          ? selectedClass
          : "border-neutral-200 bg-white hover:border-blue-300"
      }`}
    >
      <div className="flex items-center gap-2">
        <AlertIcon
          className={`h-[18px] w-[18px] ${
            tone === "warning" ? "text-[#e17100]" : "text-blue-600"
          }`}
        />
        <p className="text-base font-bold leading-6 tracking-[-0.3125px] text-neutral-900">
          {title}
        </p>
      </div>
      <p className="mt-2 text-xs leading-[19.5px] tracking-[-0.1172px] text-neutral-600">
        {description}
      </p>
    </button>
  );
}

export function RequestCapacityEquipmentStep3Screen({
  user,
}: RequestCapacityEquipmentStep3ScreenProps) {
  const { t } = useLocalizedScreen();

  const [radiusKm, setRadiusKm] = useState(AVAILABILITY_DEFAULT_RADIUS_KM);
  const [urgency, setUrgency] = useState<RequestUrgency>("urgent");

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
      activeItemKey="Request capacity"
      titleKey="Request capacity"
      descriptionKey="Request temporary workers or equipment from your trusted network. The platform will match your needs with declared availability anonymously."
      steps={REQUEST_CAPACITY_STEPS}
      dataName="Request Capacity Equipment Step 3"
      dataNodeId="1:3252"
    >
      <AvailabilitySurfaceCard>
        <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
          {t("Cooperation period and location")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Define when and where you need this capacity. The platform will search for matches in your specified area.",
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

          <div className="space-y-2">
            <Label label={t("Request urgency")} />
            <div className="grid gap-4 md:grid-cols-2">
              <UrgencyCard
                title={t("Normal")}
                description={t(
                  "Standard matching process. The platform will search declared availability and send targeted requests.",
                )}
                selected={urgency === "normal"}
                tone="primary"
                onSelect={() => setUrgency("normal")}
              />
              <UrgencyCard
                title={t("Urgent")}
                description={t(
                  "Accelerated matching. If no direct match, the platform will trigger wider network outreach.",
                )}
                selected={urgency === "urgent"}
                tone="warning"
                onSelect={() => setUrgency("urgent")}
              />
            </div>

            {urgency === "urgent" ? (
              <div className="rounded-[10px] border border-[#ffd230] bg-[#fffbeb] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]">
                <div className="flex items-start gap-2 text-[#973c00]">
                  <AlertIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#e17100]" />
                  <div>
                    <p className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-[#7b3306]">
                      {t("Wider network outreach enabled")}
                    </p>
                    <p className="mt-1 text-xs leading-[19.5px] tracking-[-0.1172px]">
                      {t(
                        "When marked urgent and no direct match is found, the platform may automatically escalate your request to the extended network to find suitable capacity faster.",
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </form>
      </AvailabilitySurfaceCard>

      <AvailabilityActionBar
        t={t}
        backHref={APP_ROUTES.requestCapacityEquipmentStep2}
        nextHref={APP_ROUTES.requestCapacityEquipmentStep4}
        nextLabelKey="Continue"
        nextVariant="primary"
      />
    </AvailabilityPageShell>
  );
}
