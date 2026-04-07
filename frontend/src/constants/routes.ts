export const APP_ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  matches: "/dashboard/matches",
  declareAvailabilityWorkersStep1:
    "/dashboard/declare-availability/workers/step-1",
  declareAvailabilityWorkersStep2:
    "/dashboard/declare-availability/workers/step-2",
  declareAvailabilityWorkersStep3:
    "/dashboard/declare-availability/workers/step-3",
  declareAvailabilityWorkersStep4:
    "/dashboard/declare-availability/workers/step-4",
  requestCapacityWorkersStep1: "/dashboard/request-capacity/workers/step-1",
  requestCapacityWorkersStep2: "/dashboard/request-capacity/workers/step-2",
  requestCapacityWorkersStep3: "/dashboard/request-capacity/workers/step-3",
  requestCapacityWorkersStep4: "/dashboard/request-capacity/workers/step-4",
  settings: "/dashboard/settings",
  settingsParticipationVisibility:
    "/dashboard/settings/participation-visibility",
  settingsPrivacyDataBoundaries: "/dashboard/settings/privacy-data-boundaries",
  settingsNotifications: "/dashboard/settings/notifications",
  settingsAccountAccess: "/dashboard/settings/account-access",
  adminOverview: "/dashboard/admin",
  adminAccessRequests: "/dashboard/admin/access-requests",
  adminCompanies: "/dashboard/admin/companies",
  adminAudit: "/dashboard/admin/audit",
  adminPlatformSettings: "/dashboard/admin/platform-settings",
  requestAccess: "/request-access",
  onboardingWelcome: "/onboarding/welcome",
  onboardingCompanyDetails: "/onboarding/company-details",
  onboardingFirstAction: "/onboarding/first-action",
  authLoginApi: "/api/auth/login",
  authCallbackApi: "/api/auth/callback",
  authLogoutApi: "/api/auth/logout",
  authMeApi: "/api/auth/me",
} as const;
