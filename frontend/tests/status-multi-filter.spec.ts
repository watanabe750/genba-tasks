import { test, expect } from "@playwright/test";
import { createTaskViaApi, openTasks } from "./helpers";

test("ステータス複数選択で絞り込める", async ({ page }) => {
  const site = `E2E-STAT-${Date.now()}`;
  await createTaskViaApi(page, { title: `A-${site}`, site, status: "not_started" });
  await createTaskViaApi(page, { title: `B-${site}`, site, status: "in_progress" });
  await createTaskViaApi(page, { title: `C-${site}`, site, status: "completed", progress: 100 });

  await openTasks(page);

  const bar = page.getByTestId("filter-bar");
  const group = bar.getByRole("group", { name: /ステータス/ });

  // 進行中だけ
  await group.getByRole("button", { name: "進行中" }).click();
  await expect(page.getByText(`B-${site}`)).toBeVisible();
  await expect(page.getByText(`A-${site}`)).toHaveCount(0);
  await expect(page.getByText(`C-${site}`)).toHaveCount(0);

  // 未着手も追加（2件）
  await group.getByRole("button", { name: "未着手" }).click();
  await expect(page.getByText(`A-${site}`)).toBeVisible();
  await expect(page.getByText(`B-${site}`)).toBeVisible();
  await expect(page.getByText(`C-${site}`)).toHaveCount(0);

  // 全解除で全件
  await bar.getByRole("button", { name: /すべて解除|クリア/ }).click();
  await expect(page.getByText(`A-${site}`)).toBeVisible();
  await expect(page.getByText(`B-${site}`)).toBeVisible();
  await expect(page.getByText(`C-${site}`)).toBeVisible();
});
