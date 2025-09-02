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

export async function apiCreateTask(page, attrs: any) {
    return await page.evaluate(async (body) => {
      // localStorage のトークンをヘッダに乗せる
      const hdrs: Record<string, string> = {
        "content-type": "application/json",
        accept: "application/json",
      };
      const at = localStorage.getItem("access-token");
      const client = localStorage.getItem("client");
      const uid = localStorage.getItem("uid");
      const expiry = localStorage.getItem("expiry");
      const tokenType = localStorage.getItem("token-type") || "Bearer";
      if (at && client && uid) {
        hdrs["access-token"] = at;
        hdrs["client"] = client;
        hdrs["uid"] = uid;
        if (expiry) hdrs["expiry"] = expiry;
        if (tokenType) hdrs["token-type"] = tokenType;
      }
  
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: hdrs,
        body: JSON.stringify({ task: body }),
        credentials: "same-origin",
      });
  
      if (res.status === 401) {
        throw new Error(
          `create failed: ${JSON.stringify({ errors: ["You need to sign in or sign up before continuing."] })}`
        );
      }
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`create failed: ${t}`);
      }
  
      // トークンローテーション対応：返ってきたら保存
      const nat = res.headers.get("access-token");
      if (nat) localStorage.setItem("access-token", nat);
      const nclient = res.headers.get("client");
      if (nclient) localStorage.setItem("client", nclient);
      const nuid = res.headers.get("uid");
      if (nuid) localStorage.setItem("uid", nuid);
      const nexpiry = res.headers.get("expiry");
      if (nexpiry) localStorage.setItem("expiry", nexpiry);
      const nt = res.headers.get("token-type");
      if (nt) localStorage.setItem("token-type", nt);
  
      return await res.json();
    }, attrs);
  }

  export async function apiDeleteTask(page: Page, id: number) {
    await page.evaluate(async (tid) => {
      const hdrs: Record<string, string> = {
        accept: "application/json",
      };
      const at = localStorage.getItem("access-token");
      const client = localStorage.getItem("client");
      const uid = localStorage.getItem("uid");
      const expiry = localStorage.getItem("expiry");
      const tokenType = localStorage.getItem("token-type") || "Bearer";
      if (at && client && uid) {
        hdrs["access-token"] = at;
        hdrs["client"] = client;
        hdrs["uid"] = uid;
        if (expiry) hdrs["expiry"] = expiry;
        if (tokenType) hdrs["token-type"] = tokenType;
      }
  
      const res = await fetch(`/api/tasks/${tid}`, {
        method: "DELETE",
        headers: hdrs,
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(`delete failed: ${res.status}`);
  
      // トークンローテーション
      const nat = res.headers.get("access-token");
      if (nat) localStorage.setItem("access-token", nat);
      const nclient = res.headers.get("client");
      if (nclient) localStorage.setItem("client", nclient);
      const nuid = res.headers.get("uid");
      if (nuid) localStorage.setItem("uid", nuid);
      const nexpiry = res.headers.get("expiry");
      if (nexpiry) localStorage.setItem("expiry", nexpiry);
      const nt = res.headers.get("token-type");
      if (nt) localStorage.setItem("token-type", nt);
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
