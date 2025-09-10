// tests/tasks-crud.spec.ts
import { test, expect } from "@playwright/test";
import { createTaskViaApi, clearInput } from "./helpers";
test.use({ storageState: "tests/.auth/e2e.json" });
test.describe("Tasks CRUD (UI)", () => {
    test("編集：タイトル・期限・完了トグル", async ({ page }) => {
        const title = `CRUD-${Date.now()}`;
        const created = await createTaskViaApi(page, {
            title,
            site: "E2E-CRUD",
            status: "in_progress",
            progress: 0,
        });
        const id = created.id;
        const item = page.locator(`[data-testid="task-item-${id}"]`).first();
        await expect(item).toBeVisible();
        // 編集
        await item.getByRole("button", { name: "編集" }).click();
        await expect(item).toHaveAttribute("data-editing", "1");
        const titleInput = item.getByLabel("タイトル", { exact: true });
        await expect(titleInput).toBeVisible();
        await clearInput(titleInput);
        const newTitle = `${title}-編集`;
        await titleInput.fill(newTitle);
        const deadlineInput = item.getByLabel("期限");
        await deadlineInput.fill("2030-05-02");
        await item.getByLabel("ステータス").selectOption("completed");
        await item.getByRole("button", { name: "保存" }).click();
        await expect(item).toHaveAttribute("data-editing", "0");
        await expect(item.getByText(newTitle)).toBeVisible();
        await expect(item.getByText(/ステータス:\s*完了/)).toBeVisible();
        // 表示モードのチェックでトグル（完了→進行中→完了）
        const doneToggle = item.getByLabel("完了");
        await doneToggle.click();
        await expect(item.getByText(/ステータス:\s*進行中/)).toBeVisible();
        await doneToggle.click();
        await expect(item.getByText(/ステータス:\s*完了/)).toBeVisible();
    });
});
