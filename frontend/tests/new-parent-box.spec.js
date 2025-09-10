import { test, expect } from "@playwright/test";
import { openTasks, waitForTasksOk } from "./helpers";
test("上位タスク作成ボックスで親を作れる", async ({ page }) => {
    await openTasks(page);
    await waitForTasksOk(page);
    const title = `NP-${Date.now()}`;
    await page.getByTestId("new-parent-title").fill(title);
    await page.getByTestId("new-parent-site").fill("E2E-BOX");
    await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/tasks") && r.request().method() === "POST"),
        page.getByTestId("new-parent-submit").click(),
    ]);
    await waitForTasksOk(page);
    await expect(page.getByText(title)).toBeVisible();
});
