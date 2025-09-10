// tests/ui-inline-render.spec.ts
import { test, expect } from "@playwright/test";
import { createTaskViaApi } from "./helpers";
test.describe("インライン表示: 親/子 表示と完了動作", () => {
    test("親は青バー/子はチェック先頭・完了で取り消し線/期限表示", async ({ page }) => {
        await page.goto("/tasks");
        const pTitle = `P-${Date.now()}`;
        const c1Title = `C1-${Date.now()}`;
        const c2Title = `C2-${Date.now()}`;
        const parent = await createTaskViaApi(page, {
            title: pTitle,
            site: "E2E-INLINE",
            deadline: "2030-01-01T00:00:00.000Z",
            parent_id: null,
        });
        const child1 = await createTaskViaApi(page, {
            title: c1Title,
            parent_id: parent.id,
            deadline: "2030-02-02T00:00:00.000Z",
            status: "in_progress",
            progress: 0,
        });
        const child2 = await createTaskViaApi(page, {
            title: c2Title,
            parent_id: parent.id,
            deadline: null,
            status: "in_progress",
            progress: 0,
        });
        await expect(page.getByTestId(`task-title-${parent.id}`)).toHaveText(pTitle);
        await expect(page.getByTestId(`task-progress-${parent.id}`)).toBeVisible();
        await expect(page.getByTestId(`task-progress-bar-${parent.id}`)).toHaveClass(/bg-blue-500/);
        await expect(page.getByTestId(`task-progress-${child1.id}`)).toHaveCount(0);
        await expect(page.getByTestId(`task-done-${child1.id}`)).toBeVisible();
        await page.getByTestId(`task-done-${child1.id}`).click();
        await expect(page.getByTestId(`task-title-${child1.id}`)).toHaveCSS("text-decoration-line", "line-through");
        await expect(page.getByTestId(`task-item-${child1.id}`)).toContainText(/期限:\s*2030-02-02/);
        await expect(page.getByTestId(`task-item-${child2.id}`)).toContainText(/期限:\s*—/);
    });
});
