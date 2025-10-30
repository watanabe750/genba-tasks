// tests/registration.spec.ts
import { test, expect, type Locator, type Page } from "@playwright/test";

// "見つかった最初のロケータで fill する"ユーティリティ
async function fillFirst(page: Page, locators: Locator[], value: string) {
  for (const loc of locators) {
    if (await loc.count()) {
      await loc.fill(value);
      return;
    }
  }
  throw new Error("input locator not found");
}

// ランダムなメールアドレスを生成（テストの独立性のため）
function generateEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `testuser${timestamp}${random}@example.com`;
}

test.describe("ユーザー登録", () => {
  test.beforeEach(async ({ page, context }) => {
    // ストレージをクリア
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch { /* ignore */ }
    });
    await context.clearCookies();
  });

  test("登録画面にアクセスできる", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole("heading", { name: /新規登録/ })).toBeVisible();
  });

  test("/signup から /register にリダイレクトされる", async ({ page }) => {
    await page.goto("/signup");
    await expect(page).toHaveURL(/\/register$/);
  });

  test("有効な情報で登録成功し /tasks へ遷移", async ({ page }) => {
    const email = generateEmail();
    const password = "password123";
    const name = "Test User";

    await page.goto("/register");

    // 名前入力
    await fillFirst(page, [
      page.getByLabel("名前"),
      page.locator('input[name="name"]'),
      page.locator('input[type="text"]').first(),
    ], name);

    // メールアドレス入力
    await fillFirst(page, [
      page.getByLabel("メールアドレス"),
      page.locator('input[name="email"]'),
      page.locator('input[type="email"]'),
    ], email);

    // パスワード入力
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill(password);
    await passwordInputs.nth(1).fill(password);

    // 登録ボタンをクリック
    await page.getByRole("button", { name: /登録/ }).click();

    // /tasks へ遷移することを確認
    await expect(page).toHaveURL(/\/tasks(\?.*)?$/, { timeout: 10000 });

    // 認証トークンがlocalStorageに保存されていることを確認
    const hasTokens = await page.evaluate(() => {
      const at = localStorage.getItem("access-token");
      const client = localStorage.getItem("client");
      const uid = localStorage.getItem("uid");
      return !!(at && client && uid);
    });
    expect(hasTokens).toBe(true);
  });

  test("パスワードが一致しない場合エラーメッセージが表示される", async ({ page }) => {
    await page.goto("/register");

    await fillFirst(page, [
      page.getByLabel("名前"),
      page.locator('input[name="name"]'),
    ], "Test User");

    await fillFirst(page, [
      page.getByLabel("メールアドレス"),
      page.locator('input[type="email"]'),
    ], generateEmail());

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill("password123");
    await passwordInputs.nth(1).fill("different456");

    await page.getByRole("button", { name: /登録/ }).click();

    // エラーメッセージが表示される
    await expect(page.getByText(/パスワードが一致しません/)).toBeVisible();
  });

  test("メールアドレスが不正な形式の場合エラーメッセージが表示される", async ({ page }) => {
    await page.goto("/register");

    await fillFirst(page, [
      page.getByLabel("名前"),
      page.locator('input[name="name"]'),
    ], "Test User");

    await fillFirst(page, [
      page.getByLabel("メールアドレス"),
      page.locator('input[type="email"]'),
    ], "invalid-email");

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill("password123");
    await passwordInputs.nth(1).fill("password123");

    await page.getByRole("button", { name: /登録/ }).click();

    // エラーメッセージが表示される
    await expect(page.getByText(/メールアドレスの形式が正しくありません/)).toBeVisible();
  });

  test("パスワードが6文字未満の場合エラーメッセージが表示される", async ({ page }) => {
    await page.goto("/register");

    await fillFirst(page, [
      page.getByLabel("名前"),
      page.locator('input[name="name"]'),
    ], "Test User");

    await fillFirst(page, [
      page.getByLabel("メールアドレス"),
      page.locator('input[type="email"]'),
    ], generateEmail());

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill("12345");
    await passwordInputs.nth(1).fill("12345");

    await page.getByRole("button", { name: /登録/ }).click();

    // エラーメッセージが表示される
    await expect(page.getByText(/パスワードは6文字以上で入力してください/)).toBeVisible();
  });

  test("必須項目が空の場合エラーメッセージが表示される", async ({ page }) => {
    await page.goto("/register");

    // 何も入力せずに登録ボタンをクリック
    await page.getByRole("button", { name: /登録/ }).click();

    // 複数のエラーメッセージが表示される
    await expect(page.getByText(/名前を入力してください/)).toBeVisible();
  });

  test("既に登録済みのメールアドレスの場合エラーメッセージが表示される", async ({ page }) => {
    const email = generateEmail();
    const password = "password123";

    // 1回目の登録（成功）
    await page.goto("/register");

    await fillFirst(page, [
      page.getByLabel("名前"),
      page.locator('input[name="name"]'),
    ], "Test User");

    await fillFirst(page, [
      page.getByLabel("メールアドレス"),
      page.locator('input[type="email"]'),
    ], email);

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill(password);
    await passwordInputs.nth(1).fill(password);

    await page.getByRole("button", { name: /登録/ }).click();
    await expect(page).toHaveURL(/\/tasks(\?.*)?$/, { timeout: 10000 });

    // ログアウト
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // 2回目の登録（失敗）
    await page.goto("/register");

    await fillFirst(page, [
      page.getByLabel("名前"),
      page.locator('input[name="name"]'),
    ], "Another User");

    await fillFirst(page, [
      page.getByLabel("メールアドレス"),
      page.locator('input[type="email"]'),
    ], email);

    const passwordInputs2 = page.locator('input[type="password"]');
    await passwordInputs2.nth(0).fill(password);
    await passwordInputs2.nth(1).fill(password);

    await page.getByRole("button", { name: /登録/ }).click();

    // エラーバナーが表示される
    const errorBanner = page.locator('[data-testid="register-error-banner"]');
    await expect(errorBanner).toBeVisible();
  });

  test("ログイン画面へのリンクが機能する", async ({ page }) => {
    await page.goto("/register");

    await page.getByRole("link", { name: /ログイン/ }).click();

    await expect(page).toHaveURL(/\/login$/);
  });

  test("パスワードの表示/非表示切り替えが機能する", async ({ page }) => {
    await page.goto("/register");

    const passwordInput = page.locator('input[name="password"]').first();

    // 初期状態はパスワード非表示（type="password"）
    await expect(passwordInput).toHaveAttribute("type", "password");

    // 表示ボタンをクリック
    await page.getByRole("button", { name: /表示/ }).first().click();

    // パスワードが表示される（type="text"）
    await expect(passwordInput).toHaveAttribute("type", "text");

    // 隠すボタンをクリック
    await page.getByRole("button", { name: /隠す/ }).first().click();

    // パスワードが非表示に戻る
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("既にログイン済みの場合は /tasks にリダイレクトされる", async ({ page }) => {
    // 先にログイン
    const email = generateEmail();
    const password = "password123";

    await page.goto("/register");

    await fillFirst(page, [
      page.getByLabel("名前"),
      page.locator('input[name="name"]'),
    ], "Test User");

    await fillFirst(page, [
      page.getByLabel("メールアドレス"),
      page.locator('input[type="email"]'),
    ], email);

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill(password);
    await passwordInputs.nth(1).fill(password);

    await page.getByRole("button", { name: /登録/ }).click();
    await expect(page).toHaveURL(/\/tasks(\?.*)?$/, { timeout: 10000 });

    // ログイン済みの状態で /register にアクセス
    await page.goto("/register");

    // /tasks にリダイレクトされる
    await expect(page).toHaveURL(/\/tasks(\?.*)?$/);
  });
});

test.describe("ホーム画面の登録ボタン", () => {
  test("ヒーロー画面の「今すぐ始める」ボタンが /register に遷移する", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /今すぐ始める/ }).first().click();

    await expect(page).toHaveURL(/\/register$/);
  });

  test("ヒーロー画面にログインリンクが表示される", async ({ page }) => {
    await page.goto("/");

    const loginButton = page.getByRole("button", { name: /ログイン/ });
    await expect(loginButton).toBeVisible();
  });
});

test.describe("ログイン画面の登録リンク", () => {
  test("ログイン画面から登録画面へのリンクが機能する", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("link", { name: /新規登録/ }).click();

    await expect(page).toHaveURL(/\/register$/);
  });
});
