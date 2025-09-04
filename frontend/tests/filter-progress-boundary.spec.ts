import { test, expect } from "@playwright/test";
import { openTasks } from "./helpers";

test("境界値: min=max=50 で 50 のみ、解除で全件", async ({ page }) => {
  await openTasks(page);
  const bar = page.getByTestId("filter-bar");

  await bar.getByTestId("progress-min").fill("50");
  await bar.getByTestId("progress-max").fill("50");

  await page.waitForResponse((r) => r.url().includes("/api/tasks") && r.request().method() === "GET" && r.url().includes("progress_min=50") && r.url().includes("progress_max=50"));

  // 50% のみの想定（画面に 50% 表示があること）
  await expect(page.getByTestId("progress-single-indicator")).toHaveText(/進捗:\s*50%/);

  // 解除
  await bar.getByRole("button", { name: /すべて解除|クリア/i }).click();
  await page.waitForResponse((r) => r.url().includes("/api/tasks") && r.request().method() === "GET" && !r.url().includes("progress_"));
});
