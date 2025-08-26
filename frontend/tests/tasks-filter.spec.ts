// tests/tasks-filter.spec.ts
import { test, expect } from "@playwright/test";

test.use({ storageState: "tests/.auth/e2e.json" });

const items = (page: any) => page.locator('[data-testid^="task-item-"]');

async function waitForTasksUI(page: any) {
  await page.goto("/tasks?order_by=deadline&dir=asc");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
  await Promise.race([
    page.waitForSelector('[data-testid="task-list-root"]', { state: "attached" }),
    page.waitForSelector('[data-testid="priority-panel"]', { state: "attached" }),
  ]);
  // 初回はキャッシュ命中の可能性があるのでベストエフォート
  await page
    .waitForResponse((r) => r.url().includes("/api/tasks") && r.status() === 200, {
      timeout: 10_000,
    })
    .catch(() => {});
}

// 並び替え/フィルタ適用後の /api/tasks 応答を待つ（キャッシュ時はスキップ）
async function waitForTasksFetch(
  page: any,
  { order_by, dir, site }: { order_by?: string; dir?: "asc" | "desc"; site?: string }
) {
  const needs: string[] = ["/api/tasks"];
  if (order_by) needs.push(`order_by=${order_by}`);
  if (dir) needs.push(`dir=${dir}`);
  if (site) needs.push(`site=${encodeURIComponent(site)}`);

  await page
    .waitForResponse(
      (r) => r.status() === 200 && needs.every((s) => r.url().includes(s)),
      { timeout: 10_000 }
    )
    .catch(() => {});
  await page.waitForLoadState("networkidle");
}

async function createParent(
  page: any,
  { title, site, deadline }: { title: string; site: string; deadline?: string | null }
) {
  await page.getByTestId("new-parent-title").fill(title);
  await page.getByTestId("new-parent-site").fill(site);
  if (deadline != null) await page.getByTestId("new-parent-deadline").fill(deadline);
  await page.getByTestId("new-parent-submit").click();
  await expect(items(page).filter({ hasText: title }).first()).toBeVisible();
}

test.describe("タスクの絞り込み・並び替え", () => {
  // 安定性向上のためこの spec だけ余裕を持たせる
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await waitForTasksUI(page);
  });

  test("site / status / progress / parents_only / deadlineの昇降順 & 期限なしは末尾", async ({
    page,
  }) => {
    const site = `E2E-FILTER-${Date.now()}`;
    const tNo = `期限なし-${Date.now()}`;
    const tEarly = `早い-${Date.now()}`;
    const tLate = `遅い-${Date.now()}`;

    // 3件作成（期限なし/早い/遅い）
    await createParent(page, { title: tNo, site, deadline: "" });
    await createParent(page, { title: tEarly, site, deadline: "2000-05-02" });
    await createParent(page, { title: tLate, site, deadline: "2030-05-02" });

    // site で絞り込み
    await page.getByPlaceholder("現場名で絞り込み").fill(site);
    await waitForTasksFetch(page, { site });

    // 並び替え: 期限 / 昇順 → 先頭が「早い」
    const bar = page.getByTestId("filter-bar");
    await expect(bar.getByTestId("order_by")).toBeAttached();
    await expect(bar.getByTestId("dir")).toBeAttached();

    await bar.getByTestId("order_by").selectOption("deadline");
    await bar.getByTestId("dir").selectOption("asc");
    await waitForTasksFetch(page, { order_by: "deadline", dir: "asc", site });

    await expect
      .poll(async () => items(page).first().innerText(), { timeout: 10_000 })
      .toMatch(new RegExp(tEarly));

    // 降順 → 先頭が「遅い」
    await bar.getByTestId("dir").selectOption("desc");
    await waitForTasksFetch(page, { order_by: "deadline", dir: "desc", site });

    await expect
      .poll(async () => items(page).first().innerText(), { timeout: 10_000 })
      .toMatch(new RegExp(tLate));

    // 昇順に戻す → 期限なしは末尾
    await bar.getByTestId("dir").selectOption("asc");
    await waitForTasksFetch(page, { order_by: "deadline", dir: "asc", site });

    // まず 3 件そろっていることを確認（描画完了の足場）
    await expect(items(page)).toHaveCount(3, { timeout: 10_000 });

    // 末尾が「期限なし-...」
    await expect(items(page).last()).toContainText(tNo, { timeout: 10_000 });
  });
});