// tests/reorder-api-guard.spec.ts
import { test, expect } from "@playwright/test";
import { createTaskViaApi, ensureAuthTokens, openTasks } from "./helpers";
test("親またぎ reorder は 422 を返す", async ({ page }) => {
    await openTasks(page);
    await ensureAuthTokens(page);
    const pA = await createTaskViaApi(page, { title: `A-${Date.now()}`, site: "E2E" });
    const pB = await createTaskViaApi(page, { title: `B-${Date.now()}`, site: "E2E" });
    const a1 = await createTaskViaApi(page, { title: "a1", parent_id: pA.id });
    const b1 = await createTaskViaApi(page, { title: "b1", parent_id: pB.id });
    const result = await page.evaluate(async ({ aId, xId, now }) => {
        const headers = {
            "Content-Type": "application/json",
            Accept: "application/json",
            "x-auth-start": String(now),
        };
        const at = localStorage.getItem("access-token");
        const client = localStorage.getItem("client");
        const uid = localStorage.getItem("uid");
        const type = localStorage.getItem("token-type") || "Bearer";
        if (at && client && uid) {
            headers["access-token"] = at;
            headers["client"] = client;
            headers["uid"] = uid;
            headers["token-type"] = type;
            headers["Authorization"] = `${type} ${at}`;
        }
        const res = await fetch(`/api/tasks/${aId}/reorder`, {
            method: "POST", // Vite dev server が PATCH に書き換える
            headers,
            body: JSON.stringify({ after_id: xId }),
            credentials: "same-origin",
        });
        return { ok: res.ok, status: res.status };
    }, { aId: a1.id, xId: b1.id, now: Date.now() });
    expect(result.status).toBe(422);
});
