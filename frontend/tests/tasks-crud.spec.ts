import { test, expect } from "@playwright/test";
import { createTaskViaApi, clearInput } from "./helpers";

test.use({ storageState: "tests/.auth/e2e.json" });

test.describe("Tasks CRUD (UI)", () => {
  test("編集：タイトル・期限・完了トグル", async ({ page }) => {
    // 事前にAPIで親タスク作成（site 必須対応）
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

    // 編集へ
    await item.getByRole("button", { name: "編集" }).click();
    await expect(item).toHaveAttribute("data-editing", "1"); // ← これで編集モード確定

    // タイトル編集
    const titleInput = item.getByLabel("タイトル", { exact: true });
    await expect(titleInput).toBeVisible();
    await clearInput(titleInput);
    const newTitle = `${title}-編集`;
    await titleInput.fill(newTitle);

    // 期限編集（YYYY-MM-DD）
    const deadlineInput = item.getByLabel("期限");
    await deadlineInput.fill("2030-05-02");

    // ステータス完了（編集モードはセレクト）
    await item.getByLabel("ステータス").selectOption("completed");

    // 保存
    await item.getByRole("button", { name: "保存" }).click();
    await expect(item).toHaveAttribute("data-editing", "0");

    // 表示モードに戻って変更が反映されていること
    await expect(item.getByText(newTitle)).toBeVisible();
    await expect(item.getByText(/ステータス:\s*completed/)).toBeVisible();
  });
});
