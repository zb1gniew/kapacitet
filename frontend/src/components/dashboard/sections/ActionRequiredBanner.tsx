import Link from "next/link";
import type { DashboardActionBanner as DashboardActionBannerData } from "@/types/dashboard";
import { ArrowRightIcon } from "@/components/auth/icons";
import { SearchIcon, UploadIcon, WarningIcon } from "../icons";

type ActionRequiredBannerProps = {
  banner: DashboardActionBannerData | null;
};

function getBannerToneClasses(tone: DashboardActionBannerData["tone"]) {
  switch (tone) {
    case "success":
      return {
        section: "border-[#86efac] bg-[#f0fdf4]",
        icon: "bg-green-600 text-white",
        badge: "bg-green-600 text-white",
        timing: "text-green-900",
      };
    case "primary":
      return {
        section: "border-[#93c5fd] bg-[#eff6ff]",
        icon: "bg-blue-600 text-white",
        badge: "bg-blue-600 text-white",
        timing: "text-blue-900",
      };
    case "warning":
    default:
      return {
        section: "border-[#ffb900] bg-[#fffbeb]",
        icon: "bg-amber-500 text-white",
        badge: "bg-amber-500 text-white",
        timing: "text-amber-900",
      };
  }
}

function getBannerIcon(tone: DashboardActionBannerData["tone"]) {
  switch (tone) {
    case "success":
      return <UploadIcon className="h-4 w-4" />;
    case "primary":
      return <SearchIcon className="h-4 w-4" />;
    case "warning":
    default:
      return <WarningIcon className="h-4 w-4" />;
  }
}

export function ActionRequiredBanner({ banner }: ActionRequiredBannerProps) {
  if (!banner) {
    return null;
  }

  const toneClasses = getBannerToneClasses(banner.tone);
  const icon = getBannerIcon(banner.tone);

  return (
    <section
      className={`rounded-[10px] border px-4 py-3 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] ${toneClasses.section}`}
    >
      <div className="flex flex-wrap items-start gap-3">
        <div
          className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg ${toneClasses.icon}`}
        >
          {icon}
        </div>
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${toneClasses.badge}`}
            >
              {banner.badge}
            </span>
            <span className={`text-xs ${toneClasses.timing}`}>
              {banner.timing}
            </span>
          </div>
          <h2 className="mt-1 text-lg font-bold tracking-[-0.3125px] text-neutral-900">
            {banner.title}
          </h2>
          <p className="mt-1 text-sm text-neutral-700">{banner.description}</p>
          <Link
            href={banner.href}
            className="mt-3 inline-flex h-10 items-center gap-1 rounded-[8px] bg-neutral-950 px-4 text-sm font-medium text-white"
          >
            <span>{banner.cta}</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
