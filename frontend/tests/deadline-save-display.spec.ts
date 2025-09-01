import { test, expect } from "@playwright/test";
import { createTaskViaApi } from "./helpers";

test.use({ storageState: "tests/.auth/e2e.json" });

test("期限入力を保存すると yyyy-mm-dd で表示される", async ({ page }) => {
  const stamp = Date.now(), site = `E2E-DL-${stamp}`;
  const t = await createTaskViaApi(page, { title: `DL-${stamp}`, site, parent_id: null });

  await page.goto(`/tasks?site=${encodeURIComponent(site)}`);

  // 編集
  const row = page.locator(`[data-testid="task-item-${t.id}"]`);
  await row.getByRole("button", { name: "編集" }).click();
  await row.getByLabel("期限").fill("2031-12-24");
  await row.getByRole("button", { name: "保存" }).click();

  await expect(row.getByText("期限: 2031-12-24")).toBeVisible();
});
