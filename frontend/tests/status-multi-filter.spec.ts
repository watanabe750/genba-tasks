// tests/status-multi-filter.spec.ts
import { test, expect } from "@playwright/test";
import { ensureAuthTokens, createTaskViaApi } from "./helpers";

test.use({ storageState: "tests/.auth/e2e.json" });

test("ステータス複数選択で絞り込める", async ({ page }) => {
  await page.goto("/tasks");
  await ensureAuthTokens(page);
  await page.reload();

  const site = `E2E-STAT-${Date.now()}`;
  await createTaskViaApi(page, { title: `A-${site}`, site, parent_id: null, status: "not_started",  progress: 0   });
  await createTaskViaApi(page, { title: `B-${site}`, site, parent_id: null, status: "in_progress",  progress: 0   });
  await createTaskViaApi(page, { title: `C-${site}`, site, parent_id: null, status: "completed",    progress: 100 });

  const bar = page.getByTestId("filter-bar");
  await bar.getByTestId("filter-site").fill(site);

  const group = bar.getByRole("group", { name: "ステータスで絞り込み" });

  // いったん全解除（押されていれば外す）
  for (const name of ["未着手", "進行中", "完了"]) {
    const btn = group.getByRole("button", { name });
    if ((await btn.getAttribute("aria-pressed")) === "true") await btn.click();
  }

  // 「進行中」だけ
  await group.getByRole("button", { name: "進行中" }).click();
  await expect(page.getByText(`B-${site}`)).toBeVisible();
  await expect(page.getByText(`A-${site}`)).toHaveCount(0);
  await expect(page.getByText(`C-${site}`)).toHaveCount(0);

  // 「未着手」を追加（2件）
  await group.getByRole("button", { name: "未着手" }).click();
  await expect(page.getByText(`A-${site}`)).toBeVisible();
  await expect(page.getByText(`B-${site}`)).toBeVisible();
  await expect(page.getByText(`C-${site}`)).toHaveCount(0);
});
