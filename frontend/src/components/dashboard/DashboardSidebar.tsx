import Link from "next/link";
import { BrandIcon } from "@/components/auth/icons";
import { DASHBOARD_NAV_ITEMS } from "@/constants/dashboard";
import type { DashboardNavItem, DashboardNavItemKey } from "@/types/dashboard";
import type { TranslateFn } from "@/types/i18n";
import {
  ChartNodesIcon,
  CogIcon,
  HomeIcon,
  SearchIcon,
  UploadIcon,
} from "./icons";

type DashboardSidebarProps = {
  t: TranslateFn;
  activeItemKey: DashboardNavItemKey;
};

function getNavIcon(item: DashboardNavItem) {
  switch (item.icon) {
    case "home":
      return HomeIcon;
    case "upload":
      return UploadIcon;
    case "search":
      return SearchIcon;
    case "matches":
      return ChartNodesIcon;
    case "settings":
      return CogIcon;
    default:
      return HomeIcon;
  }
}

export function DashboardSidebar({ t, activeItemKey }: DashboardSidebarProps) {
  return (
    <aside className="flex w-full flex-col bg-gradient-to-b from-[#314158] to-[#1d293d] text-[#cad5e2] shadow-[0_20px_25px_rgba(0,0,0,0.1),0_8px_10px_rgba(0,0,0,0.1)] lg:w-72">
      <div className="border-b border-[#45556c80] px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-blue-600 text-white shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
            <BrandIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold leading-[22.5px] tracking-[-0.4395px] text-neutral-100">
              KapacitetNet
            </p>
            <p className="text-xs text-[#90a1b9]">
              {t("Capacity coordination")}
            </p>
          </div>
        </div>
      </div>

      <nav className="grid gap-2 px-5 py-6">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const Icon = getNavIcon(item);
          const isActive = item.key === activeItemKey;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`relative flex h-[52px] items-center gap-4 rounded-[10px] px-4 text-left transition ${
                isActive
                  ? "bg-blue-600 text-[#fafafa] shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]"
                  : "text-[#90a1b9] hover:bg-[#45556c33]"
              }`}
            >
              {isActive ? (
                <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 bg-[#51a2ff]" />
              ) : null}
              <Icon className="h-[22px] w-[22px]" />
              <span className="text-[15px] font-medium leading-[24.375px] tracking-[-0.2344px]">
                {t(item.key)}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[#45556c80] px-6 py-4">
        <p className="text-xs text-[#62748e]">{t("Platform version")}</p>
        <p className="mt-1 text-sm tracking-[-0.1504px] text-[#cad5e2]">
          2.4.1
        </p>
      </div>
    </aside>
  );
}
