import type { DashboardData } from "@/types/dashboard";
import type { TranslateFn } from "@/types/i18n";
import { SectionIntro } from "./SectionIntro";

type PlatformOverviewPanelProps = {
  t: TranslateFn;
  dashboard: DashboardData;
  loading: boolean;
};

const PLATFORM_OVERVIEW_ITEMS = [
  {
    title: "Platform purpose",
    description:
      "Coordinate temporary labour capacity between trusted companies without exposing worker identities or losing operational control.",
  },
  {
    title: "How matching works",
    description:
      "Availability and demand are published into the network, reviewed through structured match states, and confirmed before cooperation begins.",
  },
  {
    title: "What this dashboard shows",
    description:
      "A live overview of published availability, active requests, match progress, deadlines, and the coordination status of your company on the platform.",
  },
] as const;

function PlatformWorkspaceSummary({
  t,
  dashboard,
  loading,
}: PlatformOverviewPanelProps) {
  return (
    <div className="rounded-[12px] border border-[#cfe0fb] bg-[#ffffffcc] px-4 py-3 backdrop-blur-sm lg:min-w-[280px]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5a78a3]">
        {t("Current workspace")}
      </p>
      <p className="mt-1 text-sm font-medium text-[#163766]">
        {loading ? "..." : (dashboard.processes[0]?.title ?? t("Coordination overview"))}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#5a78a3]">
        {loading
          ? "..."
          : (dashboard.banner?.description ??
            t(
              "Use this dashboard to publish activity, track deadlines, and manage live coordination across your network.",
            ))}
      </p>
    </div>
  );
}

export function PlatformOverviewPanel({
  t,
  dashboard,
  loading,
}: PlatformOverviewPanelProps) {
  return (
    <section className="rounded-[16px] border border-[#d7e7ff] bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] px-5 py-5 shadow-[0_12px_24px_rgba(59,130,246,0.08),0_4px_10px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-[720px]">
          <SectionIntro
            eyebrow={t("Platform overview")}
            title={t("Purpose-built for trusted capacity coordination")}
            description={t(
              "KapacitetNet is designed for companies that need to share temporary workforce capacity, request support from trusted partners, and keep matching activity inside one controlled network process.",
            )}
            eyebrowClassName="text-[#4f6b95]"
            titleClassName="text-[20px] tracking-[-0.03em] text-[#163766]"
            descriptionClassName="text-sm leading-6 text-[#3f5d85]"
          />
        </div>

        <PlatformWorkspaceSummary
          t={t}
          dashboard={dashboard}
          loading={loading}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {PLATFORM_OVERVIEW_ITEMS.map((item) => (
          <article
            key={item.title}
            className="rounded-[12px] border border-[#cfe0fb] bg-[#ffffffb8] px-4 py-3 backdrop-blur-sm"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5a78a3]">
              {t(item.title)}
            </p>
            <p className="mt-1 text-sm text-[#315178]">{t(item.description)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
