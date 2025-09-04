// tests/setup/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const EMAIL = 'e2e@example.com';
const PASS  = 'password';

setup('create storageState (logged-in)', async ({ page }) => {
  await page.goto('/login');

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
    await page.context().storageState({ path: 'tests/.auth/storage.json' });
    return;
  }

  await page.getByTestId('login-email').fill(EMAIL);
  await page.getByTestId('login-password').fill(PASS);
  await page.getByRole('button', { name: 'ログイン' }).click();

  await Promise.race([
    page.waitForURL('**/tasks', { timeout: 10_000 }),
    page.waitForSelector('[data-testid="parent-create-title"]', { timeout: 10_000 }),
    page.waitForFunction(() => !!localStorage.getItem('access-token'), null, { timeout: 10_000 }),
  ]);

  await page.goto('/tasks');

  const tokens = await page.evaluate(() => ({
    at: localStorage.getItem('access-token'),
    client: localStorage.getItem('client'),
    uid: localStorage.getItem('uid'),
  }));
  expect(!!(tokens.at && tokens.client && tokens.uid)).toBeTruthy();

  await page.context().storageState({ path: 'tests/.auth/storage.json' });
});
