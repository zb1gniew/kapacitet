import { APP_ROUTES } from "@/constants/routes";
import { isPlatformAdmin } from "@/lib/auth/roles";
import type { AuthenticatedUser } from "@/types/auth";
import type { TranslateFn } from "@/types/i18n";
import { BrandIcon } from "../auth/icons";
import { NotificationBell } from "./NotificationBell";

type DashboardHeaderProps = {
  t: TranslateFn;
  user: AuthenticatedUser;
  showSignOut?: boolean;
};

function getDisplayName(user: AuthenticatedUser): string {
  return user.name || user.preferredUsername || user.email || user.sub;
}

export function DashboardHeader({
  t,
  user,
  showSignOut = true,
}: DashboardHeaderProps) {
  const roleBadge = isPlatformAdmin(user)
    ? t("Platform admin")
    : user.appRole === "Admin"
      ? t("Company admin")
      : user.appRole === "Manager"
        ? t("Company manager")
        : user.appRole === "Viewer"
          ? t("Company viewer")
          : t("Company user");

  return (
    <header className="border-b border-[#45556c66] bg-[linear-gradient(to_right,#314158_0%,#43536a_35%,#8693a3_70%,#f5f5f5_100%)] px-5 py-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white p-1.5 shadow-[0_10px_20px_rgba(0,0,0,0.18)]">
            <BrandIcon className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold leading-6 tracking-[-0.06em] text-white">
              {t("KapacitetNet")}
            </h1>
            <p className="text-xs font-medium text-[#a7f3d0]">
              {t("Capacity coordination")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-[10px] border border-[#62748e4d] bg-[#45556c66] px-4 py-2">
            <p className="text-[10px] uppercase tracking-[0.08em] text-white/60">
              {t("Logged in as")}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm font-medium text-[#f5f5f5]">
                {getDisplayName(user)}
              </p>
              <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                {roleBadge}
              </span>
              {showSignOut ? (
                <form action={APP_ROUTES.authLogoutApi} method="post">
                  <button
                    type="submit"
                    className="rounded-md border border-[#62748e66] px-2 py-0.5 text-[10px] font-semibold text-[#e2e8f0] hover:bg-[#33415580]"
                  >
                    {t("Sign out")}
                  </button>
                </form>
              ) : null}
            </div>
          </div>

          <NotificationBell ariaLabel={t("Notifications")} />
        </div>
      </div>
    </header>
  );
}
