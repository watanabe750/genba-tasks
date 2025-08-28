// tests/site-required.spec.ts
import { test, expect } from '@playwright/test';
import { ensureAuthTokens, createTaskViaApi } from './helpers';

test.use({ storageState: 'tests/.auth/e2e.json' });

test.describe('親/子の site 必須仕様', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tasks");
    await ensureAuthTokens(page);
    await page.reload();
  });

  test('親は現場名必須 / siteありは成功・なしは失敗', async ({ page }) => {
    await page.getByTestId('new-parent-title').fill(`P-${Date.now()}`);

    // site なし → disabled
    await expect(page.getByTestId('new-parent-submit')).toBeDisabled();

    // site あり → enabled（作成自体は他テストで担保）
    await page.getByTestId('new-parent-site').fill('E2E-SITE');
    await expect(page.getByTestId('new-parent-submit')).toBeEnabled();
  });

  test('子は site を送らず作成できる', async ({ page }) => {
    // 親はAPIで播種（UI作成で401リダイレクトの揺らぎを避ける）
    const { id: parentId } = await createTaskViaApi(page, {
      title: `ROOT-${Date.now()}`,
      site: 'E2E-SITE',
      parent_id: null,
    });

    const parent = page.locator(`[data-testid="task-item-${parentId}"]`).first();
    await expect(parent).toBeVisible();

    const addBtn = parent.getByTestId(/task-add-child-/).first();
    await expect(addBtn).toBeEnabled();
    await addBtn.click();

    await parent.getByTestId('child-title-input').fill('子1');
    await parent.getByTestId('child-create-submit').click();

    await expect(parent.locator('[data-testid^="task-item-"]').filter({ hasText: '子1' }).first()).toBeVisible();
  });
});
