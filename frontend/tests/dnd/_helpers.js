// tests/dnd/_helpers.ts
import { expect } from "@playwright/test";
import { ensureAuthTokens, createTaskViaApi, apiUrl, REQ_TIME_HEADER } from "../helpers";
export async function apiCreateTask(page, attrs) {
    await ensureAuthTokens(page);
    const body = {
        ...attrs,
        ...(attrs.parent_id == null && (attrs.site == null || attrs.site === "") ? { site: "E2E" } : {}),
    };
    return await createTaskViaApi(page, body);
}
export async function apiDeleteTask(page, id) {
    if (page.isClosed())
        return;
    try {
        await page.request.delete(apiUrl(`/api/tasks/${id}`), {
            headers: { [REQ_TIME_HEADER]: String(Date.now()) },
            timeout: 5000,
        });
    }
    catch { /* noop */ }
}
export async function titleIndexes(page, titles) {
    const idx = await page.$$eval('span[data-testid^="task-title-"]', (nodes, ts) => {
        const texts = nodes.map((n) => (n.textContent || "").trim());
        return ts.map((t) => texts.indexOf(t));
    }, titles);
    for (const [i, v] of idx.entries()) {
        if (v < 0)
            throw new Error(`title not found in DOM: ${titles[i]}`);
    }
    return idx;
}
/** 親のハンドルに対する drag-after 操作 */
export async function dragAfter(page, movingId, afterId) {
    const handle = page.locator(`[data-testid="task-drag-${movingId}"]`);
    const targetRow = page.locator(`[data-testid="task-item-${afterId}"]`);
    await expect(handle).toBeVisible();
    await expect(targetRow).toBeVisible();
    await handle.scrollIntoViewIfNeeded();
    await targetRow.scrollIntoViewIfNeeded();
    const h = await handle.boundingBox();
    const t = await targetRow.boundingBox();
    if (!h || !t)
        throw new Error("bbox not found");
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
    await page.mouse.down();
    await page.mouse.move(h.x + h.width / 2 + 8, h.y + h.height / 2 + 8);
    await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2);
    await page.mouse.up();
}
export default { apiCreateTask, apiDeleteTask, titleIndexes, dragAfter };
