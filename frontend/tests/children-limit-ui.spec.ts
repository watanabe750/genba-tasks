import { test, expect, type Page, type Locator } from "@playwright/test";
import { createTaskViaApi } from "./helpers";

test.use({ storageState: "tests/.auth/e2e.json" });

const items = (page: Page): Locator => page.locator('[data-testid^="task-item-"]');

test("UI: 子4件のとき +サブタスク は無効化され作成不可", async ({ page }) => {
  await page.goto("/tasks");

  // ログイン確認（uid 表示は実装に応じて変更可）
  await page
    .waitForFunction(() => !!(localStorage.getItem("access-token")))
    .catch(() => {});
  await page.waitForLoadState("networkidle");

  const site = "E2E-CHILD-LIMIT";
  const title = `親-${Date.now()}`;
  const parent = await createTaskViaApi(page, { title, site });

  for (let i = 1; i <= 4; i++) {
    await createTaskViaApi(page, {
      title: `子${i}`,
      parent_id: parent.id,
      status: "in_progress",
      progress: 0,
    });
  }

  const parentItem = page.getByTestId(`task-item-${parent.id}`);
  await expect(parentItem).toBeVisible();

  const addBtn = page.getByTestId(`task-add-child-${parent.id}`);
  await expect(addBtn).toBeDisabled();
  await expect(addBtn).toHaveAttribute("title", /最大4件/);
});
