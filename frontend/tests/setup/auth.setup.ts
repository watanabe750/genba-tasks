// tests/setup/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const EMAIL = 'e2e@example.com';
const PASS  = 'password';

setup('create storageState (logged-in)', async ({ page }) => {
  // まず /login へ
  await page.goto('/login');

  // すでにログイン済みならそのまま保存
  await Promise.race([
    page.waitForURL('**/tasks', { timeout: 800 }),
    page.waitForURL('**/login', { timeout: 800 }),
  ]).catch(() => {});
  if (!page.url().includes('/login')) {
    const tokens = await page.evaluate(() => ({
      at: localStorage.getItem('access-token'),
      client: localStorage.getItem('client'),
      uid: localStorage.getItem('uid'),
    }));
    expect(!!(tokens.at && tokens.client && tokens.uid)).toBeTruthy();
    await page.context().storageState({ path: '.auth.json' });
    return;
  }

  // UIでログイン
  await page.getByTestId('login-email').fill(EMAIL);
  await page.getByTestId('login-password').fill(PASS);
  await page.getByRole('button', { name: 'ログイン' }).click();

  // URL 遷移 or フォーム描画 or トークン書き込み完了のいずれかを待つ
  await Promise.race([
    page.waitForURL('**/tasks', { timeout: 10_000 }),
    page.waitForSelector('[data-testid="parent-create-title"]', { timeout: 10_000 }),
    page.waitForFunction(() => !!localStorage.getItem('access-token'), null, { timeout: 10_000 }),
  ]);

  // 念のため /tasks を踏んでおく（origin固定 & キャッシュ安定）
  await page.goto('/tasks');

  // localStorage に DTA トークンが入っていることを確認
  const tokens = await page.evaluate(() => ({
    at: localStorage.getItem('access-token'),
    client: localStorage.getItem('client'),
    uid: localStorage.getItem('uid'),
  }));
  expect(!!(tokens.at && tokens.client && tokens.uid)).toBeTruthy();

  // これで .auth.json に localStorage が保存される
  await page.context().storageState({ path: '.auth.json' });
});
