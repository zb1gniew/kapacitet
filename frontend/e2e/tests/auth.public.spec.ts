import { expect, test } from "@playwright/test";

test("unauthenticated user sees login page at root", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { name: "Sign in to your account" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("unauthenticated user is redirected to home from /dashboard", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/");
});

test("request access page is publicly accessible", async ({ page }) => {
  await page.goto("/request-access");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL("/request-access");
  await expect(
    page.getByRole("heading", { name: "Request platform access" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit request" })).toBeVisible();
  await expect(page.getByLabel("Company name")).toBeVisible();
});

test("request access form validates CVR format", async ({ page }) => {
  await page.goto("/request-access");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Company name").fill("Test Company A/S");
  await page.getByLabel("CVR number").fill("1234"); // too short, fails JS regex

  // Disable native HTML validation so the React onSubmit handler runs
  await page.evaluate(() => {
    const form = document.querySelector("form");
    if (form) form.noValidate = true;
  });

  await page.getByRole("button", { name: "Submit request" }).click();

  await expect(page.getByText("CVR must be exactly 8 digits.")).toBeVisible();
});

test("clicking Sign in initiates login flow", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const loginRequest = page.waitForRequest(
    (req) => req.url().includes("/api/auth/login"),
    { timeout: 10_000 },
  );

  await page.getByLabel("Email address").fill("test@company.com");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Verify the login API was hit (Keycloak may not be running locally,
  // but the frontend correctly initiates the auth flow)
  const request = await loginRequest;
  expect(request.url()).toContain("/api/auth/login");
});
