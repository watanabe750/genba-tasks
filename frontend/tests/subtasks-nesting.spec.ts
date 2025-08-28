// tests/subtasks-nesting.spec.ts
import { test, expect } from '@playwright/test';
import { ensureAuthTokens, createTaskViaApi } from './helpers';

test.use({ storageState: 'tests/.auth/e2e.json' });

test.beforeEach(async ({ page }) => {
  await page.goto('/tasks');
  await ensureAuthTokens(page);
  await page.reload();
});

test('親に子4つまで、5つ目は不可', async ({ page }) => {
  const { id: parentId } = await createTaskViaApi(page, {
    title: `P-${Date.now()}`,
    site: 'E2E-NEST',
    parent_id: null,
  });

  const parent = page.locator(`[data-testid="task-item-${parentId}"]`).first();
  const addBtn = parent.getByTestId(/task-add-child-/).first();
  await expect(addBtn).toBeEnabled();

  for (let i = 1; i <= 4; i++) {
    await addBtn.click();
    await parent.getByTestId('child-title-input').fill(`c${i}`);
    await parent.getByTestId('child-create-submit').click();
    await expect(parent.locator('[data-testid^="task-item-"]').filter({ hasText: `c${i}` }).first()).toBeVisible();
  }
  await expect(addBtn).toBeDisabled();
});

test('子の下にさらに子を作れる（ネスト作成+折りたたみ）', async ({ page }) => {
  const { id: rootId } = await createTaskViaApi(page, {
    title: `Root-${Date.now()}`,
    site: 'E2E-NEST2',
    parent_id: null,
  });

  const root = page.locator(`[data-testid="task-item-${rootId}"]`).first();
  const addRoot = root.getByTestId(/task-add-child-/).first();
  await expect(addRoot).toBeEnabled();

  await addRoot.click();
  await root.getByTestId('child-title-input').fill('L1');
  await root.getByTestId('child-create-submit').click();

  const l1 = root.locator('[data-testid^="task-item-"]').filter({ hasText: 'L1' }).first();
  await expect(l1).toBeVisible();

  const addL1 = l1.getByTestId(/task-add-child-/).first();
  await expect(addL1).toBeEnabled();
  await addL1.click();
  await l1.getByTestId('child-title-input').fill('L2');
  await l1.getByTestId('child-create-submit').click();

  await expect(l1.locator('[data-testid^="task-item-"]').filter({ hasText: 'L2' }).first()).toBeVisible();
});
