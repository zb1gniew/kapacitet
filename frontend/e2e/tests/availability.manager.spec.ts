import { expect, test } from "@playwright/test";

const SKILLS_RESPONSE = [
  { id: 1, name: "Elektrikere" },
  { id: 2, name: "VVS-installatører" },
];

const CERTIFICATES_RESPONSE = [{ id: 1, name: "Truck certifikat" }];

const HINTS_RESPONSE = { estimatedMatches: 3 };

test.beforeEach(async ({ page }) => {
  await page.route("/api/catalog/skills", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(SKILLS_RESPONSE),
    }),
  );
  await page.route("/api/catalog/certificates", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(CERTIFICATES_RESPONSE),
    }),
  );
  await page.route("/api/workflows/availability-hints", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(HINTS_RESPONSE),
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

test("step 1 loads availability wizard", async ({ page }) => {
  await page.goto("/dashboard/declare-availability/workers/step-1");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(
    "/dashboard/declare-availability/workers/step-1",
  );
  await expect(
    page.getByRole("heading", { name: "Declare availability" }).first(),
  ).toBeVisible();
});

test("step 1 Continue navigates to step 2", async ({ page }) => {
  await page.goto("/dashboard/declare-availability/workers/step-1");
  await page.waitForLoadState("networkidle");

  await page.getByRole("link", { name: "Continue" }).click();

  await expect(page).toHaveURL(
    "/dashboard/declare-availability/workers/step-2",
  );
});

test("step 2 loads worker details", async ({ page }) => {
  await page.goto("/dashboard/declare-availability/workers/step-2");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(
    "/dashboard/declare-availability/workers/step-2",
  );
});

test("step 3 loads location details", async ({ page }) => {
  await page.goto("/dashboard/declare-availability/workers/step-3");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(
    "/dashboard/declare-availability/workers/step-3",
  );
});

test("step 4 loads review and publish", async ({ page }) => {
  await page.goto("/dashboard/declare-availability/workers/step-4");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(
    "/dashboard/declare-availability/workers/step-4",
  );
});
