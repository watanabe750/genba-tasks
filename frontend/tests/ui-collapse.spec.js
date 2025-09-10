import { test, expect } from "@playwright/test";
import { createTaskViaApi } from "./helpers";
test("親の▾/▸で子を表示/非表示できる", async ({ page }) => {
    await page.goto("/tasks");
    const parent = await createTaskViaApi(page, { title: `P-${Date.now()}`, site: "E2E-COLL", parent_id: null });
    const child = await createTaskViaApi(page, { title: `C-${Date.now()}`, parent_id: parent.id });
    const row = page.getByTestId(`task-item-${parent.id}`);
    // 初期は展開想定（UI仕様に合わせる）
    await expect(page.getByTestId(`task-item-${child.id}`)).toBeVisible();
    // 親行内のトグルボタンを押す（▾/▸は1個目の5x5ボタン想定）
    const toggle = row.locator('button[aria-expanded]');
    await toggle.click();
    await expect(page.getByTestId(`task-item-${child.id}`)).toHaveCount(0);
    // もう一度で再表示
    await toggle.click();
    await expect(page.getByTestId(`task-item-${child.id}`)).toBeVisible();
});
