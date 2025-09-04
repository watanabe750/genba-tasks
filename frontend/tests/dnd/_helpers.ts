// tests/dnd/_helpers.ts
import { Page, expect } from "@playwright/test";
import { ensureAuthTokens, createTaskViaApi, apiUrl, REQ_TIME_HEADER } from "../helpers";

type NewTask = {
  title: string;
  site?: string | null;
  parent_id?: number | null;
  status?: "not_started" | "in_progress" | "completed";
  progress?: number | null;
  deadline?: string | null;
  description?: string | null;
};

export async function apiCreateTask(page: Page, attrs: NewTask) {
  await ensureAuthTokens(page);

  const body: NewTask = {
    ...attrs,
    ...(attrs.parent_id == null && (attrs.site == null || attrs.site === "") ? { site: "E2E" } : {}),
  };

  return await createTaskViaApi(page, body);
}

export async function apiDeleteTask(page: Page, id: number) {
  if (page.isClosed()) return;
  try {
    await page.request.delete(apiUrl(`/api/tasks/${id}`), {
      headers: { [REQ_TIME_HEADER]: String(Date.now()) },
      timeout: 5000,
    });
  } catch { /* noop */ }
}

export async function titleIndexes(page: Page, titles: string[]) {
  const idx = await page.$$eval(
    'span[data-testid^="task-title-"]',
    (nodes, ts) => {
      const texts = nodes.map((n) => (n.textContent || "").trim());
      return (ts as string[]).map((t) => texts.indexOf(t));
    },
    titles
  );
  for (const [i, v] of (idx as number[]).entries()) {
    if (v < 0) throw new Error(`title not found in DOM: ${titles[i]}`);
  }
  return idx as number[];
}

/** 親のハンドルに対する drag-after 操作 */
export async function dragAfter(page: Page, movingId: number, afterId: number) {
  const handle = page.locator(`[data-testid="task-drag-${movingId}"]`);
  const targetRow = page.locator(`[data-testid="task-item-${afterId}"]`);
  await expect(handle).toBeVisible();
  await expect(targetRow).toBeVisible();
  await handle.scrollIntoViewIfNeeded();
  await targetRow.scrollIntoViewIfNeeded();

  const h = await handle.boundingBox();
  const t = await targetRow.boundingBox();
  if (!h || !t) throw new Error("bbox not found");

  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(h.x + h.width / 2 + 8, h.y + h.height / 2 + 8);
  await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2);
  await page.mouse.up();
}

export default { apiCreateTask, apiDeleteTask, titleIndexes, dragAfter };
