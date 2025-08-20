import { test, expect } from '@playwright/test';
import { login, createTaskViaApi } from './helpers';

test.beforeEach(async ({ page }) => { await login(page); });

// 各ノード、子は最大4つまで／5つ目は不可
test('親に子4つまで、5つ目は不可', async ({ page }) => {
  const p = await createTaskViaApi(page, `E2E親-${Date.now()}`);
  await page.goto('/tasks');

  const parent = page.getByTestId(`task-item-${p.id}`);
  await expect(parent).toBeVisible();

  // 4つ連続作成（ボタンは testid で特定）
  const plus = parent.getByTestId(`task-add-child-${p.id}`);
  for (let i = 1; i <= 4; i++) {
    await plus.scrollIntoViewIfNeeded();
    await plus.click();
    await parent.getByLabel('サブタスク名').fill(`子${i}`);
    await parent.getByRole('button', { name: '作成' }).click();
    await expect(parent.getByRole('heading', { name: `子${i}` })).toBeVisible();
  }

  // 5つ目は disabled になっているはず（アラートブロックでもOKだが disabled を優先確認）
  await expect(plus).toBeDisabled();
});

// 子→孫（深さ2→3）も作れる（深さ制限なし）
test('子の下にさらに子を作れる（ネスト作成+折りたたみ）', async ({ page }) => {
  const p = await createTaskViaApi(page, `E2E親-${Date.now()}`);
  await page.goto('/tasks');
  const parent = page.getByTestId(`task-item-${p.id}`);

  // 親に 子A（ID付きで一意に）
  const plusParent = parent.getByTestId(`task-add-child-${p.id}`);
  await plusParent.scrollIntoViewIfNeeded();
  await expect(plusParent).toBeEnabled();
  await plusParent.click();
  await parent.getByLabel('サブタスク名').fill('子A');
  await parent.getByRole('button', { name: '作成' }).click();
  const childA = page.locator('[data-testid^="task-item-"]', { has: page.getByRole('heading', { name: '子A' }) }).first();
  await expect(childA).toBeVisible();

  // 子Aの下に 孫A-1
  await childA.locator('[data-testid^="task-add-child-"]').first().click();
  await childA.getByLabel('サブタスク名').fill('孫A-1');
  await childA.getByRole('button', { name: '作成' }).click();
  await expect(childA.getByRole('heading', { name: '孫A-1' })).toBeVisible();

  // 親で折りたたみ → 子A/孫A-1が隠れる → 再表示
  const toggleHide = parent.getByRole('button', { name: /子を隠す/ });
  await toggleHide.click();
  await expect(parent.getByRole('heading', { name: '子A' })).toHaveCount(0);

  const toggleShow = parent.getByRole('button', { name: /子を表示/ });
  await toggleShow.click();
  await expect(parent.getByRole('heading', { name: '子A' })).toBeVisible();
});
