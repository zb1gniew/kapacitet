import type { SettingsSection } from "@/types/settings";
import { APP_ROUTES } from "./routes";

export const SETTINGS_SECTIONS: ReadonlyArray<SettingsSection> = [
  {
    key: "companyInformation",
    labelKey: "Company information",
    icon: "company",
    href: APP_ROUTES.settings,
  },
  {
    key: "participationVisibility",
    labelKey: "Participation & visibility",
    icon: "participation",
    href: APP_ROUTES.settingsParticipationVisibility,
  },
  {
    key: "privacyDataBoundaries",
    labelKey: "Privacy & data boundaries",
    icon: "privacy",
    href: APP_ROUTES.settingsPrivacyDataBoundaries,
  },
  {
    key: "notifications",
    labelKey: "Notifications",
    icon: "notifications",
    href: APP_ROUTES.settingsNotifications,
  },
  {
    key: "accountAccess",
    labelKey: "Account & access",
    icon: "account",
    href: APP_ROUTES.settingsAccountAccess,
  },
];
