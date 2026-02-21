import Link from "next/link";
import { EyeIcon, BuildingIcon, ShieldIcon, ArrowRightIcon } from "@/components/auth/icons";
import { BellIcon, UserGearIcon } from "@/components/dashboard/icons";
import { SETTINGS_SECTIONS } from "@/constants/settings";
import type { SettingsSection, SettingsSectionKey } from "@/types/settings";
import type { TranslateFn } from "@/types/i18n";

type SettingsSectionNavigationProps = {
  t: TranslateFn;
  activeSection: SettingsSectionKey;
};

function SectionIcon({
  section,
  active,
}: {
  section: SettingsSection;
  active: boolean;
}) {
  const iconClass = active ? "text-blue-700" : "text-neutral-500";

  switch (section.icon) {
    case "company":
      return <BuildingIcon className={`h-[18px] w-[18px] ${iconClass}`} />;
    case "participation":
      return <EyeIcon className={`h-[18px] w-[18px] ${iconClass}`} />;
    case "privacy":
      return <ShieldIcon className={`h-[18px] w-[18px] ${iconClass}`} />;
    case "notifications":
      return <BellIcon className={`h-[18px] w-[18px] ${iconClass}`} />;
    default:
      return <UserGearIcon className={`h-[18px] w-[18px] ${iconClass}`} />;
  }
}

export function SettingsSectionNavigation({
  t,
  activeSection,
}: SettingsSectionNavigationProps) {
  return (
    <aside className="rounded-[14px] border border-neutral-200 bg-white p-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <nav className="space-y-1" aria-label={t("Settings sections")}
      >
        {SETTINGS_SECTIONS.map((section) => {
          const isActive = section.key === activeSection;

          return (
            <Link
              key={section.key}
              href={section.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-[44px] w-full items-center justify-between rounded-[10px] px-3 text-left transition ${
                isActive
                  ? "border border-[#bedbff] bg-[#eff6ff] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]"
                  : "hover:bg-neutral-100"
              }`}
            >
              <span className="flex items-center gap-3">
                <SectionIcon section={section} active={isActive} />
                <span
                  className={`text-sm leading-5 tracking-[-0.1504px] ${
                    isActive
                      ? "font-semibold text-[#1c398e]"
                      : "font-normal text-neutral-600"
                  }`}
                >
                  {t(section.labelKey)}
                </span>
              </span>

              {isActive ? (
                <ArrowRightIcon className="h-4 w-4 text-blue-700" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
