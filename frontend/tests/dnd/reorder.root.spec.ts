import { test, expect } from "@playwright/test";
import H from "./_helpers";

test.use({ storageState: "tests/.auth/e2e.json" });

test.describe("@dnd 親の並べ替え（root）", () => {
  test("親タスクを after 仕様で並べ替えできる", async ({ page }) => {
    await page.goto("/tasks");
    await page.evaluate(() => window.dispatchEvent(new Event("auth:refresh")));
    await page
      .waitForResponse((r) => r.url().includes("/api/tasks") && r.request().method() === "GET" && r.status() === 200, { timeout: 10_000 })
      .catch(() => {});

    const stamp = Date.now();
    const p1 = await H.apiCreateTask(page, { title: `E2E-ROOT-P1-${stamp}`, site: "e2e" });
    const p2 = await H.apiCreateTask(page, { title: `E2E-ROOT-P2-${stamp}`, site: "e2e" });
    const p3 = await H.apiCreateTask(page, { title: `E2E-ROOT-P3-${stamp}`, site: "e2e" });

    await page.reload();
    await expect(page.getByText(p1.title)).toBeVisible();

    // 初期順（p1 < p2 < p3）
    let [i1, i2, i3] = await H.titleIndexes(page, [p1.title, p2.title, p3.title]);
    expect(i1).toBeLessThan(i2);
    expect(i2).toBeLessThan(i3);

    // p3 を p1 の後ろへ
    await H.dragAfter(page, p3.id, p1.id);

    await expect.poll(async () => {
      const [j1, j2, j3] = await H.titleIndexes(page, [p1.title, p2.title, p3.title]);
      return j1 < j3 && j3 < j2; // 期待: p1 < p3 < p2
    }).toBeTruthy();

    await H.apiDeleteTask(page, p1.id);
    await H.apiDeleteTask(page, p2.id);
    await H.apiDeleteTask(page, p3.id);
  });
});
