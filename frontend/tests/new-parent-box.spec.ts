import { test, expect } from "@playwright/test";

test("上位タスク作成ボックスで親を作れる", async ({ page }) => {
  await page.goto("/tasks");

  const title = `NP-${Date.now()}`;
  await page.getByTestId("new-parent-title").fill(title);
  await page.getByTestId("new-parent-site").fill("E2E-BOX");
  // 期限は任意入力。空でも可
  await page.getByTestId("new-parent-submit").click();

  await expect(page.getByText(title).first()).toBeVisible();
  await expect(page.getByText("上位タスク").first()).toBeVisible(); // バッジ確認
});
