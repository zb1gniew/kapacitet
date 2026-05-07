import { expect, test } from "@playwright/test";
import type { MatchOfferResponse } from "@/types/api-matches";

const now = new Date().toISOString();
const future = new Date(Date.now() + 7 * 86400_000).toISOString();

const PENDING_MATCH: MatchOfferResponse = {
  id: 1,
  requestId: 10,
  availabilityId: 20,
  perspective: "Requester",
  status: "PendingRequesterReview",
  offeredQuantity: 3,
  requestQuantity: 3,
  availabilityQuantity: 5,
  matchScore: 0.85,
  skillScore: 0.9,
  certificateScore: 0.8,
  dateScore: 0.9,
  locationScore: 0.8,
  quantityScore: 0.8,
  coversFullPeriod: true,
  isPartial: false,
  locationCity: "København",
  requestLocationCity: "København",
  requestLocationRadiusKm: 50,
  availabilityLocationCity: "København",
  availabilityLocationRadiusKm: 50,
  requestUrgency: "Medium",
  requestStartDate: "2026-06-01",
  requestEndDate: "2026-06-30",
  availabilityStartDate: "2026-06-01",
  availabilityEndDate: "2026-06-30",
  createdAt: now,
  expiresAt: future,
  explanation: "Good skill match",
  partnerCompanyName: "Bygg A/S",
  partnerCompanyId: 2,
  skills: ["Elektrikere"],
  certificates: [],
};

test.beforeEach(async ({ page }) => {
  await page.route("/api/notifications*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  );
});

test("matches page displays pending matches", async ({ page }) => {
  await page.route("/api/matches*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([PENDING_MATCH]),
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

  await expect(page.getByText("Action required")).toBeVisible();
  await expect(page.getByText("1 offer")).toBeVisible();
});

test("accept offer button is visible for pending match", async ({ page }) => {
  await page.route("/api/matches*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([PENDING_MATCH]),
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

  await expect(
    page.getByRole("button", { name: "Accept offer" }).first(),
  ).toBeVisible();
});

test("accepting a match calls the accept endpoint", async ({ page }) => {
  let acceptCalled = false;
  await page.route("/api/matches*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([PENDING_MATCH]),
    }),
  );
  await page.route("/api/agreements*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  );
  await page.route("/api/matches/1/accept", (route) => {
    acceptCalled = true;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...PENDING_MATCH,
        status: "PendingSupplierConfirmation",
      }),
    });
  });

  await page.goto("/dashboard/matches");
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "Accept offer" }).first().click();

  await page.waitForTimeout(500);
  expect(acceptCalled).toBe(true);
});

test("empty state shown when no matches", async ({ page }) => {
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

  await expect(page.getByText("No matches yet")).toBeVisible();
});
