import { test, expect } from '@playwright/test';

const USER = { email: 'test@example.com', password: 'password' };

test('未ログインで /tasks は /login へ', async ({ page }) => {
  await page.goto('/tasks');
  await expect(page).toHaveURL(/\/login$/);
});

test('ログイン成功で /tasks へ', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('メールアドレス').fill(USER.email);
  await page.getByLabel('パスワード').fill(USER.password);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByText('タスク一覧ページ')).toBeVisible();
});

test('401で /login へ（セッション切れ表示）', async ({ page }) => {
    // まずログイン
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill(USER.email);
    await page.getByLabel('パスワード').fill(USER.password);
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page).toHaveURL(/\/tasks$/);
  
  // トークンを消して未ログイン状態にし、セッション切れフラグを明示的に立てる
  await page.evaluate(() => {
    localStorage.removeItem('access-token');
    localStorage.removeItem('client');
    localStorage.removeItem('uid');
    sessionStorage.setItem('auth:expired', '1'); // ← ログイン画面で一度だけ表示されるバナー用
  });
  
    // 保護ページを踏ませて /login へ誘導（RequireAuth でリダイレクト）
  await page.goto('/tasks');
  await expect(page).toHaveURL(/\/login$/);
  
    // セッション切れのバナーが表示されること
  await expect(page.getByText(/セッションが切れました/)).toBeVisible();
  });