// tests/tasks-filter.spec.ts
import { test, expect } from "@playwright/test";
import { createTaskViaApi } from "./helpers";

// /api/tasks の再取得（またはキャッシュ描画）を待つ
async function waitTasksRefetch(page: any) {
  const p = page
    .waitForResponse(
      (r: any) =>
        r.url().includes("/api/tasks") &&
        r.request().method() === "GET" &&
        r.status() === 200,
      { timeout: 5000 }
    )
    .catch(() => {});
  // キャッシュ描画時のフォールバックも入れる
  await Promise.all([p, page.waitForTimeout(600)]);
}

// URL の searchParams が期待どおりになるのを待つ（ナビゲーション待ちにしない）
async function waitForSearch(
    page: any,
    expected: Record<string, string | string[]>
  ) {
    await page.waitForFunction(
      (expected) => {
        const u = new URL(location.href);
        return Object.entries(expected).every(([k, v]) => {
          if (Array.isArray(v)) {
            const got = u.searchParams.getAll(k);
            // 集合として含まれているか（順不同）
            return v.every((vv) => got.includes(String(vv)));
          } else {
            return u.searchParams.get(k) === String(v);
          }
        });
      },
      expected,
      { timeout: 10_000 }
    );
  }
  

// 指定idのTaskItemが全て可視になるまで待つ（最大t ms）
async function waitForItemsVisible(page: any, ids: number[], t = 12000) {
  const start = Date.now();
  // 先に1回は refetch 待ち
  await waitTasksRefetch(page);
  for (;;) {
    const vis = await Promise.all(
      ids.map(async (id) =>
        page
          .getByTestId(`task-item-${id}`)
          .first()
          .isVisible()
          .catch(() => false)
      )
    );
    if (vis.every(Boolean)) return;

    if (Date.now() - start > t) {
      // 失敗時にデバッグ用情報を出す
      const url = page.url();
      const titles = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll('[data-testid^="task-item-"] h2')
        ).map((el) => el.textContent?.trim())
      );
      throw new Error(
        `items not visible within ${t}ms. url=${url} titles=${JSON.stringify(
          titles
        )}`
      );
    }
    await waitTasksRefetch(page);
  }
}

// ページ内の表示順を比較
async function expectBefore(a: any, b: any) {
  const [ra, rb] = await Promise.all([
    a
      .first()
      .evaluate(
        (el: Element) => (el as HTMLElement).getBoundingClientRect().top
      ),
    b
      .first()
      .evaluate(
        (el: Element) => (el as HTMLElement).getBoundingClientRect().top
      ),
  ]);
  expect(ra).toBeLessThan(rb);
}

// 一覧UIの初期化待ち
async function waitForTasksUI(page: any) {
  await page.goto("/tasks");
  await page.waitForSelector(
    [
      '[data-testid="parent-create-title"]',
      '[data-testid="task-list-root"]',
      '[data-testid^="task-item-"]',
      '[data-testid="header-logout"]',
    ].join(","),
    { state: "attached", timeout: 8000 }
  );
}

test.describe("タスクの絞り込み・並び替え", () => {
  test.beforeEach(async ({ page }) => {
    await waitForTasksUI(page);
  });

  test("site / status / progress / parents_only / deadlineの昇降順 & 期限なしは末尾", async ({
    page,
  }) => {
    const uid = Date.now();

    // --- データ作成（親3つ + 子1つ） ---
    const A = await createTaskViaApi(page, {
      title: `F-${uid}-A`,
      site: "現場Alpha",
      deadline: "2025-12-31",
      parent_id: null,
    });
    const B = await createTaskViaApi(page, {
      title: `F-${uid}-B`,
      site: "現場Beta",
      deadline: "2025-10-15",
      parent_id: null,
    });
    const C = await createTaskViaApi(page, {
      title: `F-${uid}-C`,
      site: "現場Alpha",
      deadline: null,
      parent_id: null,
    });
    await createTaskViaApi(page, {
      title: `F-${uid}-A-child`,
      parent_id: A.id,
    });
    await waitTasksRefetch(page);

    // --- 状態調整（UI経由） ---
    // A: 20% & in_progress
    {
      const item = page.getByTestId(`task-item-${A.id}`).first();
      await item.getByRole("button", { name: "編集" }).first().click();
      await item.getByLabel(/進捗/).first().focus();
      await item.locator('input[type="range"]').first().fill("20");
      await item
        .getByLabel("ステータス")
        .first()
        .selectOption("in_progress")
        .catch(() => {});
      await item.getByRole("button", { name: "保存" }).first().click();
    }
    // B: not_started
    {
      const item = page.getByTestId(`task-item-${B.id}`).first();
      await item.getByRole("button", { name: "編集" }).first().click();
      await item
        .getByLabel("ステータス")
        .first()
        .selectOption("not_started")
        .catch(() => {});
      await item.getByRole("button", { name: "保存" }).first().click();
    }
    // C: completed（controlledなので click→文言で待つ）
    {
      const item = page.getByTestId(`task-item-${C.id}`).first();
      await item.getByLabel("完了").first().click();
      await expect(item.getByText(/ステータス:\s*completed/)).toBeVisible();
    }
    await waitTasksRefetch(page);

    // --- 1) site=現場Alpha で A/C が出て B は消える ---
    const siteInput = page.getByPlaceholder("現場名(site)");
    await siteInput.fill("現場Alpha");
    await siteInput.press("Enter");

    await waitForSearch(page, { site: "現場Alpha" });
    await waitTasksRefetch(page);

    await expect(
      page.getByRole("heading", { name: `F-${uid}-A`, exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `F-${uid}-C`, exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `F-${uid}-B`, exact: true })
    ).toHaveCount(0);

    // datalist の存在（idは list 属性から取得）
    const datalistId = await siteInput.getAttribute("list");
    expect(datalistId).toBeTruthy();
    await page.waitForSelector(`#${datalistId} option`, {
      state: "attached",
      timeout: 5000,
    });
    expect(await page.locator(`#${datalistId} option`).count()).toBeGreaterThan(
      0
    );

    // --- 2) 親のみ（子は非表示） ---
    const parentsOnly = page.getByLabel(/親.*のみ/);
    await parentsOnly.click();
    await expect(parentsOnly).toBeChecked();
    await waitForSearch(page, { site: "現場Alpha", parents_only: "1" });
    await waitTasksRefetch(page);
    await expect(
      page.getByRole("heading", { name: `F-${uid}-A-child` })
    ).toHaveCount(0);

    // --- 3) status フィルタ：in_progress のみ ---
    const btnInProg = page.getByRole("button", { name: "in_progress" });
    const btnNotStarted = page.getByRole("button", { name: "not_started" });
    const btnCompleted = page.getByRole("button", { name: "completed" });
    const isOn = async (btn: any) =>
      !!((await btn.getAttribute("class")) || "").includes("font-bold");

    for (const b of [btnNotStarted, btnInProg, btnCompleted]) {
      if (await isOn(b)) await b.click();
    }
    await btnInProg.click();
    await waitForSearch(page, {
      site: "現場Alpha",
      parents_only: "1",
      status: ["in_progress"],
    });
    await waitTasksRefetch(page);

    await expect(
      page.getByRole("heading", { name: `F-${uid}-A`, exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `F-${uid}-C`, exact: true })
    ).toHaveCount(0);

    // --- 4) progress帯：min=10, max=50 ---
    const minInput = page.locator('input[type="number"]').nth(0);
    const maxInput = page.locator('input[type="number"]').nth(1);
    await minInput.fill("10");
    await maxInput.fill("50");
    await maxInput.blur();

    await waitForSearch(page, {
      site: "現場Alpha",
      parents_only: "1",
      status: ["in_progress"],
      progress_min: "10",
      progress_max: "50",
    } as any);
    await waitTasksRefetch(page);

    await expect(
      page.getByRole("heading", { name: `F-${uid}-A`, exact: true })
    ).toBeVisible();

    // --- 5) ソート（site解除 → status整える → 進捗帯リセット → 並び替え）---
    await siteInput.fill("");
    await siteInput.press("Enter");
    await waitForSearch(page, {
      parents_only: "1",
      status: ["in_progress"],
      progress_min: "10",
      progress_max: "50",
    } as any);
    await waitTasksRefetch(page);

    if (!(await isOn(btnInProg))) await btnInProg.click();
    if (!(await isOn(btnNotStarted))) await btnNotStarted.click();
    if (await isOn(btnCompleted)) await btnCompleted.click();
    await waitForSearch(page, {
      parents_only: "1",
      status: ["in_progress", "not_started"],
      progress_min: "10",
      progress_max: "50",
    } as any);
    await waitTasksRefetch(page);

    await minInput.fill("0");
    await maxInput.fill("100");
    await maxInput.blur();
    await waitForSearch(page, {
      parents_only: "1",
      status: ["in_progress", "not_started"],
      progress_min: "0",
      progress_max: "100",
    } as any);
    await waitTasksRefetch(page);

    const sortSel = page.locator("select");
    await sortSel.selectOption("deadline:asc");
    await waitForSearch(page, {
      parents_only: "1",
      status: ["in_progress", "not_started"],
      progress_min: "0",
      progress_max: "100",
      order_by: "deadline",
      dir: "asc",
    });
    await waitTasksRefetch(page);

    // A/B の TaskItem が実際に可視になるまで待つ
    await waitForItemsVisible(page, [A.id, B.id]);

    const Aitem = page.getByTestId(`task-item-${A.id}`).first();
    const Bitem = page.getByTestId(`task-item-${B.id}`).first();
    await expectBefore(Bitem, Aitem);

    // 降順なら A が上
    await sortSel.selectOption("deadline:desc");
    await waitForSearch(page, { order_by: "deadline", dir: "desc" });
    await waitTasksRefetch(page);
    await expectBefore(Aitem, Bitem);

    // --- 6) 期限なしは末尾 ---
    if (!(await isOn(btnCompleted))) {
      await btnCompleted.click();
      await waitForSearch(page, {
        status: ["in_progress", "not_started", "completed"],
      });
      await waitTasksRefetch(page);
    }
    await sortSel.selectOption("deadline:asc");
    await waitForSearch(page, { order_by: "deadline", dir: "asc" });
    await waitTasksRefetch(page);

    const Citem = page.getByTestId(`task-item-${C.id}`).first();
    await expect(Citem).toBeVisible();

    const [topA, topB, topC] = await Promise.all([
      Aitem.evaluate(
        (el: Element) => (el as HTMLElement).getBoundingClientRect().top
      ),
      Bitem.evaluate(
        (el: Element) => (el as HTMLElement).getBoundingClientRect().top
      ),
      Citem.evaluate(
        (el: Element) => (el as HTMLElement).getBoundingClientRect().top
      ),
    ]);
    expect(topC).toBeGreaterThan(Math.min(topA, topB));

    // --- 7) リロード後もクエリ保持 ---
    await page.reload();
    await expect(parentsOnly).toBeChecked();
    await expect(sortSel).toHaveValue("deadline:asc");
  });
});
