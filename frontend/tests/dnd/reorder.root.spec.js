import { test, expect } from "@playwright/test";
import H from "./_helpers";
import { waitForTasksOk } from "../helpers";
test.describe("@dnd 親の並べ替え（root）", () => {
    test("親タスクを after 仕様で並べ替えできる", async ({ page }) => {
        await page.goto("/tasks");
        await page.evaluate(() => window.dispatchEvent(new Event("auth:refresh")));
        await waitForTasksOk(page);
        const stamp = Date.now();
        const p1 = await H.apiCreateTask(page, { title: `E2E-ROOT-P1-${stamp}`, site: "e2e" });
        const p2 = await H.apiCreateTask(page, { title: `E2E-ROOT-P2-${stamp}`, site: "e2e" });
        const p3 = await H.apiCreateTask(page, { title: `E2E-ROOT-P3-${stamp}`, site: "e2e" });
        await page.reload({ waitUntil: "domcontentloaded" });
        await waitForTasksOk(page);
        await expect(page.getByText(p1.title)).toBeVisible();
        let [i1, i2, i3] = await H.titleIndexes(page, [p1.title, p2.title, p3.title]);
        expect(i1).toBeLessThan(i2);
        expect(i2).toBeLessThan(i3);
        await H.dragAfter(page, p3.id, p1.id);
        await expect.poll(async () => {
            const [j1, j2, j3] = await H.titleIndexes(page, [p1.title, p2.title, p3.title]);
            return j1 < j3 && j3 < j2;
        }).toBeTruthy();
        await H.apiDeleteTask(page, p1.id);
        await H.apiDeleteTask(page, p2.id);
        await H.apiDeleteTask(page, p3.id);
    });
});
