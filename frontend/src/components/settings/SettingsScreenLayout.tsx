import type { ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SettingsSectionNavigation } from "@/components/settings/SettingsSectionNavigation";
import type { AuthenticatedUser } from "@/types/auth";
import type { TranslateFn } from "@/types/i18n";
import type { SettingsSectionKey } from "@/types/settings";

type SettingsScreenLayoutProps = {
  user: AuthenticatedUser;
  t: TranslateFn;
  activeSection: SettingsSectionKey;
  children: ReactNode;
  dataNodeId: string;
  dataName?: string;
};

export function SettingsScreenLayout({
  user,
  t,
  activeSection,
  children,
  dataNodeId,
  dataName = "Settings",
}: SettingsScreenLayoutProps) {
  return (
    <main
      className="min-h-screen bg-[#f5f5f5]"
      data-name={dataName}
      data-node-id={dataNodeId}
    >
      <div className="flex min-h-screen flex-col lg:flex-row">
        <DashboardSidebar t={t} activeItemKey="Settings" />

        <div className="min-w-0 flex-1">
          <DashboardHeader t={t} user={user} showSignOut={false} />

          <div className="mx-auto w-full max-w-[1248px] p-4 sm:p-6 lg:p-8">
            <header>
              <h1 className="text-2xl font-bold leading-8 tracking-[0.0703px] text-neutral-900">
                {t("Settings")}
              </h1>
              <p className="mt-2 max-w-[930px] text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
                {t(
                  "Manage your company's participation, preferences, and account settings for the capacity coordination platform.",
                )}
              </p>
            </header>

            <section className="mt-6 grid gap-4 lg:grid-cols-[286px_minmax(0,1fr)] lg:items-start">
              <SettingsSectionNavigation t={t} activeSection={activeSection} />
              {children}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
