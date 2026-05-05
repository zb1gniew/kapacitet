import type { AuthenticatedUser } from "@/types/auth";

const PLATFORM_ADMIN_ROLES = new Set(["Admin", "OperatorAdmin"]);
const COMPANY_MANAGER_ROLES = new Set(["Admin", "Manager"]);

export function isPlatformAdmin(
  user?: Pick<AuthenticatedUser, "roles"> | null,
): boolean {
  return user?.roles?.some((role) => PLATFORM_ADMIN_ROLES.has(role)) ?? false;
}

export function isCompanyManager(
  user?: Pick<AuthenticatedUser, "appRole"> | null,
): boolean {
  return user?.appRole != null && COMPANY_MANAGER_ROLES.has(user.appRole);
}

export function isCompanyViewer(
  user?: Pick<AuthenticatedUser, "appRole"> | null,
): boolean {
  return user?.appRole === "Viewer";
}
