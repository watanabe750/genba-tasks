// tests/filters-index.spec.ts
import { test, expect } from "@playwright/test";
import { createTaskViaApi } from "./helpers";

test.use({ storageState: "tests/.auth/e2e.json" });
test.describe.configure({ mode: "serial" });

const items = (page: any) => page.locator('[data-testid^="task-item-"]');

/** /tasks を安定表示させる */
async function waitForTasksUI(page: any) {
  await page.goto("/tasks?order_by=deadline&dir=asc");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");

  // DTAトークンが localStorage に揃うまで（UI文言に依存しない）
  await page
    .waitForFunction(() => {
      try {
        return !!(
          localStorage.getItem("access-token") &&
          localStorage.getItem("client") &&
          localStorage.getItem("uid")
        );
      } catch {
        return false;
      }
    }, { timeout: 10_000 })
    .catch(() => {});

  // メインUI or 右側パネルのどちらかが付けばOK
  await Promise.race([
    page.waitForSelector('[data-testid="task-list-root"]', { state: "attached" }),
    page.waitForSelector('[data-testid="priority-panel"]', { state: "attached" }),
  ]);

  // 最初のフェッチを best-effort で待つ
  await page
    .waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        /(\/api\/)?tasks\b/.test(r.url()) &&
        r.status() === 200,
      { timeout: 10_000 }
    )
    .catch(() => {});
}

/** 指定のクエリで /tasks 取得を best-effort で待つ */
async function waitForTasksFetch(
  page: any,
  qp: Partial<Record<
    "site" | "order_by" | "dir" | "parents_only" | "progress_min" | "progress_max" | "status",
    string
  >>
) {
  const pairs = Object.entries(qp).filter(([, v]) => v != null && v !== "");
  await page
    .waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        /(\/api\/)?tasks\b/.test(r.url()) &&
        r.status() === 200 &&
        pairs.every(([k, v]) => r.url().includes(`${k}=${encodeURIComponent(v as string)}`)),
      { timeout: 10_000 }
    )
    .catch(() => {});
}

test.describe("タスクの絞り込み・並び替え", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await waitForTasksUI(page);
  });

  test("site / status / progress / parents_only / deadlineの昇降順 & 期限なしは末尾", async ({ page }) => {
    const stamp = Date.now();
    const site = `E2E-FILTER-${stamp}`;
    const tNo = `期限なし-${stamp}`;
    const tEarly = `早い-${stamp}`;
    const tLate = `遅い-${stamp}`;

    // ====== 種まき（API経由で親タスクを3件作成）======
    await createTaskViaApi(page, {
      title: tNo,
      site,
      deadline: null,                // 期限なし
      parent_id: null,
    });
    await createTaskViaApi(page, {
      title: tEarly,
      site,
      deadline: "2000-05-02T00:00:00.000Z", // 早い
      parent_id: null,
    });
    await createTaskViaApi(page, {
      title: tLate,
      site,
      deadline: "2030-05-02T00:00:00.000Z", // 遅い
      parent_id: null,
    });

    // 再表示（キャッシュや描画の揺れ吸収）
    await page.goto("/tasks?order_by=deadline&dir=asc");
    await page.waitForLoadState("networkidle");

    // ====== フィルタバー操作 ======
    const bar = page.getByTestId("filter-bar");
    await expect(bar).toBeVisible();

    // site で絞り込み
    await bar.getByTestId("filter-site").fill(site);
    await waitForTasksFetch(page, { site });

    // 並び替え: 期限 / 昇順
    await bar.getByTestId("order_by").selectOption("deadline");
    await bar.getByTestId("dir").selectOption("asc");
    await waitForTasksFetch(page, { order_by: "deadline", dir: "asc", site });

    // 先頭が「早い-*」
    await expect
      .poll(async () => items(page).first().innerText(), { timeout: 10_000 })
      .toMatch(new RegExp(tEarly));

    // 降順 → 先頭が「遅い-*」
    await bar.getByTestId("dir").selectOption("desc");
    await waitForTasksFetch(page, { order_by: "deadline", dir: "desc", site });
    await expect
      .poll(async () => items(page).first().innerText(), { timeout: 10_000 })
      .toMatch(new RegExp(tLate));

    // 昇順に戻して「期限なし-*」が末尾
    await bar.getByTestId("dir").selectOption("asc");
    await waitForTasksFetch(page, { order_by: "deadline", dir: "asc", site });
    await expect
      .poll(async () => items(page).last().innerText(), { timeout: 10_000 })
      .toMatch(new RegExp(tNo));
  });
});
