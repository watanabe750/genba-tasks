import { test, expect } from "@playwright/test";
import { createTaskViaApi, openTasks } from "./helpers";

test("UI: 子4件のとき +サブタスク は無効化され作成不可", async ({ page }) => {
  const parent = await createTaskViaApi(page, { title: `P-${Date.now()}`, site: "E2E" });
  for (let i = 1; i <= 4; i++) {
    await createTaskViaApi(page, { title: `c${i}`, parent_id: parent.id });
  }

  await openTasks(page);

  const row = page.locator(`[data-testid="task-item-${parent.id}"]`).first();
  const add = row.getByTestId(`task-add-child-${parent.id}`);
  await expect(add).toBeDisabled();
});
