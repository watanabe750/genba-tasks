import { test, expect } from "@playwright/test";
import { openTasks } from "./helpers";
test("親に子4つまで、5つ目は不可", async ({ page }) => {
    await openTasks(page);
    const title = `P-${Date.now()}`;
    await page.getByTestId("new-parent-title").fill(title);
    await page.getByTestId("new-parent-site").fill("E2E");
    await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/tasks") && r.request().method() === "POST"),
        page.getByTestId("new-parent-submit").click(),
    ]);
    const parent = page.locator(`[data-testid^="task-item-"]`).filter({ hasText: title }).first();
    const addBtn = parent.locator('[data-testid^="row-actions-"]').first()
        .getByTestId(/task-add-child-\d+/);
    await expect(addBtn).toBeEnabled();
    for (let i = 1; i <= 4; i++) {
        await addBtn.click();
        await parent.getByTestId("child-title-input").fill(`c${i}`);
        await parent.getByTestId("child-create-submit").click();
        await expect(parent.locator('[data-testid^="task-item-"]').filter({ hasText: `c${i}` }).first()).toBeVisible();
    }
    await expect(addBtn).toBeDisabled();
});
test("子の下にさらに子を作れる（ネスト作成+折りたたみ）", async ({ page }) => {
    await openTasks(page);
    const title = `P-${Date.now()}`;
    await page.getByTestId("new-parent-title").fill(title);
    await page.getByTestId("new-parent-site").fill("E2E");
    await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/tasks") && r.request().method() === "POST"),
        page.getByTestId("new-parent-submit").click(),
    ]);
    const parent = page.locator(`[data-testid^="task-item-"]`).filter({ hasText: title }).first();
    const add = parent.getByTestId(/task-add-child-\d+/);
    await add.click();
    const l1 = parent; // 直下の新規行を親DOMのフィルタで辿る
    await l1.getByTestId("child-title-input").fill("L1");
    await l1.getByTestId("child-create-submit").click();
    await expect(l1.locator('[data-testid^="task-item-"]').filter({ hasText: 'L1' }).first()).toBeVisible();
    const addL1 = l1.getByTestId(/task-add-child-\d+/).first();
    await addL1.click();
    await l1.getByTestId("child-title-input").fill("L2");
    await l1.getByTestId("child-create-submit").click();
    await expect(l1.locator('[data-testid^="task-item-"]').filter({ hasText: 'L2' }).first()).toBeVisible();
    // 親の ▾/▸ で折り畳み/展開できる（存在確認）
    const toggle = parent.getByRole("button", { name: /子タスクを隠す|子タスクを表示/ });
    await toggle.click();
    await toggle.click();
});
