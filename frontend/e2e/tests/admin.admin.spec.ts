import { expect, test } from "@playwright/test";

const ACCESS_REQUESTS_RESPONSE = [
  {
    id: 1,
    name: "Test Byg ApS",
    contactEmail: "kontakt@testbyg.dk",
    cvr: "12345678",
    categories: [],
    location: "København",
    status: "Pending",
    createdAt: "2026-05-01T10:00:00Z",
  },
];

test.beforeEach(async ({ page }) => {
  await page.route("/api/admin/access-requests*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ACCESS_REQUESTS_RESPONSE),
    }),
  );
  await page.route("/api/admin/companies*", (route) =>
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

test("admin is redirected to admin overview from root", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL("/dashboard/admin");
});

test("admin overview page loads", async ({ page }) => {
  await page.goto("/dashboard/admin");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL("/dashboard/admin");
});

test("access requests page shows pending request", async ({ page }) => {
  await page.goto("/dashboard/admin/access-requests");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Test Byg ApS")).toBeVisible();
  await expect(page.getByText("kontakt@testbyg.dk")).toBeVisible();
});

test("access request can be approved", async ({ page }) => {
  let approveCalled = false;
  await page.route("/api/admin/access-requests/1/review", (route) => {
    approveCalled = true;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: 1, status: "Approved" }),
    });
  });

  await page.goto("/dashboard/admin/access-requests");
  await page.waitForLoadState("networkidle");

  // First click opens the confirmation dialog
  await page.getByRole("button", { name: "Approve request" }).first().click();
  // Second click confirms in the dialog
  await page.getByRole("button", { name: "Approve request" }).last().click();

  await page.waitForTimeout(500);
  expect(approveCalled).toBe(true);
});

test("companies page loads", async ({ page }) => {
  await page.goto("/dashboard/admin/companies");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL("/dashboard/admin/companies");
});

test("audit log page loads", async ({ page }) => {
  await page.route("/api/admin/audit*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], total: 0 }),
    }),
  );

  await page.goto("/dashboard/admin/audit");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL("/dashboard/admin/audit");
});
