
import { test, expect } from "@playwright/test";
import H from "./_helpers";
import { waitForTasksOk } from "../helpers";
test.describe("@dnd 仕様：子はドラッグ不可", () => {
    test("子タスクはハンドルが出ず、順序は変わらない", async ({ page }) => {
        await page.goto("/tasks");
        await page.evaluate(() => window.dispatchEvent(new Event("auth:refresh")));
        await waitForTasksOk(page);
        const stamp = Date.now();
        const p = await H.apiCreateTask(page, { title: `E2E-G-P-${stamp}`, site: "e2e" });
        const a = await H.apiCreateTask(page, { title: `E2E-G-A-${stamp}`, parent_id: p.id });
        const b = await H.apiCreateTask(page, { title: `E2E-G-B-${stamp}`, parent_id: p.id });
        await page.reload({ waitUntil: "domcontentloaded" });
        await waitForTasksOk(page);
        await expect(page.getByText(p.title)).toBeVisible();
        await expect(page.locator(`[data-testid="task-drag-${a.id}"]`)).toHaveCount(0);
        const [ia, ib] = await H.titleIndexes(page, [a.title, b.title]);
        expect(ia).toBeLessThan(ib);
        await H.apiDeleteTask(page, p.id);
    });
});
