"use client";

import { useEffect, useState } from "react";
import { CircleCheckIcon } from "@/components/auth/icons";
import type { TranslateFn } from "@/types/i18n";
import { SettingsPreferenceCard } from "./SettingsPreferenceCard";

type SettingsParticipationVisibilityCardProps = {
  t: TranslateFn;
};

type ParticipationSettings = {
  receiveCapacityRequests: boolean;
  participateInNetworkWide: boolean;
  allowPartialMatches: boolean;
};

const DEFAULT: ParticipationSettings = {
  receiveCapacityRequests: true,
  participateInNetworkWide: true,
  allowPartialMatches: false,
};

export function SettingsParticipationVisibilityCard({
  t,
}: SettingsParticipationVisibilityCardProps) {
  const [settings, setSettings] = useState<ParticipationSettings>(DEFAULT);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/company/settings")
      .then((r) => r.json())
      .then((data: ParticipationSettings) => {
        setSettings(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function toggle(field: keyof ParticipationSettings) {
    setSettings((prev) => ({ ...prev, [field]: !prev[field] }));
    setStatus("idle");
  }

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/company/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      setStatus(res.ok ? "saved" : "error");
      if (res.ok) {
        const updated: ParticipationSettings = await res.json();
        setSettings(updated);
      }
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-[14px] border border-neutral-200 bg-white p-6 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
        {t("Participation & visibility")}
      </h2>
      <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
        {t(
          "Control how your company participates in the capacity coordination network and what types of requests you receive.",
        )}
      </p>

      <div
        className={`mt-5 space-y-3 ${!loaded ? "opacity-50 pointer-events-none" : ""}`}
      >
        <SettingsPreferenceCard
          title={t("Receive capacity requests")}
          description={t(
            "Allow other companies in your network to send capacity requests that match your declared availability. You can review and respond to each request individually.",
          )}
          checked={settings.receiveCapacityRequests}
          onToggle={() => toggle("receiveCapacityRequests")}
          t={t}
        />

        <SettingsPreferenceCard
          title={t("Participate in network-wide requests")}
          description={t(
            "When urgent requests are escalated to the extended network, your company will be included in automated matching even if you haven't declared specific availability.",
          )}
          checked={settings.participateInNetworkWide}
          onToggle={() => toggle("participateInNetworkWide")}
          t={t}
          noteKey="Network requests are only sent when no direct matches are found and the requesting company has marked their need as urgent."
        />

        <SettingsPreferenceCard
          title={t("Allow partial matches")}
          description={t(
            "Allow the platform to suggest partial matches when you cannot fulfill the complete request (e.g., 2 workers available when 3 are requested).",
          )}
          checked={settings.allowPartialMatches}
          onToggle={() => toggle("allowPartialMatches")}
          t={t}
        />
      </div>

      {status === "saved" && (
        <p className="mt-3 text-sm font-medium text-green-600">
          {t("Preferences saved.")}
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 text-sm font-medium text-red-600">
          {t("Failed to save. Please try again.")}
        </p>
      )}

      <div className="mt-5 border-t border-neutral-200 pt-4">
        <button
          type="button"
          disabled={saving || !loaded}
          onClick={handleSave}
          className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-blue-600 px-4 text-sm font-semibold tracking-[-0.1504px] text-white shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] transition hover:bg-blue-700 disabled:opacity-60"
        >
          <CircleCheckIcon className="h-4 w-4" />
          {saving ? t("Saving…") : t("Save preferences")}
        </button>
      </div>
    </article>
  );
}
