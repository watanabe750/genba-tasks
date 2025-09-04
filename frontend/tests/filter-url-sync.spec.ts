// tests/filter-url-sync.spec.ts
import { test, expect, type Page } from "@playwright/test";
import { ensureAuthTokens } from "./helpers";

// playwright.config の設定に合わせる（またはこの行自体なくても可）
test.use({ storageState: "tests/.auth/storage.json" });

async function openTasksWithBar(page: Page) {
  for (let i = 0; i < 3; i++) {
    if (!/^https?:\/\//.test(page.url())) {
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");
    }

    await ensureAuthTokens(page);

    await page.goto("/tasks?order_by=deadline&dir=asc");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForResponse(
      r => r.url().includes("/api/tasks") && r.request().method() === "GET" && r.status() === 200,
      { timeout: 10_000 }
    ).catch(() => {});

    try {
      await page.waitForSelector('[data-testid="filter-bar"]', { state: "visible", timeout: 4000 });
      return;
    } catch {
      /* retry */
    }
  }
  throw new Error("filter-bar not reachable");
}

test("FilterBar: URLクエリと同期 & すべて解除で初期化", async ({ page }) => {
  await openTasksWithBar(page);

  const bar = page.getByTestId("filter-bar");
  await expect(bar).toBeVisible();

  await bar.getByTestId("filter-site").fill("SITE-XYZ");
  await expect(page).toHaveURL(/site=SITE-XYZ/);

  await bar.getByTestId("order_by").selectOption("deadline");
  await expect(page).toHaveURL(/order_by=deadline/);

  await bar.getByTestId("dir").selectOption("asc");
  await expect(page).toHaveURL(/dir=asc/);

  await bar.getByRole("button", { name: "すべて解除" }).click();
  await expect(page).not.toHaveURL(/site=/);
  await expect(page).not.toHaveURL(/order_by=/);
  await expect(page).not.toHaveURL(/dir=/);
});
