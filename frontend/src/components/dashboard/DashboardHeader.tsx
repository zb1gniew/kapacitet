import { APP_ROUTES } from "@/constants/routes";
import { isPlatformAdmin } from "@/lib/auth/roles";
import type { AuthenticatedUser } from "@/types/auth";
import type { TranslateFn } from "@/types/i18n";
import { BellIcon } from "./icons";

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
  const roleBadge = isPlatformAdmin(user) ? "Platform admin" : "Company user";

  return (
    <header className="border-b border-[#45556c66] bg-[linear-gradient(to_right,#314158_0%,#43536a_35%,#8693a3_70%,#f5f5f5_100%)] px-5 py-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold tracking-[-0.3125px] text-neutral-100">
            KapacitetNet
          </h1>
          <span className="text-base text-[#62748e]">·</span>
          <span className="text-sm text-[#90a1b9]">
            {t("Capacity coordination")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-[10px] border border-[#62748e4d] bg-[#45556c66] px-4 py-2">
            <p className="text-[10px] uppercase tracking-[0.05em] text-[#90a1b9]">
              {t("Logged in as")}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm font-medium text-[#f5f5f5]">
                {getDisplayName(user)}
              </p>
              <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                {t(roleBadge)}
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

          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-neutral-300 bg-[#d4d4d4] text-[#525252] shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)]"
            aria-label={t("Notifications")}
          >
            <BellIcon className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border border-white bg-red-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
