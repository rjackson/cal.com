import { expect, type Page } from "@playwright/test";

import type { Fixtures } from "@calcom/web/playwright/lib/fixtures";
import { test } from "@calcom/web/playwright/lib/fixtures";

const installApps = async (page: Page, users: Fixtures["users"]) => {
  const user = await users.create(
    { username: "merge" },
    {
      hasTeam: true,
    }
  );
  await user.login();
  await page.goto(`/apps/merge`);
  await page.click('[data-testid="install-app-button"]');
  await page.waitForNavigation({
    url: (url) => url.pathname === `/apps/merge/setup`,
  });
};

test.describe("Merge app", () => {
  test.afterEach(async ({ users }) => {
    await users.deleteAll();
  });

  test.describe("Install", () => {
    test("should redirect user to set up page", async ({ page, context, users }) => {
      await installApps(page, users);
    });
  });

  test.describe("Setup", () => {
    test("should redirect user back on cancel", async ({ page, context, users }) => {
      await installApps(page, users);
      await page.fill('[data-testid="access-key-input"]', "invalid-api-credential");
      await page.click('[data-testid="cancel-button"]');

      await page.waitForURL("/apps/merge");
    });

    test("should show validation error on rejected credentials", async ({ page, context, users }) => {
      await installApps(page, users);

      await page.route("/api/integrations/merge/add", async (route) => {
        const message = "Could not add Merge app";
        await route.fulfill({ json: { message }, status: 500 });
      });

      await page.fill('[data-testid="access-key-input"]', "invalid-api-credential");
      await page.click('[data-testid="save-button"]');

      await expect(page.locator(`text=Could not add Merge app`)).toBeVisible();
    });

    test("should redirect user on accepted credentials", async ({ page, context, users }) => {
      await installApps(page, users);

      await page.route("/api/integrations/merge/add", async (route) => {
        await route.fulfill({ json: { url: "/apps/installed/other?hl=merge" } });
      });

      await page.fill('[data-testid="access-key-input"]', "valid-api-credentials");
      await page.click('[data-testid="save-button"]');

      await page.waitForURL("/apps/installed/other?hl=merge");
    });
  });
});
