export type DashboardNavIconKey =
  | "home"
  | "upload"
  | "search"
  | "matches"
  | "settings"
  | "admin";

export type DashboardNavItemKey =
  | "Home"
  | "Declare availability"
  | "Request capacity"
  | "Matches"
  | "Settings"
  | "Access requests";

export type DashboardMetricIconKey = "users" | "search" | "warning";
export type DashboardActionIconKey = "upload" | "search";
export type DashboardTone = "success" | "primary" | "danger" | "neutral";

export type DashboardNavItem = {
  key: DashboardNavItemKey;
  icon: DashboardNavIconKey;
  href: string;
};

export type DashboardMetric = {
  labelKey: string;
  valueKey: string;
  icon: DashboardMetricIconKey;
  tone: Exclude<DashboardTone, "neutral">;
  highlighted?: boolean;
};

export type DashboardQuickAction = {
  titleKey: string;
  descriptionKey: string;
  ctaKey: string;
  icon: DashboardActionIconKey;
  href: string;
};

export type DashboardProcess = {
  titleKey: string;
  subtitleKey: string;
  metaKey: string;
  statusKey: string;
  statusTone: DashboardTone;
  ctaKey: string;
};

export type DashboardReminder = {
  titleKey: string;
  descriptionKey: string;
  dateKey: string;
  tone: Exclude<DashboardTone, "neutral">;
};

export type DashboardActionBanner = {
  badgeKey: string;
  timingKey: string;
  titleKey: string;
  descriptionKey: string;
  ctaKey: string;
};
