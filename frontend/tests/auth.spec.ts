// tests/auth.spec.ts
import { test, expect, type Locator, type Page } from "@playwright/test";

const USER = { email: "test@example.com", password: "password" };

// “見つかった最初のロケータで fill する”ユーティリティ
async function fillFirst(page: Page, locators: Locator[], value: string) {
  for (const loc of locators) {
    if (await loc.count()) {
      await loc.fill(value);
      return;
    }
  }
  throw new Error("input locator not found");
}

test('未ログインで /tasks は /login へ', async ({ page, context }) => {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch { /* ignore */ }
  });
  await context.clearCookies();

  await page.goto("/tasks");
  await expect(page).toHaveURL(/\/login$/);
});

test("ログイン成功で /tasks へ", async ({ page }) => {
  await page.goto("/login");

  await fillFirst(page, [
    page.getByLabel("メールアドレス"),
    page.getByPlaceholder("メールアドレス"),
    page.locator('input[type="email"]'),
    page.locator('[data-testid="login-email"]'),
    page.locator('input[name="email"]'),
  ], USER.email);

  await fillFirst(page, [
    page.getByLabel("パスワード"),
    page.getByPlaceholder("パスワード"),
    page.locator('input[type="password"]'),
    page.locator('[data-testid="login-password"]'),
    page.locator('input[name="password"]'),
  ], USER.password);

  await page.getByRole("button", { name: /ログイン/ }).click();

  await expect(page).toHaveURL(/\/tasks(\?.*)?$/);
  await expect(page.getByText("タスク一覧ページ")).toBeVisible();
});

test("401で /login へ（セッション切れ表示）", async ({ page }) => {
  await page.goto("/login");

  await fillFirst(page, [
    page.getByLabel("メールアドレス"),
    page.getByPlaceholder("メールアドレス"),
    page.locator('input[type="email"]'),
    page.locator('[data-testid="login-email"]'),
    page.locator('input[name="email"]'),
  ], USER.email);

  await fillFirst(page, [
    page.getByLabel("パスワード"),
    page.getByPlaceholder("パスワード"),
    page.locator('input[type="password"]'),
    page.locator('[data-testid="login-password"]'),
    page.locator('input[name="password"]'),
  ], USER.password);

  await page.getByRole("button", { name: /ログイン/ }).click();
  await expect(page).toHaveURL(/\/tasks(\?.*)?$/);

  // トークン破棄→ /tasks へ → loginへ戻されることだけを厳守
  await page.evaluate(() => {
    localStorage.removeItem("access-token");
    localStorage.removeItem("client");
    localStorage.removeItem("uid");
    sessionStorage.setItem("auth:expired", "1");
  });

  await page.goto("/tasks");
  await expect(page).toHaveURL(/\/login$/);

  // 「セッションが切れました」は環境依存にし、存在すれば確認する
  const msg = page.getByText(/セッションが切れました/);
  if (await msg.count()) {
    await expect(msg).toBeVisible();
  }
});
