import { chromium, test as setup } from "@playwright/test";
import path from "path";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "https://localhost";

const AUTH_FILE = {
  manager: path.join(__dirname, ".auth/manager.json"),
  admin: path.join(__dirname, ".auth/admin.json"),
};

async function createTestSession(
  email: string,
  role: string,
  name: string,
  outputFile: string,
) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  const params = new URLSearchParams({ email, role, name });
  const response = await page.goto(
    `${BASE_URL}/api/dev/test-session?${params}`,
  );

  if (!response || response.status() !== 200) {
    throw new Error(
      `Failed to create test session for ${email}: HTTP ${response?.status()}. ` +
        "Make sure ENABLE_TEST_AUTH=true is set in the frontend environment.",
    );
  }

  await context.storageState({ path: outputFile });
  await browser.close();
}

setup("create auth sessions", async () => {
  await createTestSession(
    "test.manager@kapacitet.net",
    "Manager",
    "Test Manager",
    AUTH_FILE.manager,
  );

  await createTestSession(
    "test.admin@kapacitet.net",
    "Admin",
    "Test Admin",
    AUTH_FILE.admin,
  );
});
