// tests/.auth/setup.spec.ts
import { test, expect } from '@playwright/test';

test('login and save storage', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('メール').fill('e2e@example.com');
  await page.getByLabel('パスワード').fill('password');
  await page.getByRole('button', { name: 'ログイン' }).click();

  await expect(page.getByText('uid: e2e@example.com')).toBeVisible();

  // ★ localStorage に DTA が入っていることを確認（入ってなければここで止まる）
  const dta = await page.evaluate(() => ({
        at: localStorage.getItem('access-token'),
        client: localStorage.getItem('client'),
        uid: localStorage.getItem('uid'),
      }));
      expect(!!(dta.at && dta.client && dta.uid)).toBeTruthy();
    
      // ★ /tasks を開いて UI 側も安定させてから保存
      await page.goto('/tasks');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('task-list-root')).toBeVisible();

  await page.context().storageState({ path: 'tests/.auth/e2e.json' });
});
