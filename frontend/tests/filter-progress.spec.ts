// tests/filter-progress.spec.ts（置き換え）
import { test, expect } from "@playwright/test";
import { createTaskViaApi, ensureAuthTokens } from "./helpers";

test.use({ storageState: "tests/.auth/e2e.json" });

async function openTasksWithBar(page) {
  await page.goto("/tasks");
  await ensureAuthTokens(page);
  await page.reload();
  await page.waitForSelector('[data-testid="filter-bar"]', { timeout: 10_000 });
  await page.waitForLoadState("networkidle");
}

async function waitForFetch(page, qs: string[]) {
  await page
    .waitForResponse(
      (r) =>
        r.url().includes("/api/tasks") &&
        r.request().method() === "GET" &&
        qs.every((k) => r.url().includes(k)) &&
        r.status() === 200,
      { timeout: 10_000 }
    )
    .catch(() => {});
  await page.waitForLoadState("networkidle");
}

test("進捗 20–80 だけ表示（0/100 は除外）", async ({ page }) => {
  await openTasksWithBar(page);

  const site = `E2E-PROG-${Date.now()}`;
  const t0   = await createTaskViaApi(page, { title: "p0",   site, parent_id: null, progress: 0 });
  const t20  = await createTaskViaApi(page, { title: "p20",  site, parent_id: null, progress: 20 });
  const t50  = await createTaskViaApi(page, { title: "p50",  site, parent_id: null, progress: 50 });
  const t80  = await createTaskViaApi(page, { title: "p80",  site, parent_id: null, progress: 80 });
  const t100 = await createTaskViaApi(page, { title: "p100", site, parent_id: null, progress: 100 });

  const bar = page.getByTestId("filter-bar");

  // 現場名で対象だけに絞る → まず site クエリ反映を待つ
  await bar.getByTestId("filter-site").fill(site);
  await waitForFetch(page, [encodeURIComponent(`site=${site}`)]);

  // 進捗レンジ
  await bar.getByTestId("progress-min").fill("20");
  await bar.getByTestId("progress-max").fill("80");
  await waitForFetch(page, ["progress_min=20", "progress_max=80"]);

  await expect(page.getByTestId(`task-item-${t20.id}`)).toBeVisible();
  await expect(page.getByTestId(`task-item-${t50.id}`)).toBeVisible();
  await expect(page.getByTestId(`task-item-${t80.id}`)).toBeVisible();

  // DOM 残骸対策：非対象は「非表示」を確認
  await expect(page.getByTestId(`task-item-${t0.id}`)).not.toBeVisible();
  await expect(page.getByTestId(`task-item-${t100.id}`)).not.toBeVisible();
});
