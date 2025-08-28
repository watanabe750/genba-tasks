import { test, expect, type Page, type Locator } from "@playwright/test";

test.skip(true, "Inline UIへ移行中のため、D&Dはフェーズ2で再実装予定");

test.describe("D&D: 並び替え/親変更", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.getByTestId("task-list-root")).toBeVisible();
  });

  test("同親内での並び替えがUI上で反映される", async ({ page }) => {
    const items: Locator = page.locator('[data-testid^="task-item-"]');
    const count = await items.count();
    if (count < 2) test.skip();

    const first = items.nth(0);
    const second = items.nth(1);
    await first.dragTo(second);

    const afterFirstId = await items.nth(0).getAttribute("data-testid");
    expect(afterFirstId).not.toEqual(await first.getAttribute("data-testid"));
  });

  test("子4件の親へはドロップできない（UIガード）", async () => {
    test.skip(true, "seed前提。環境に応じて有効化してください。");
  });
});
