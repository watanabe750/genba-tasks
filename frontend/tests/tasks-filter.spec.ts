// tests/tasks-filter.spec.ts
import { test, expect, type Page, type Locator } from "@playwright/test";
import { ensureAuthTokens, createTaskViaApi } from "./helpers";

test.use({ storageState: "tests/.auth/e2e.json" });

const parents = (page: Page): Locator =>
  page.locator('[data-testid^="task-item-"][aria-level="1"]');

// /tasks 画面に確実に到達してタスク取得完了まで待つ
async function waitForTasksUI(page: Page): Promise<void> {
  const gotoTasks = async () => {
    await page.goto("/tasks?order_by=deadline&dir=asc");
    await page.waitForLoadState("domcontentloaded");
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    await gotoTasks();
    await ensureAuthTokens(page);

    if (page.url().includes("/login")) await gotoTasks();

    const seen = await Promise.any([
      page
        .waitForSelector('[data-testid="task-list-root"]', {
          state: "attached",
          timeout: 5000,
        })
        .then(() => true),
      page
        .getByRole("heading", { name: "タスク一覧ページ" })
        .waitFor({ state: "visible", timeout: 5000 })
        .then(() => true),
    ]).catch(() => false);

    if (seen) {
      await page
        .waitForResponse(
          (r) => r.url().includes("/api/tasks") && r.status() === 200,
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

async function waitForTasksFetch(
  page: Page,
  {
    order_by,
    dir,
    site,
  }: { order_by?: string; dir?: "asc" | "desc"; site?: string }
): Promise<void> {
  const needs: string[] = ["/api/tasks"];
  if (order_by) needs.push(`order_by=${order_by}`);
  if (dir) needs.push(`dir=${dir}`);
  if (site) needs.push(`site=${encodeURIComponent(site)}`);
  await page
    .waitForResponse(
      (r) => r.status() === 200 && needs.every((s) => r.url().includes(s)),
      {
        timeout: 10_000,
      }
    )
    .catch(() => {});
  await page.waitForLoadState("networkidle");
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
    await createTaskViaApi(page, {
      title: tNo,
      site,
      deadline: null,
      parent_id: null,
    });
    await createTaskViaApi(page, {
      title: tEarly,
      site,
      deadline: "2000-05-02T00:00:00.000Z",
      parent_id: null,
    });
    await createTaskViaApi(page, {
      title: tLate,
      site,
      deadline: "2030-05-02T00:00:00.000Z",
      parent_id: null,
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    // フィルタ入力
    const bar = page.getByTestId("filter-bar");
    await expect(bar).toBeVisible();
    await bar.getByTestId("filter-site").fill(site);
    await waitForTasksFetch(page, { site });

    // 期限 / 昇順（＝早い→遅い、nullは末尾）
    await bar.getByTestId("order_by").selectOption("deadline");
    await bar.getByTestId("dir").selectOption("asc");
    await waitForTasksFetch(page, { order_by: "deadline", dir: "asc", site });

    // 昇順: 早い < 遅い
    await expect
      .poll(
        async () => {
          const texts = await parents(page)
            .locator('span[data-testid^="task-title-"]')
            .allInnerTexts();
          const idxEarly = texts.findIndex((t) => t.includes(tEarly));
          const idxLate = texts.findIndex((t) => t.includes(tLate));
          return idxEarly >= 0 && idxLate >= 0 && idxEarly < idxLate;
        },
        { timeout: 10_000 }
      )
      .toBeTruthy();

    // 期限なしは末尾
    await expect(parents(page)).toHaveCount(3, { timeout: 10_000 });
    await expect(parents(page).last()).toContainText(tNo, { timeout: 10_000 });

    // （参考）降順はURL反映のみ軽く見る（順序検証は別PR）
    await bar.getByTestId("dir").selectOption("desc");
    await waitForTasksFetch(page, { order_by: "deadline", dir: "desc", site });
    {
      const u = new URL(page.url());
      expect(u.searchParams.get("order_by")).toBe("deadline");
      expect(u.searchParams.get("dir")).toBe("desc");
      expect(u.searchParams.get("site")).toBe(site);
    }
  });
});
