import { test, expect } from "@playwright/test";

test.use({ storageState: "tests/.auth/e2e.json" });

test("上位タスク作成ボックスで親を作れる", async ({ page }) => {
  await page.goto("/tasks");
  await page.evaluate(() => window.dispatchEvent(new Event("auth:refresh")));
  await page
    .waitForResponse((r) => r.url().includes("/api/tasks") && r.request().method() === "GET" && r.status() === 200, { timeout: 10_000 })
    .catch(() => {});

  const title = `NP-${Date.now()}`;
  await page.getByTestId("new-parent-title").fill(title);
  await page.getByTestId("new-parent-site").fill("E2E-BOX");

  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/tasks") && r.request().method() === "POST" && r.status() === 201, { timeout: 10_000 }),
    page.getByTestId("new-parent-submit").click(),
  ]);

  await page.reload();
  await page.waitForLoadState("networkidle");

  await expect(page.getByText(title).first()).toBeVisible();
  await expect(page.getByText("上位タスク").first()).toBeVisible(); // バッジ確認
});
