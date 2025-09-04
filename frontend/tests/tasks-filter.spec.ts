// tests/tasks-filter.spec.ts
import { test, expect, type Page, type Locator } from "@playwright/test";
import { ensureAuthTokens, createTaskViaApi } from "./helpers";

// ルート（親）タスク行だけを拾う
const parents = (page: Page): Locator =>
  page.locator('[data-testid^="task-item-"][role="treeitem"][aria-level="1"]');

// /tasks に到達して、初回 /api/tasks=200 と画面の可視を待つ
async function waitForTasksUI(page: Page): Promise<void> {
  const gotoTasks = async () => {
    await page.goto("/tasks?order_by=deadline&dir=asc", { waitUntil: "domcontentloaded" });
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    await gotoTasks();
    await ensureAuthTokens(page);
    await page.evaluate(() => window.dispatchEvent(new Event("auth:refresh")));

    // 万一 /login に飛ばされたら戻す
    if (page.url().includes("/login")) await gotoTasks();

    // タスク画面の兆候をどちらかで拾う
    const seen = await Promise.any([
      page.locator('[data-testid="task-list-root"]').waitFor({ state: "visible", timeout: 5000 }).then(() => true),
      page.getByRole("heading", { name: "タスク一覧ページ" }).waitFor({ state: "visible", timeout: 5000 }).then(() => true),
    ]).catch(() => false);

    if (seen) {
      // 初回 /api/tasks=200 を一度観測
      await page
        .waitForResponse(
          (r) => r.request().method() === "GET" && /\/api\/tasks(\b|\/|\?)/.test(r.url()) && r.status() === 200,
          { timeout: 10_000 }
        )
        .catch(() => {});
      await page.waitForLoadState("networkidle");
      return;
    }
    await page.waitForTimeout(500);
  }

  throw new Error("Tasks UI not reachable after retries");
}

// 指定条件が URL に含まれる /api/tasks=200 を待つ
async function waitForTasksFetch(
  page: Page,
  { order_by, dir, site }: { order_by?: string; dir?: "asc" | "desc"; site?: string }
): Promise<void> {
  const needs: string[] = ["/api/tasks"];
  if (order_by) needs.push(`order_by=${order_by}`);
  if (dir) needs.push(`dir=${dir}`);
  if (site) needs.push(`site=${encodeURIComponent(site)}`);
  await page
    .waitForResponse((r) => r.status() === 200 && needs.every((s) => r.url().includes(s)), { timeout: 10_000 })
    .catch(() => {});
  await page.waitForLoadState("networkidle");
}

// data-testid が環境で異なる可能性に備えてフォールバック取得
function getSiteInput(bar: Locator): Locator {
  // どちらか存在する方を使う（filter-site or site-input）
  const candidate = bar.locator('[data-testid="filter-site"], [data-testid="site-input"]');
  return candidate;
}
function getOrderBySelect(bar: Locator): Locator {
  // order_by or order-by
  return bar.locator('[data-testid="order_by"], [data-testid="order-by"]');
}
function getDirSelect(bar: Locator): Locator {
  // dir or sort-dir
  return bar.locator('[data-testid="dir"], [data-testid="sort-dir"]');
}

test.describe("タスクの絞り込み・並び替え", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await waitForTasksUI(page);
  });

  test("site / deadlineの昇順 & 期限なしは末尾", async ({ page }) => {
    const stamp = Date.now();
    const site = `E2E-FILTER-${stamp}`;
    const tNo = `期限なし-${stamp}`;
    const tEarly = `早い-${stamp}`;
    const tLate = `遅い-${stamp}`;

    // APIで播種（すべて親タスク）
    await createTaskViaApi(page, { title: tNo,   site, deadline: null,                         parent_id: null });
    await createTaskViaApi(page, { title: tEarly, site, deadline: "2000-05-02T00:00:00.000Z",  parent_id: null });
    await createTaskViaApi(page, { title: tLate,  site, deadline: "2030-05-02T00:00:00.000Z",  parent_id: null });

    // 画面更新（クエリ&描画の安定化）
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    // フィルタバー
    const bar = page.getByTestId("filter-bar");
    await expect(bar).toBeVisible();

    // site 入力
    await getSiteInput(bar).fill(site);
    await waitForTasksFetch(page, { site });

    // 期限 / 昇順（＝早い→遅い、null は末尾）
    await getOrderBySelect(bar).selectOption("deadline");
    await getDirSelect(bar).selectOption("asc");
    await waitForTasksFetch(page, { order_by: "deadline", dir: "asc", site });

    // 昇順: 早い < 遅い
    await expect
      .poll(
        async () => {
          const texts = await parents(page).locator('span[data-testid^="task-title-"]').allInnerTexts();
          const idxEarly = texts.findIndex((t) => t.includes(tEarly));
          const idxLate  = texts.findIndex((t) => t.includes(tLate));
          return idxEarly >= 0 && idxLate >= 0 && idxEarly < idxLate;
        },
        { timeout: 10_000 }
      )
      .toBeTruthy();

    // 期限なしは末尾
    await expect(parents(page)).toHaveCount(3, { timeout: 10_000 });
    await expect(parents(page).last()).toContainText(tNo, { timeout: 10_000 });

    // （参考）降順は URL 反映のみ軽く確認（順序検証は別PR）
    await getDirSelect(bar).selectOption("desc");
    await waitForTasksFetch(page, { order_by: "deadline", dir: "desc", site });
    {
      const u = new URL(page.url());
      expect(u.searchParams.get("order_by")).toBe("deadline");
      expect(u.searchParams.get("dir")).toBe("desc");
      expect(u.searchParams.get("site")).toBe(site);
    }
  });
});
