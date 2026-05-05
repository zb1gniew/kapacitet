import { defineConfig, devices } from "@playwright/test";

// When PLAYWRIGHT_BASE_URL is set, assume the full stack is already running
// (e.g. docker compose up). Otherwise, Playwright starts Next.js locally.
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const useExternalStack = !!process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    ignoreHTTPSErrors: true,
  },

  // Auto-start Next.js dev server when running locally without docker compose.
  // Authenticated tests still need Redis — run `docker compose up redis` or
  // the full stack for those.
  webServer: useExternalStack
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
        env: {
          OIDC_ISSUER_URL: "http://localhost:8080/realms/kapacitet",
          OIDC_SERVER_ISSUER_URL: "http://localhost:8080/realms/kapacitet",
          OIDC_CLIENT_ID: "kapacitet-app",
          AUTH_SESSION_SECRET: "playwright-local-dev-secret-not-for-production",
          AUTH_COOKIE_SECURE: "false",
          APP_PUBLIC_URL: "http://localhost:3000",
          BACKEND_API_URL: "http://localhost:5000",
          REDIS_URL: "redis://localhost:6379",
          ENABLE_TEST_AUTH: "true",
        },
      },

  projects: [
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "unauthenticated",
      testMatch: /\.public\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "manager",
      testMatch: /\.manager\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/manager.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "admin",
      testMatch: /\.admin\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
    },
  ],
});
