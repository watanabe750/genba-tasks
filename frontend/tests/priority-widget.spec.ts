// tests/priority-widget.spec.ts
import { test, expect } from "@playwright/test";
test.use({ storageState: "tests/.auth/e2e.json" });

function yyyy_mm_dd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

test("優先タスクの完了トグルで該当項目が消える", async ({ page }) => {
  await page.goto("/tasks");

  const panel = page.getByTestId("priority-panel");
  const count0 = await panel.getByTestId("priority-item").count();

  if (count0 === 0) {
    const title = `PRI-SEED-${Date.now()}`;
    await page.getByTestId("new-parent-title").fill(title);
    await page.getByTestId("new-parent-site").fill("E2E-PRI");
    await page.getByTestId("new-parent-deadline").fill("1970-01-01"); // 超早期
    await page.getByTestId("new-parent-submit").click();

    // ★ 優先タスク API の再フェッチを待つ
    await page
      .waitForResponse((r) => r.url().includes("/api/tasks/priority") && r.status() === 200, { timeout: 10_000 })
      .catch(() => {});
    await page.waitForLoadState("networkidle");

    // poll で 0→1 を安定確認
    await expect
      .poll(async () => await panel.getByTestId("priority-item").filter({ hasText: title }).count(), { timeout: 10_000 })
      .toBe(1);
  }

  // 先頭アイテムのタイトルを取得
  const first = panel.getByTestId("priority-item").first();
  const titleText = (await first.getByTestId("priority-title").innerText()).trim();

  // 完了チェック → そのタイトル行が消えるまで待つ
  await first.getByTestId("priority-done").click();
  await expect(panel.getByTestId("priority-item").filter({ hasText: titleText })).toHaveCount(0);
});
