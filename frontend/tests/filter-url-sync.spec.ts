// tests/filter-url-sync.spec.ts
import { test, expect, type Page } from "@playwright/test";
import { ensureAuthTokens } from "./helpers";

test.use({ storageState: "tests/.auth/e2e.json" });

async function openTasksWithBar(page: Page) {
  for (let i = 0; i < 3; i++) {
    // ① まずオリジンを確立（about:blank → localStorage SecurityError を防ぐ）
    if (!/^https?:\/\//.test(page.url())) {
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");
    }

    // ② トークンを整える
    await ensureAuthTokens(page);

    // ③ /tasks を開いて取得完了まで待つ
    await page.goto("/tasks?order_by=deadline&dir=asc");
    await page.waitForLoadState("domcontentloaded");
    await page
      .waitForResponse((r) => r.url().includes("/api/tasks") && r.status() === 200, {
        timeout: 10_000,
      })
      .catch(() => {});
    await page.waitForLoadState("networkidle");

    // ④ FilterBar が見えたら成功。/login に飛ばされていたらリトライ
    try {
      await page.waitForSelector('[data-testid="filter-bar"]', {
        state: "visible",
        timeout: 4000,
      });
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

  // 入力 → URL に反映
  await bar.getByTestId("filter-site").fill("SITE-XYZ");
  await expect(page).toHaveURL(/site=SITE-XYZ/);

  await bar.getByTestId("order_by").selectOption("deadline");
  await expect(page).toHaveURL(/order_by=deadline/);

  await bar.getByTestId("dir").selectOption("asc");
  await expect(page).toHaveURL(/dir=asc/);

  // すべて解除 → クエリは空（既定値はURLに載せない）
  await bar.getByRole("button", { name: "すべて解除" }).click();
  await expect(page).not.toHaveURL(/site=/);
  await expect(page).not.toHaveURL(/order_by=/);
  await expect(page).not.toHaveURL(/dir=/);
});
