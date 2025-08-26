import { test, expect } from '@playwright/test';
test.use({ storageState: 'tests/.auth/e2e.json' });

test.describe('親/子の site 必須仕様', () => {
  test('親は現場名必須 / siteありは成功・なしは失敗', async ({ page }) => {
    await page.goto("/tasks");

    // site なし → ボタン disabled のまま
    await page.getByTestId('new-parent-title').fill(`P-${Date.now()}`);
    await expect(page.getByTestId('new-parent-submit')).toBeDisabled();

    // site あり → 成功
    const ok = `P-OK-${Date.now()}`;
    await page.getByTestId('new-parent-title').fill(ok);
    await page.getByTestId('new-parent-site').fill('E2E-SITE');
    await page.getByTestId('new-parent-deadline').fill('');
    await expect(page.getByTestId('new-parent-submit')).toBeEnabled();
    await page.getByTestId('new-parent-submit').click();

    await expect(page.locator('[data-testid^="task-item-"]').filter({ hasText: ok }).first()).toBeVisible();
  });


  test('子は site を送らず作成できる', async ({ page }) => {
    await page.goto("/tasks");
    const title = `ROOT-${Date.now()}`;
    await page.getByTestId('new-parent-title').fill(title);
    await page.getByTestId('new-parent-site').fill('E2E-SITE');
    await page.getByTestId('new-parent-submit').click();

    const parent = page.locator('[data-testid^="task-item-"]').filter({ hasText: title }).first();
    const addBtn = parent.getByTestId(/task-add-child-/).first();

    await addBtn.click();
    await parent.getByTestId('child-title-input').fill('子1');
    await parent.getByTestId('child-create-submit').click();
    await expect(parent.locator('[data-testid^="task-item-"]').filter({ hasText: '子1' }).first()).toBeVisible();
  });
});
