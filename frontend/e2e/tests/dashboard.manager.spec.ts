import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("/api/dashboard/matches", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  );
  await page.route("/api/dashboard/availability", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  );
  await page.route("/api/dashboard/requests", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  );
  await page.route("/api/dashboard/agreements", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  );
  await page.route("/api/notifications*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  );
});

test("authenticated manager lands on dashboard", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL("/dashboard");
});

test("dashboard shows sidebar navigation", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("link", { name: "Matches" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
});

test("manager cannot access admin pages", async ({ page }) => {
  await page.goto("/dashboard/admin");
  await page.waitForLoadState("networkidle");
  await expect(page).not.toHaveURL("/dashboard/admin");
});

test("matches page loads", async ({ page }) => {
  await page.route("/api/matches*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  );
  await page.route("/api/agreements*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  );

  await page.goto("/dashboard/matches");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL("/dashboard/matches");
});

test("settings page loads", async ({ page }) => {
  await page.route("/api/company/settings*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    }),
  );

  await page.goto("/dashboard/settings");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL("/dashboard/settings");
});
