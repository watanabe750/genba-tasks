// tests/registration-ui-only.spec.ts
// バックエンドAPIなしで実行可能なUI表示確認テスト
import { test, expect } from "@playwright/test";

test.describe("ユーザー登録 - UI確認（APIなし）", () => {
  test("登録画面が正しく表示される", async ({ page }) => {
    await page.goto("/register");

    // ページタイトル
    await expect(page.getByRole("heading", { name: /新規登録/ })).toBeVisible();

    // 入力フィールド
    await expect(page.getByLabel("名前")).toBeVisible();
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByLabel("パスワード", { exact: true })).toBeVisible();
    await expect(page.getByLabel("パスワード（確認）")).toBeVisible();

    // ボタン
    await expect(page.getByRole("button", { name: /登録/ })).toBeVisible();

    // リンク
    await expect(page.getByRole("link", { name: /ログイン/ })).toBeVisible();
  });

  test("/signup から /register にリダイレクトされる", async ({ page }) => {
    await page.goto("/signup");
    await expect(page).toHaveURL(/\/register$/);
  });

  test("ログイン画面に登録リンクが表示される", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /新規登録/ })).toBeVisible();
  });

  test("ホーム画面に登録ボタンが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /今すぐ始める/ }).first()).toBeVisible();
  });

  test("パスワード表示/非表示切り替えボタンが動作する", async ({ page }) => {
    await page.goto("/register");

    const passwordInput = page.locator('input[name="password"]').first();

    // 初期状態は非表示
    await expect(passwordInput).toHaveAttribute("type", "password");

    // 表示ボタンをクリック
    await page.getByRole("button", { name: /表示/ }).first().click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    // 隠すボタンをクリック
    await page.getByRole("button", { name: /隠す/ }).first().click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("フォームバリデーション - 空欄でエラー表示", async ({ page }) => {
    await page.goto("/register");

    // 何も入力せずに登録ボタンをクリック
    await page.getByRole("button", { name: /登録/ }).click();

    // エラーメッセージが表示される
    await expect(page.getByText(/名前を入力してください/)).toBeVisible();
  });

  test("フォームバリデーション - メール形式チェック", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("名前").fill("Test User");
    await page.getByLabel("メールアドレス").fill("invalid-email");

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill("password123");
    await passwordInputs.nth(1).fill("password123");

    await page.getByRole("button", { name: /登録/ }).click();

    await expect(page.getByText(/メールアドレスの形式が正しくありません/)).toBeVisible();
  });

  test("フォームバリデーション - パスワード不一致", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("名前").fill("Test User");
    await page.getByLabel("メールアドレス").fill("test@example.com");

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill("password123");
    await passwordInputs.nth(1).fill("different456");

    await page.getByRole("button", { name: /登録/ }).click();

    await expect(page.getByText(/パスワードが一致しません/)).toBeVisible();
  });

  test("フォームバリデーション - パスワード長さチェック", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("名前").fill("Test User");
    await page.getByLabel("メールアドレス").fill("test@example.com");

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill("12345");
    await passwordInputs.nth(1).fill("12345");

    await page.getByRole("button", { name: /登録/ }).click();

    await expect(page.getByText(/パスワードは6文字以上で入力してください/)).toBeVisible();
  });
});
