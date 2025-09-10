import { test, expect } from "@playwright/test";
import { openTasks, waitForTasksOk } from "./helpers";
test("進捗 20–80 だけ表示（0/100 は除外）", async ({ page }) => {
    await openTasks(page);
    await waitForTasksOk(page);
    const bar = page.getByTestId("filter-bar");
    await bar.getByTestId("progress-min").fill("20");
    await bar.getByTestId("progress-max").fill("80");
    // /api/tasks?progress_min=20&progress_max=80 を待つ
    await page.waitForResponse((r) => {
        const u = r.url();
        return r.request().method() === "GET" && u.includes("/api/tasks") && u.includes("progress_min=20") && u.includes("progress_max=80");
    });
    // 0%/100% が見えないことを軽く確認（具体的タイトルを持たないため件数0を期待）
    await expect(page.getByText(/進捗: 0%/)).toHaveCount(0);
    await expect(page.getByText(/進捗: 100%/)).toHaveCount(0);
});
