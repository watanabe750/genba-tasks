import { test, expect } from "@playwright/test";

const USER = { email: "test@example.com", password: "password" };

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
  await page.getByLabel("メールアドレス").fill(USER.email);
  await page.getByLabel("パスワード").fill(USER.password);
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/tasks(\?.*)?$/);
  await expect(page.getByText("タスク一覧ページ")).toBeVisible();
});

test("401で /login へ（セッション切れ表示）", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill(USER.email);
  await page.getByLabel("パスワード").fill(USER.password);
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/tasks(\?.*)?$/);

  await page.evaluate(() => {
    localStorage.removeItem("access-token");
    localStorage.removeItem("client");
    localStorage.removeItem("uid");
    sessionStorage.setItem("auth:expired", "1");
  });

  await page.goto("/tasks");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText(/セッションが切れました/)).toBeVisible();
});
