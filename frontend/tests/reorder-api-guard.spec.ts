// tests/reorder-api-guard.spec.ts
import { test, expect } from "@playwright/test";
import { ensureAuthTokens, createTaskViaApi } from "./helpers";

test.use({ storageState: "tests/.auth/e2e.json" });

test("親またぎ reorder は 422 を返す", async ({ page }) => {
  await page.goto("/tasks");
  await ensureAuthTokens(page); // localStorage に DTA トークンを入れる

  const p1 = await createTaskViaApi(page, { title: `P1-${Date.now()}`, site: "E2E", parent_id: null });
  const a  = await createTaskViaApi(page, { title: `A-${Date.now()}`,  parent_id: p1.id });
  const p2 = await createTaskViaApi(page, { title: `P2-${Date.now()}`, site: "E2E", parent_id: null });
  const x  = await createTaskViaApi(page, { title: `X-${Date.now()}`,  parent_id: p2.id });

  // ← ブラウザ側の fetch で localStorage の DTA ヘッダを付けて叩く
  const result = await page.evaluate(async ({ aId, xId }) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const at = localStorage.getItem("access-token");
    const client = localStorage.getItem("client");
    const uid = localStorage.getItem("uid");
    if (at && client && uid) {
      headers["access-token"] = at;
      headers["client"] = client;
      headers["uid"] = uid;
    }

    const res = await fetch(`/api/tasks/${aId}/reorder?after_id=${xId}`, {
      method: "PATCH",
      headers,
      credentials: "same-origin",
    });

    let body: any = null;
    try { body = await res.json(); } catch { body = await res.text(); }

    return { status: res.status, body };
  }, { aId: a.id, xId: x.id });

  // デバッグ時に中身が見やすいように失敗メッセージを含める
  expect(result.status, `unexpected: ${JSON.stringify(result.body)}`).toBe(422);
});
