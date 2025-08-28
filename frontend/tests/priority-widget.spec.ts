// tests/priority-widget.spec.ts
import { test, expect } from "@playwright/test";
import { ensureAuthTokens, createTaskViaApi } from "./helpers";

test.use({ storageState: "tests/.auth/e2e.json" });

const isoAt00 = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

test("優先タスクの完了トグルで該当項目が消える", async ({ page }) => {
  await page.goto("/tasks");
  await ensureAuthTokens(page);
  await page.reload(); // AuthProvider にヘッダ再適用

  let panel = page.getByTestId("priority-panel");
  let count0 = await panel.getByTestId("priority-item").count();

  if (count0 === 0) {
    // 優先に乗りやすい today / yesterday で2件播種
    const todayTitle = `PRI-${Date.now()}-T`;
    const yestTitle = `PRI-${Date.now()}-Y`;
    await createTaskViaApi(page, {
      title: todayTitle,
      site: "E2E-PRI",
      deadline: isoAt00(new Date()),
      parent_id: null,
      status: "in_progress",
      progress: 0,
    });
    await createTaskViaApi(page, {
      title: yestTitle,
      site: "E2E-PRI",
      deadline: isoAt00(new Date(Date.now() - 24 * 60 * 60 * 1000)),
      parent_id: null,
      status: "in_progress",
      progress: 0,
    });

    await page.reload();
    await page
      .waitForResponse((r) => r.url().includes("/api/tasks/priority") && r.status() === 200, { timeout: 10_000 })
      .catch(() => {});
    panel = page.getByTestId("priority-panel");

    await expect
      .poll(async () => await panel.getByTestId("priority-item").count(), { timeout: 10_000 })
      .toBeGreaterThan(0);
  }

  const first = panel.getByTestId("priority-item").first();
  const titleText = (await first.getByTestId("priority-title").innerText()).trim();

  await first.getByTestId("priority-done").click();
  await expect(panel.getByTestId("priority-item").filter({ hasText: titleText })).toHaveCount(0);
});
