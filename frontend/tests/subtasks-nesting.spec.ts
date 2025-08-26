import { test, expect } from '@playwright/test';
test.use({ storageState: 'tests/.auth/e2e.json' });

test('親に子4つまで、5つ目は不可', async ({ page }) => {
  await page.goto('/tasks');

  const title = `P-${Date.now()}`;
  await page.getByTestId('new-parent-title').fill(title);
  await page.getByTestId('new-parent-site').fill('E2E-NEST');
  await page.getByTestId('new-parent-submit').click();

  const parent = page.locator('[data-testid^="task-item-"]').filter({ hasText: title }).first();
  const addBtn = parent.getByTestId(/task-add-child-/).first();

  for (let i = 1; i <= 4; i++) {
    await addBtn.click();
    await parent.getByTestId('child-title-input').fill(`c${i}`);
    await parent.getByTestId('child-create-submit').click();
    await expect(parent.locator('[data-testid^="task-item-"]').filter({ hasText: `c${i}` }).first()).toBeVisible();
  }
  await expect(addBtn).toBeDisabled();
});

test('子の下にさらに子を作れる（ネスト作成+折りたたみ）', async ({ page }) => {
  await page.goto('/tasks');

  const title = `Root-${Date.now()}`;
  await page.getByTestId('new-parent-title').fill(title);
  await page.getByTestId('new-parent-site').fill('E2E-NEST2');
  await page.getByTestId('new-parent-submit').click();

  const root = page.locator('[data-testid^="task-item-"]').filter({ hasText: title }).first();
  const addRoot = root.getByTestId(/task-add-child-/).first();

  // 子1
  await addRoot.click();
  await root.getByTestId('child-title-input').fill('L1');
  await root.getByTestId('child-create-submit').click();
  const l1 = root.locator('[data-testid^="task-item-"]').filter({ hasText: 'L1' }).first();
  await expect(l1).toBeVisible();

  // L1の子
  const addL1 = l1.getByTestId(/task-add-child-/).first();
  await addL1.click();
  await l1.getByTestId('child-title-input').fill('L2');
  await l1.getByTestId('child-create-submit').click();
  await expect(l1.locator('[data-testid^="task-item-"]').filter({ hasText: 'L2' }).first()).toBeVisible();
});