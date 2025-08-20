import { expect, Page } from '@playwright/test';

export const USER = { email: 'test@example.com', password: 'password' };

export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('メールアドレス').fill(USER.email);
  await page.getByLabel('パスワード').fill(USER.password);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByText('タスク一覧ページ')).toBeVisible();
}

export async function tokensFromLocalStorage(page: Page) {
  return await page.evaluate(() => ({
    at: localStorage.getItem('access-token'),
    client: localStorage.getItem('client'),
    uid: localStorage.getItem('uid'),
  }));
}

// strong_params 前提 { task: {...} }
export async function createTaskViaApi(page: Page, title: string) {
  const { at, client, uid } = await tokensFromLocalStorage(page);
  if (!at || !client || !uid) throw new Error('No auth tokens');

  const res = await page.request.post('/api/tasks', {
    headers: { 'access-token': at, client, uid },
    data: { task: { title, status: 'in_progress', progress: 0, deadline: null, parent_id: null } },
  });
  if (!res.ok()) throw new Error(`createTask failed: ${res.status()}`);
  const json = await res.json();
  return json; // Task
}
