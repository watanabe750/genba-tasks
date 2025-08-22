import { test, expect } from "@playwright/test";
import { clearInput } from "./helpers";

test.describe("親/子の site 必須仕様", () => {
  // 認証は storageState 済み。/tasks を直踏みしてフォームを待つ
  test.beforeEach(async ({ page }) => {
    await page.goto("/tasks");
    // どれかが DOM に付いたらOK（visible 縛りは外す）
    await page.waitForSelector(
      [
        '[data-testid="parent-create-title"]',
        '[data-testid="task-list-root"]',
        '[data-testid^="task-item-"]',
        '[data-testid="header-logout"]',
      ].join(","),
      { state: "attached", timeout: 8000 }
    );
  });

  test("親は現場名必須 / siteありは成功・なしは失敗", async ({ page }) => {
    const titleOk = `親E2E-${Date.now()}`;
    await page.getByTestId("parent-create-title").fill(titleOk);
    await page.getByTestId("parent-create-site").fill("現場E2E");
    await page.getByTestId("parent-create-deadline").fill("2025-12-31");
    await page.getByTestId("parent-create-submit").click();
    await expect(page.getByRole("heading", { name: titleOk })).toBeVisible();

    const titleNg = `親E2E-NG-${Date.now()}`;
    await page.getByTestId("parent-create-title").fill(titleNg);
    await clearInput(page.getByTestId("parent-create-site"));
    await expect(page.getByTestId("parent-create-submit")).toBeDisabled();
    await expect(page.getByRole("heading", { name: titleNg })).toHaveCount(0);
  });

  test("子は site を送らず作成できる", async ({ page }) => {
    const title = `親E2E-子-${Date.now()}`;
    await page.getByTestId("parent-create-title").fill(title);
    await page.getByTestId("parent-create-site").fill("現場Z");
    await page.getByTestId("parent-create-submit").click();

    const parent = page
      .locator('[data-testid^="task-item-"]', {
        has: page.getByRole("heading", { name: title }),
      })
      .first();
    await expect(parent).toBeVisible();

    const addChild = parent.locator('[data-testid^="task-add-child-"]').first();
    await expect(addChild).toBeVisible();
    await addChild.click();

    await parent.getByTestId("child-title-input").fill("子E2E");
    await parent.getByTestId("child-create-submit").click();
    await parent.getByTestId("child-title-input").evaluate((el) => {
      el.closest("form")?.requestSubmit();
    });

    await expect(
      parent.getByRole("heading", { name: "子E2E" }).first()
    ).toBeVisible();
  });
});
