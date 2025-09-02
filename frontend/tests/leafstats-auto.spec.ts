import { test, expect } from "@playwright/test";
import { createTaskViaApi } from "./helpers";

test.use({ storageState: "tests/.auth/e2e.json" });

test("子完了で親の 自動 x/y OK が更新される", async ({ page }) => {
  await page.goto("/tasks");

  const parent = await createTaskViaApi(page, { title: `LEAF-${Date.now()}`, site: "E2E-LEAF", parent_id: null });
  const a = await createTaskViaApi(page, { title: "A", parent_id: parent.id, status: "in_progress", progress: 0 });
  await createTaskViaApi(page, { title: "B", parent_id: parent.id, status: "in_progress", progress: 0 });

  await page.reload();
  await page
    .waitForResponse((r) => r.url().includes("/api/tasks") && r.request().method() === "GET" && r.status() === 200, { timeout: 10_000 })
    .catch(() => {});
  await page.waitForLoadState("networkidle");

  const badge = page.getByTestId(`leafstats-${parent.id}`);

  // 初期 0/2 を確認
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText(/自動\s*0\/2\s*OK/);

  // A を完了 → 反映後に 1/2 へ
  await page.getByTestId(`task-done-${a.id}`).check();
  await page
    .waitForResponse((r) => r.url().includes(`/api/tasks/${a.id}`) && r.status() === 200, { timeout: 10_000 })
    .catch(() => {});
  await page.reload();
  await page
    .waitForResponse((r) => r.url().includes("/api/tasks") && r.request().method() === "GET" && r.status() === 200, { timeout: 10_000 })
    .catch(() => {});
  await page.waitForLoadState("networkidle");

  await expect(badge).toHaveText(/自動\s*1\/2\s*OK/);
});
