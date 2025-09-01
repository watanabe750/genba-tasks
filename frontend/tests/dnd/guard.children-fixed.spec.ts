// tests/dnd/guard.children-fixed.spec.ts
import { test, expect } from "@playwright/test";
import H from "./_helpers";

test.describe("@dnd 仕様：子はドラッグ不可", () => {
  test("子タスクはハンドルが出ず、順序は変わらない", async ({ page }) => {
    await page.goto("/tasks");
    const stamp = Date.now();

    const p = await H.apiCreateTask(page, { title: `E2E-G-P-${stamp}`, site: "e2e" });
    const a = await H.apiCreateTask(page, { title: `E2E-G-A-${stamp}`, parent_id: p.id });
    const b = await H.apiCreateTask(page, { title: `E2E-G-B-${stamp}`, parent_id: p.id });

    await page.reload();
    await expect(page.getByText(p.title)).toBeVisible();

    // 子はハンドルが無い
    await expect(page.locator(`[data-testid="task-drag-${a.id}"]`)).toHaveCount(0);

    // 並びは不変
    const [ia, ib] = await H.titleIndexes(page, [a.title, b.title]);
    expect(ia).toBeLessThan(ib);

    await H.apiDeleteTask(page, p.id);
  });
});
