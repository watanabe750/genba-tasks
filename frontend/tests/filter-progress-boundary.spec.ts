// tests/filter-progress-boundary.spec.ts（置き換え）
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

test("境界値: min=max=50 で 50 のみ、解除で全件", async ({ page }) => {
  await openTasksWithBar(page);

  const site = `E2E-PROG-B-${Date.now()}`;
  const t40 = await createTaskViaApi(page, { title: "p40", site, parent_id: null, progress: 40 });
  const t50 = await createTaskViaApi(page, { title: "p50", site, parent_id: null, progress: 50 });
  const t60 = await createTaskViaApi(page, { title: "p60", site, parent_id: null, progress: 60 });

  const bar = page.getByTestId("filter-bar");

  await bar.getByTestId("filter-site").fill(site);
  await waitForFetch(page, [encodeURIComponent(`site=${site}`)]);

  await bar.getByTestId("progress-min").fill("50");
  await bar.getByTestId("progress-max").fill("50");
  await waitForFetch(page, ["progress_min=50", "progress_max=50"]);

  await expect(page.getByTestId(`task-item-${t50.id}`)).toBeVisible();
  await expect(page.getByTestId(`task-item-${t40.id}`)).not.toBeVisible();
  await expect(page.getByTestId(`task-item-${t60.id}`)).not.toBeVisible();

  // リセットで全件復帰
  await bar.getByTestId("filter-reset").click();
  await waitForFetch(page, []); // 何も指定しない（/api/tasks の 200 を待つ）
  await expect(page.getByTestId(`task-item-${t40.id}`)).toBeVisible();
  await expect(page.getByTestId(`task-item-${t50.id}`)).toBeVisible();
  await expect(page.getByTestId(`task-item-${t60.id}`)).toBeVisible();
});
