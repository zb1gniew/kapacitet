"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CircleCheckIcon, EmailIcon } from "@/components/auth/icons";
import { BellIcon } from "@/components/dashboard/icons";
import type { TranslateFn } from "@/types/i18n";
import { SettingsPreferenceCard } from "./SettingsPreferenceCard";

type SettingsNotificationsCardProps = {
  t: TranslateFn;
};

type NotificationPreferences = {
  emailNewMatches: boolean;
  emailActionsRequired: boolean;
  emailUpcomingCooperation: boolean;
  inAppNewMatches: boolean;
  inAppActionsRequired: boolean;
  inAppUpcomingCooperation: boolean;
};

const DEFAULT: NotificationPreferences = {
  emailNewMatches: true,
  emailActionsRequired: true,
  emailUpcomingCooperation: true,
  inAppNewMatches: true,
  inAppActionsRequired: true,
  inAppUpcomingCooperation: true,
};

function GroupLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-neutral-500">{icon}</span>
      <h3 className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
        {label}
      </h3>
    </div>
  );
}

export function SettingsNotificationsCard({
  t,
}: SettingsNotificationsCardProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/company/notifications")
      .then((r) => r.json())
      .then((data: NotificationPreferences) => {
        setPrefs(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function toggle(field: keyof NotificationPreferences) {
    setPrefs((prev) => ({ ...prev, [field]: !prev[field] }));
    setStatus("idle");
  }

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/company/notifications", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(prefs),
      });
      setStatus(res.ok ? "saved" : "error");
      if (res.ok) {
        const updated: NotificationPreferences = await res.json();
        setPrefs(updated);
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
        {t("Notifications")}
      </h2>
      <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
        {t(
          "Configure how and when you receive notifications about matches, required actions, and upcoming cooperation periods.",
        )}
      </p>

      <div
        className={`mt-5 space-y-4 ${!loaded ? "opacity-50 pointer-events-none" : ""}`}
      >
        <section>
          <GroupLabel
            icon={<EmailIcon className="h-4 w-4" />}
            label={t("Email notifications")}
          />
          <div className="mt-2 space-y-2">
            <SettingsPreferenceCard
              title={t("New matches available")}
              description={t(
                "Receive email when the platform finds capacity matches for your requests",
              )}
              checked={prefs.emailNewMatches}
              onToggle={() => toggle("emailNewMatches")}
              t={t}
            />
            <SettingsPreferenceCard
              title={t("Actions required")}
              description={t(
                "Get notified when you need to respond to offers, confirmations, or expiring requests",
              )}
              checked={prefs.emailActionsRequired}
              onToggle={() => toggle("emailActionsRequired")}
              t={t}
            />
            <SettingsPreferenceCard
              title={t("Upcoming cooperation periods")}
              description={t(
                "Reminders 48 hours before confirmed cooperation begins",
              )}
              checked={prefs.emailUpcomingCooperation}
              onToggle={() => toggle("emailUpcomingCooperation")}
              t={t}
            />
          </div>
        </section>

        <section>
          <GroupLabel
            icon={<BellIcon className="h-4 w-4" />}
            label={t("In-app notifications")}
          />
          <div className="mt-2 space-y-2">
            <SettingsPreferenceCard
              title={t("New matches available")}
              description={t(
                "Show notification badge when new matches are ready for review",
              )}
              checked={prefs.inAppNewMatches}
              onToggle={() => toggle("inAppNewMatches")}
              t={t}
            />
            <SettingsPreferenceCard
              title={t("Actions required")}
              description={t(
                "Alert when responses or confirmations are needed",
              )}
              checked={prefs.inAppActionsRequired}
              onToggle={() => toggle("inAppActionsRequired")}
              t={t}
            />
            <SettingsPreferenceCard
              title={t("Upcoming cooperation periods")}
              description={t(
                "In-app reminders for upcoming cooperation start dates",
              )}
              checked={prefs.inAppUpcomingCooperation}
              onToggle={() => toggle("inAppUpcomingCooperation")}
              t={t}
            />
          </div>
        </section>
      </div>

      {status === "saved" && (
        <p className="mt-3 text-sm font-medium text-green-600">
          {t("Notification preferences saved.")}
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
          {saving ? t("Saving…") : t("Save notification preferences")}
        </button>
      </div>
    </article>
  );
}
