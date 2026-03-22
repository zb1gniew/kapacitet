import type {
  DashboardActionBanner,
  DashboardMetric,
  DashboardNavItem,
  DashboardProcess,
  DashboardQuickAction,
  DashboardReminder,
} from "@/types/dashboard";
import { APP_ROUTES } from "./routes";

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { key: "Home", icon: "home", href: APP_ROUTES.dashboard },
  {
    key: "Declare availability",
    icon: "upload",
    href: APP_ROUTES.declareAvailabilityWorkersStep1,
  },
  {
    key: "Request capacity",
    icon: "search",
    href: APP_ROUTES.requestCapacityWorkersStep1,
  },
  { key: "Matches", icon: "matches", href: APP_ROUTES.matches },
  { key: "Settings", icon: "settings", href: APP_ROUTES.settings },
];

export const DASHBOARD_ACTION_BANNER: DashboardActionBanner = {
  badgeKey: "Action required",
  timingKey: "Starts in 5 days",
  titleKey:
    "Scaffolding equipment request starts Feb 15 - No confirmed match yet",
  descriptionKey:
    "Your capacity request begins soon but matching is still in progress. Consider expanding search criteria or contacting network companies directly.",
  ctaKey: "View and take action",
};

export const DASHBOARD_METRICS: DashboardMetric[] = [
  {
    labelKey: "Declared availability",
    valueKey: "3 Active",
    icon: "users",
    tone: "success",
  },
  {
    labelKey: "Declared needs",
    valueKey: "2 Searching",
    icon: "search",
    tone: "primary",
  },
  {
    labelKey: "Actions needed",
    valueKey: "1 Requires response",
    icon: "warning",
    tone: "danger",
    highlighted: true,
  },
];

export const DASHBOARD_QUICK_ACTIONS: DashboardQuickAction[] = [
  {
    titleKey: "Declare availability",
    descriptionKey:
      "Share temporary workers or equipment capacity with your trusted network for specific time periods.",
    ctaKey: "Declare new availability",
    icon: "upload",
    href: APP_ROUTES.declareAvailabilityWorkersStep1,
  },
  {
    titleKey: "Request capacity",
    descriptionKey:
      "Request temporary workers or equipment when you need additional capacity for a specific period.",
    ctaKey: "Create new request",
    icon: "search",
    href: APP_ROUTES.requestCapacityWorkersStep1,
  },
];

export const DASHBOARD_PROCESSES: DashboardProcess[] = [
  {
    titleKey: "Welding specialists",
    subtitleKey: "2 potential matches from network companies",
    metaKey: "Updated 12 min ago",
    statusKey: "Direct match found",
    statusTone: "success",
    ctaKey: "View matches",
  },
  {
    titleKey: "Assembly technicians",
    subtitleKey: "System analyzing network capacity",
    metaKey: "Started today",
    statusKey: "Matching in progress",
    statusTone: "primary",
    ctaKey: "View details",
  },
  {
    titleKey: "Mobile crane",
    subtitleKey: "Request shared with 8 network companies",
    metaKey: "Sent yesterday",
    statusKey: "Network request sent",
    statusTone: "neutral",
    ctaKey: "View",
  },
];

export const DASHBOARD_REMINDERS: DashboardReminder[] = [
  {
    titleKey: "Availability expiring",
    descriptionKey: "Electrical engineers capacity ends in 3 days",
    dateKey: "Feb 13, 2026",
    tone: "success",
  },
  {
    titleKey: "Request start date",
    descriptionKey: "Scaffolding equipment needed period begins",
    dateKey: "Feb 15, 2026",
    tone: "primary",
  },
  {
    titleKey: "Response deadline",
    descriptionKey: "Pending match response expires soon",
    dateKey: "Feb 12, 2026",
    tone: "danger",
  },
];
