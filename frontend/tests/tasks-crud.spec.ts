import { test, expect } from "@playwright/test";
import { createTaskViaApi } from "./helpers";

test.describe("Tasks CRUD (UI)", () => {
  test("UIで新規作成（ボタンがある場合のみ）", async ({ page }) => {
    await page.goto("/tasks");
    const title = `E2E-新規-${Date.now()}`;
    const createBtn = page.getByRole("button", {
      name: /新規タスク|タスク追加/,
    });

    if (!(await createBtn.isVisible().catch(() => false))) {
      test.skip(true, "新規作成ボタンが見つからないためスキップ");
    }

    await createBtn.click();

    const titleInput = page.getByLabel(/タイトル/).first();
    await titleInput.fill(title);

    const dateInput = page.getByLabel(/期限/).first();
    if (await dateInput.isVisible().catch(() => false)) {
      await dateInput.fill("2025-12-31");
    }

    await titleInput.evaluate((el) => {
      const form = el.closest("form") as HTMLFormElement | null;
      form?.requestSubmit();
    });

    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });

  test("編集：タイトル・期限・完了トグル", async ({ page }) => {
    await page.goto("/tasks");
    const baseTitle = `E2E-編集-${Date.now()}`;
    const created = await createTaskViaApi(page, { title: baseTitle });
    await page.reload();

    const item = page.getByTestId(`task-item-${created.id}`).first();
    await expect(item).toBeVisible();

    await item.getByRole("button", { name: "編集" }).first().click();
    await item.getByLabel("タイトル").first().fill(`${baseTitle}-更新`);

    const deadline = item.getByLabel("期限").first();
    if (await deadline.isVisible().catch(() => false)) {
      await deadline.fill("2025-11-30");
    }

    const statusSel = item.getByLabel("ステータス").first();
    if (await statusSel.isVisible().catch(() => false)) {
      await statusSel.selectOption("completed").catch(async () => {
        await statusSel.selectOption({ label: "完了" });
      });
    }

    await item.getByRole("button", { name: "保存" }).first().click();

    await expect(
      item.getByRole("heading", { name: `${baseTitle}-更新` }).first()
    ).toBeVisible();
    await expect(
      item.getByText(/ステータス:\s*completed/).first()
    ).toBeVisible();
  });

  test("削除：UIから削除できる", async ({ page }) => {
    await page.goto("/tasks");
    const title = `E2E-削除-${Date.now()}`;
    const created = await createTaskViaApi(page, { title });
    await page.reload();

    const item = page.getByTestId(`task-item-${created.id}`).first();
    await expect(item).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await page.getByTestId(`task-delete-${created.id}`).click();

    await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
  });
});
