export type DashboardNavIconKey =
  | "home"
  | "upload"
  | "search"
  | "matches"
  | "settings"
  | "admin"
  | "companies"
  | "audit"
  | "platform-settings";

export type DashboardNavItemKey =
  | "Home"
  | "Declare availability"
  | "Request capacity"
  | "Network requests"
  | "Matches"
  | "Settings"
  | "Platform overview"
  | "Access requests"
  | "Companies"
  | "Audit log"
  | "Platform settings";

export type DashboardWorkspace = "company" | "platform";

export type DashboardMetricIconKey = "users" | "search" | "warning";
export type DashboardActionIconKey = "upload" | "search";
export type DashboardTone = "success" | "primary" | "danger" | "neutral";
export type DashboardBannerTone = "success" | "primary" | "warning";

export type DashboardNavItem = {
  key: DashboardNavItemKey;
  icon: DashboardNavIconKey;
  href: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
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
  id: number;
  kind: "request" | "availability";
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  statusTone: DashboardTone;
  cta: string;
  href: string;
};

export type DashboardReminder = {
  title: string;
  description: string;
  date: string;
  tone: Exclude<DashboardTone, "neutral">;
};

export type DashboardActionBanner = {
  id: number;
  kind: "request" | "availability";
  tone: DashboardBannerTone;
  badge: string;
  timing: string;
  title: string;
  description: string;
  cta: string;
  href: string;
};

export type DashboardData = {
  metrics: DashboardMetric[];
  processes: DashboardProcess[];
  reminders: DashboardReminder[];
  banner: DashboardActionBanner | null;
};
