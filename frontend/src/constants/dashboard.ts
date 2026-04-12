import type {
  DashboardNavItem,
  DashboardQuickAction,
  DashboardWorkspace,
} from "@/types/dashboard";
import { APP_ROUTES } from "./routes";

const COMPANY_DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
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
  {
    key: "Network requests",
    icon: "matches",
    href: APP_ROUTES.networkRequests,
  },
  { key: "Matches", icon: "matches", href: APP_ROUTES.matches },
  { key: "Settings", icon: "settings", href: APP_ROUTES.settings },
];

const PLATFORM_DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { key: "Platform overview", icon: "home", href: APP_ROUTES.adminOverview },
  {
    key: "Access requests",
    icon: "admin",
    href: APP_ROUTES.adminAccessRequests,
  },
  {
    key: "Companies",
    icon: "companies",
    href: APP_ROUTES.adminCompanies,
  },
  { key: "Audit log", icon: "audit", href: APP_ROUTES.adminAudit },
  {
    key: "Platform settings",
    icon: "platform-settings",
    href: APP_ROUTES.adminPlatformSettings,
  },
];

export function getDashboardNavItems(
  workspace: DashboardWorkspace = "company",
): DashboardNavItem[] {
  return workspace === "platform"
    ? PLATFORM_DASHBOARD_NAV_ITEMS
    : COMPANY_DASHBOARD_NAV_ITEMS;
}

export const DASHBOARD_QUICK_ACTIONS: DashboardQuickAction[] = [
  {
    titleKey: "Declare availability",
    descriptionKey:
      "Share temporary worker capacity with your trusted network for specific time periods.",
    ctaKey: "Declare new availability",
    icon: "upload",
    href: APP_ROUTES.declareAvailabilityWorkersStep1,
  },
  {
    titleKey: "Request capacity",
    descriptionKey:
      "Request temporary workers when you need additional capacity for a specific period.",
    ctaKey: "Create new request",
    icon: "search",
    href: APP_ROUTES.requestCapacityWorkersStep1,
  },
];
