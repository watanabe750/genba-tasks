import { Page, expect } from "@playwright/test";

type NewTask = {
  title: string;
  site?: string | null;
  parent_id?: number | null;
  status?: "not_started" | "in_progress" | "completed";
  progress?: number | null;
  deadline?: string | null;
  description?: string | null;
};

export async function apiCreateTask(page: Page, task: NewTask) {
  const json = await page.evaluate(async (t) => {
    const at = localStorage.getItem("access-token");
    const client = localStorage.getItem("client");
    const uid = localStorage.getItem("uid");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "access-token": at ?? "",
        client: client ?? "",
        uid: uid ?? "",
      },
      body: JSON.stringify({ task: t }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`create failed: ${JSON.stringify(data)}`);
    return data;
  }, task);
  return json as { id: number; title: string; parent_id: number | null };
}

export async function apiDeleteTask(page: Page, id: number) {
  await page.evaluate(async (tid) => {
    const at = localStorage.getItem("access-token");
    const client = localStorage.getItem("client");
    const uid = localStorage.getItem("uid");
    const res = await fetch(`/api/tasks/${tid}`, {
      method: "DELETE",
      headers: {
        "access-token": at ?? "",
        client: client ?? "",
        uid: uid ?? "",
      },
    });
    if (!res.ok) throw new Error(`delete failed: ${res.status}`);
  }, id);
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
  for (const [i, v] of idx.entries()) {
    if (v < 0) throw new Error(`title not found in DOM: ${titles[i]}`);
  }
  return idx as number[];
}

/**
 * 「行 after 挿入」を安定再現。
 * 親のハンドル（可視）に対して使う想定。子でハンドルが非表示なら使わない。
 */
export async function dragAfter(page: Page, movingId: number, afterId: number) {
  const handle = page.locator(`[data-testid="task-drag-${movingId}"]`);
  const targetRow = page.locator(`[data-testid="task-item-${afterId}"]`);
  await expect(handle).toBeVisible();
  await expect(targetRow).toBeVisible();
  await handle.scrollIntoViewIfNeeded();

  await handle.scrollIntoViewIfNeeded();
  await targetRow.scrollIntoViewIfNeeded();

  const h = await handle.boundingBox();
  const t = await targetRow.boundingBox();
  if (!h || !t) throw new Error("bbox not found");

  // しっかり dragstart させるために閾値を超えてから目的地へ
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(h.x + h.width / 2 + 8, h.y + h.height / 2 + 8);
  await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2);
  await page.mouse.up();
}

export default { apiCreateTask, apiDeleteTask, titleIndexes, dragAfter };
