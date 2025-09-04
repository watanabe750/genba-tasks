import { test, expect } from "@playwright/test";
import { openTasks, waitForTasksOk } from "./helpers";

test.describe("親/子の site 必須仕様", () => {
  test("親は現場名必須 / siteありは成功・なしは失敗", async ({ page }) => {
    await openTasks(page);
    await waitForTasksOk(page);

    await page.getByTestId("new-parent-title").fill(`P-${Date.now()}`);

    // site なし → disabled
    await expect(page.getByTestId("new-parent-submit")).toBeDisabled();

    // site あり → enabled
    await page.getByTestId("new-parent-site").fill("E2E");
    await expect(page.getByTestId("new-parent-submit")).toBeEnabled();

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/tasks") && r.request().method() === "POST"
      ),
      page.getByTestId("new-parent-submit").click(),
    ]);
  });

  test("子は site を送らず作成できる", async ({ page }) => {
    await openTasks(page);

    const title = `P-${Date.now()}`;
    await page.getByTestId("new-parent-title").fill(title);
    await page.getByTestId("new-parent-site").fill("E2E");
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/tasks") && r.request().method() === "POST"
      ),
      page.getByTestId("new-parent-submit").click(),
    ]);

    // 親の行を捕まえる
    const parent = page
      .locator(`[data-testid^="task-item-"]`)
      .filter({ hasText: title })
      .first();

    // 子追加
    const addBtn = parent
      .locator('[data-testid^="row-actions-"]')
      .first()
      .getByTestId(/task-add-child-\d+/);
    await addBtn.click();
    await parent.getByTestId("child-title-input").fill("子1");
    await parent.getByTestId("child-create-submit").click();

    await expect(
      parent
        .locator('[data-testid^="task-item-"]')
        .filter({ hasText: "子1" })
        .first()
    ).toBeVisible();
  });
});
