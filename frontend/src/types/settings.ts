export type SettingsSectionKey =
  | "companyInformation"
  | "participationVisibility"
  | "privacyDataBoundaries"
  | "notifications"
  | "accountAccess";

export type SettingsSectionIcon =
  | "company"
  | "participation"
  | "privacy"
  | "notifications"
  | "account";

export type SettingsSection = {
  key: SettingsSectionKey;
  labelKey: string;
  icon: SettingsSectionIcon;
  href: string;
};
