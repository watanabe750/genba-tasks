// tests/children-limit-ui.spec.ts
import { test, expect } from "@playwright/test";
import { createTaskViaApi } from "./helpers";

test.use({ storageState: "tests/.auth/e2e.json" });

const items = (page: any) => page.locator('[data-testid^="task-item-"]');

test("UI: 子4件のとき +サブタスク は無効化され作成不可", async ({ page }) => {
  await page.goto("/tasks");

  // ★ ログイン状態の安定化
  await expect(page.getByText("uid: e2e@example.com")).toBeVisible();
  await page
    .waitForResponse((r) => r.url().includes("/api/tasks") && r.status() === 200, { timeout: 10_000 })
    .catch(() => {}); // 初回はキャッシュで飛ばないこともある
  await page.waitForLoadState("networkidle");

  // 親と子4件を API 播種
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

  // 反映済みを確認
  const parentItem = page.getByTestId(`task-item-${parent.id}`);
  await expect(parentItem).toBeVisible();

  // 「+ サブタスク」ボタンは無効化・ツールチップ表示
  const addBtn = page.getByTestId(`task-add-child-${parent.id}`);
  await expect(addBtn).toBeDisabled();
  await expect(addBtn).toHaveAttribute("title", /最大4件/);
});
