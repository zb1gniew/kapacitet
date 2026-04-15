"use client";

import { useEffect, useMemo, useState } from "react";
import { PreferenceToggleField } from "@/components/admin/platform/PreferenceToggleField";
import { PlatformAdminLayout } from "@/components/admin/platform/PlatformAdminLayout";
import { PlatformSummaryCard } from "@/components/admin/platform/PlatformSummaryCard";
import { PlatformSurfaceCard } from "@/components/admin/platform/PlatformSurfaceCard";
import { useAdminAccessRequests } from "@/hooks/useAdminAccessRequests";
import {
  DEFAULT_PLATFORM_ADMIN_PREFERENCES,
  usePlatformAdminPreferences,
} from "@/hooks/usePlatformAdminPreferences";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";
import type {
  AccessRequestFilterTab,
  AuditEventFilterTab,
  PlatformAdminPreferences,
} from "@/types/admin";

type PlatformSettingsScreenProps = {
  user: AuthenticatedUser;
};

export function PlatformSettingsScreen({ user }: PlatformSettingsScreenProps) {
  const { t } = useLocalizedScreen();
  const { requests } = useAdminAccessRequests();
  const { preferences, errorMessage, updatePreferences, resetPreferences } =
    usePlatformAdminPreferences();
  const [draft, setDraft] = useState<PlatformAdminPreferences | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => setToastMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const currentDraft = draft ?? preferences;

  const metrics = useMemo(() => {
    const pendingCount = requests.filter(
      (request) => request.status === "Pending",
    ).length;
    const followUpCount = requests.filter(
      (request) =>
        request.status === "Approved" && !request.provisionedCompanyId,
    ).length;

    return [
      {
        label: t("Approval flow"),
        value: t("Manual"),
        helper: t("Every company request currently requires admin review."),
        tone: "blue" as const,
      },
      {
        label: t("Pending queue"),
        value: String(pendingCount),
        helper: t("Requests currently waiting in the review queue."),
        tone: "amber" as const,
      },
      {
        label: t("Provisioning mode"),
        value: t("Hybrid"),
        helper: t("DB provisioning plus Keycloak account activation."),
        tone: "green" as const,
      },
      {
        label: t("Follow-up items"),
        value: String(followUpCount),
        helper: t("Approved requests that still need provisioning attention."),
        tone: "slate" as const,
      },
    ];
  }, [requests, t]);

  async function handleSave() {
    try {
      await updatePreferences(currentDraft);
      setToastMessage(t("Admin workspace preferences saved."));
    } catch (error) {
      setToastMessage(
        error instanceof Error
          ? error.message
          : t("Unable to save admin workspace preferences."),
      );
    }
  }

  async function handleReset() {
    try {
      await resetPreferences();
      setDraft(DEFAULT_PLATFORM_ADMIN_PREFERENCES);
      setToastMessage(t("Admin workspace preferences reset."));
    } catch (error) {
      setToastMessage(
        error instanceof Error
          ? error.message
          : t("Unable to reset admin workspace preferences."),
      );
    }
  }

  return (
    <PlatformAdminLayout
      user={user}
      t={t}
      activeItemKey="Platform settings"
      title={t("Platform settings")}
      description={t(
        "Configure operational preferences for the admin workspace and keep the platform review flow aligned with how you work.",
      )}
      sidebarNote={t(
        "These settings focus on the admin workspace itself: which views open by default, how follow-up work is prioritized, and which alerts are emphasized.",
      )}
      dataName="Platform Settings"
      dataNodeId="platform-settings"
    >
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <PlatformSummaryCard key={metric.label} {...metric} />
        ))}
      </section>

      {toastMessage ? (
        <div className="mt-4 rounded-[12px] border border-[#b9f8cf] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
          {toastMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-[12px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
          {errorMessage}
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <PlatformSurfaceCard
          eyebrow={t("Review defaults")}
          title={t("Admin workflow defaults")}
          description={t(
            "These preferences control how the admin workspace opens and how follow-up work is prioritized on the platform pages.",
          )}
        >
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-neutral-900">
                {t("Default access requests tab")}
              </span>
              <select
                value={currentDraft.defaultAccessRequestsTab}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...(current ?? currentDraft),
                    defaultAccessRequestsTab: event.target
                      .value as AccessRequestFilterTab,
                  }))
                }
                className="mt-2 h-12 w-full rounded-[12px] border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] outline-none transition focus:border-blue-600"
              >
                <option value="Pending">{t("Pending")}</option>
                <option value="All">{t("All")}</option>
                <option value="Approved">{t("Approved")}</option>
                <option value="Rejected">{t("Rejected")}</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-neutral-900">
                {t("Default audit view")}
              </span>
              <select
                value={currentDraft.defaultAuditFilter}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...(current ?? currentDraft),
                    defaultAuditFilter: event.target
                      .value as AuditEventFilterTab,
                  }))
                }
                className="mt-2 h-12 w-full rounded-[12px] border border-neutral-300 bg-white px-4 text-sm text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] outline-none transition focus:border-blue-600"
              >
                <option value="All">{t("All events")}</option>
                <option value="Submissions">{t("Submissions")}</option>
                <option value="Decisions">{t("Decisions")}</option>
                <option value="Provisioning">{t("Provisioning")}</option>
              </select>
            </label>
          </div>
        </PlatformSurfaceCard>

        <PlatformSurfaceCard
          eyebrow={t("Workspace preferences")}
          title={t("Saved admin behavior")}
          description={t(
            "These controls are saved for the current admin workspace and are applied when the platform pages load.",
          )}
        >
          <div className="space-y-4">
            <PreferenceToggleField
              label={t("Prioritize follow-up companies")}
              description={t(
                "Show companies that still need provisioning attention before fully provisioned records in the company registry.",
              )}
              checked={currentDraft.prioritizeFollowUpCompanies}
              onChange={(checked) =>
                setDraft((current) => ({
                  ...(current ?? currentDraft),
                  prioritizeFollowUpCompanies: checked,
                }))
              }
            />
            <PreferenceToggleField
              label={t("Highlight provisioning alerts on overview")}
              description={t(
                "Keep provisioning-related alerts emphasized in the platform overview cards.",
              )}
              checked={currentDraft.highlightProvisioningAlerts}
              onChange={(checked) =>
                setDraft((current) => ({
                  ...(current ?? currentDraft),
                  highlightProvisioningAlerts: checked,
                }))
              }
            />
          </div>
        </PlatformSurfaceCard>
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#1d4ed8] px-5 text-sm font-semibold text-white shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] transition hover:bg-[#1e40af]"
        >
          {t("Save preferences")}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex h-11 items-center justify-center rounded-[10px] border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          {t("Reset to defaults")}
        </button>
      </section>
    </PlatformAdminLayout>
  );
}
