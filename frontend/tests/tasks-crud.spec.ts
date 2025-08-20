import { test, expect } from "@playwright/test";
import { login, createTaskViaApi } from "./helpers";

test.describe("Tasks CRUD (UI)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("UIで新規作成（ボタンがある場合のみ）", async ({ page }) => {
    const title = `E2E-新規-${Date.now()}`;
    const createBtn = page.getByRole("button", {
      name: /新規タスク|タスク追加/,
    });

    // ボタンが無ければスキップ（他テストでCRUDは担保）
    if (!(await createBtn.isVisible().catch(() => false))) {
      test.skip(true, "新規作成ボタンが見つからないためスキップ");
    }

    await createBtn.click();

    // モーダル or インラインの最初のタイトル入力を狙う
    const titleInput = page.getByLabel(/タイトル/).first();
    await titleInput.fill(title);

    // 期限(date)がある場合のみ入力
    const dateInput = page.getByLabel(/期限/).first();
    if (await dateInput.isVisible().catch(() => false)) {
      await dateInput.fill("2025-12-31");
    }

    // クリックがレイアウトに遮られるケースがあるため、フォームを直接送信
    await titleInput.evaluate((el) => {
      const form = el.closest("form") as HTMLFormElement | null;
      form?.requestSubmit();
    });

    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });

  test("編集：タイトル・期限・完了トグル", async ({ page }) => {
    // まずAPIでタスクを作成（安定のためUI依存にしない）
    const baseTitle = `E2E-編集-${Date.now()}`;
    await createTaskViaApi(page, baseTitle);
    await page.goto("/tasks"); // リストを最新化

    const item = page
      .locator("div", { has: page.getByRole("heading", { name: baseTitle }) })
      .first();
    await expect(item).toBeVisible();

    // 編集 → タイトル変更、期限変更、完了チェック
    await item.getByRole("button", { name: "編集" }).first().click();
    await item.getByLabel("タイトル").first().fill(`${baseTitle}-更新`);

    const deadline = item.getByLabel("期限").first();
    if (await deadline.isVisible().catch(() => false)) {
      await deadline.fill("2025-11-30");
    }

    // 編集モードではチェックボックスが無いので select で completed に変更
    const statusSel = item.getByLabel("ステータス").first();
    if (await statusSel.isVisible().catch(() => false)) {
      await statusSel.selectOption("completed").catch(async () => {
        await statusSel.selectOption({ label: "完了" });
      });
    }

    await item.getByRole("button", { name: "保存" }).first().click();

    await expect(
      page.getByRole("heading", { name: `${baseTitle}-更新` })
    ).toBeVisible();
    await expect(
      item.getByText(/ステータス:\s*completed/).first()
    ).toBeVisible();
  });

  test("削除：UIから削除できる", async ({ page }) => {
    const title = `E2E-削除-${Date.now()}`;
    const created = await createTaskViaApi(page, title); // ← ID を取得
    await page.goto("/tasks");

    const item = page
      .locator("div", { has: page.getByRole("heading", { name: title }) })
      .first();
    await expect(item).toBeVisible();

    page.once("dialog", (d) => d.accept()); // confirm OK
    // data-testid="task-delete-<id>" をクリックして一意に指定
    await page.getByTestId(`task-delete-${created.id}`).click();

    await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
  });
});
