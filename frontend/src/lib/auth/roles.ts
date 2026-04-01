import type { AuthenticatedUser } from "@/types/auth";

const PLATFORM_ADMIN_ROLES = new Set(["Admin", "OperatorAdmin"]);

export function isPlatformAdmin(
  user?: Pick<AuthenticatedUser, "roles"> | null,
): boolean {
  return user?.roles?.some((role) => PLATFORM_ADMIN_ROLES.has(role)) ?? false;
}
