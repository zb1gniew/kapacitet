import type { ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import type { AuthenticatedUser } from "@/types/auth";
import type { DashboardNavItemKey } from "@/types/dashboard";
import type { TranslateFn } from "@/types/i18n";

type PlatformAdminLayoutProps = {
  user: AuthenticatedUser;
  t: TranslateFn;
  activeItemKey: DashboardNavItemKey;
  title: string;
  description: string;
  badge?: string;
  sidebarNote?: string;
  children: ReactNode;
  dataName: string;
  dataNodeId: string;
};

export function PlatformAdminLayout({
  user,
  t,
  activeItemKey,
  title,
  description,
  badge = "Operations overview",
  sidebarNote,
  children,
  dataName,
  dataNodeId,
}: PlatformAdminLayoutProps) {
  return (
    <main
      className="min-h-screen bg-[#f5f5f5]"
      data-name={dataName}
      data-node-id={dataNodeId}
    >
      <div className="flex min-h-screen flex-col lg:flex-row">
        <DashboardSidebar
          t={t}
          activeItemKey={activeItemKey}
          workspace="platform"
        />

        <div className="min-w-0 flex-1">
          <DashboardHeader t={t} user={user} />

          <div className="mx-auto w-full max-w-[1248px] p-4 sm:p-6 lg:p-8">
            <section className="rounded-[18px] border border-neutral-200 bg-white p-6 shadow-[0_25px_50px_rgba(0,0,0,0.18)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-[760px]">
                  <div className="inline-flex items-center rounded-full border border-[#bedbff] bg-[#eff6ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#1c398e]">
                    {badge}
                  </div>
                  <h1 className="mt-4 text-[28px] font-bold leading-9 tracking-[-0.4492px] text-neutral-900">
                    {title}
                  </h1>
                  <p className="mt-3 text-sm leading-[24px] tracking-[-0.1504px] text-neutral-600">
                    {description}
                  </p>
                </div>

                {sidebarNote ? (
                  <div className="rounded-[14px] border border-[#dbeafe] bg-[#f8fbff] px-4 py-3 text-sm text-[#1e3a8a] shadow-[0_10px_15px_rgba(0,0,0,0.08),0_4px_6px_rgba(0,0,0,0.08)]">
                    <p className="font-semibold">Current focus</p>
                    <p className="mt-1 leading-[22.75px] tracking-[-0.1504px]">
                      {sidebarNote}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
