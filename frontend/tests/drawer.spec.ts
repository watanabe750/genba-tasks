import { test, expect } from "@playwright/test";
import { listResponse, detailOk, detail5xx, detail404 } from "./fixtures";
import { openTasks, waitForTasksOk } from "./helpers";

const LIST = "**/api/tasks*";
const DETAIL = "**/api/tasks/1001";

async function mockList(page) {
  await page.route(LIST, async (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(listResponse) });
  });
}

test.beforeEach(async ({ page }) => {
  await mockList(page);
});

test("開閉/フォーカス復帰/フォーカストラップ/外側クリック", async ({ page }) => {
  await page.route(DETAIL, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(detailOk) })
  );

  await openTasks(page);
  await waitForTasksOk(page);

  const trigger = page.locator('[data-testid="task-title-1001"]');
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "親A" });
  await expect(dialog).toBeVisible();

  // Trap
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const activeInPanel = await page.evaluate(() => {
    const panel = document.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement;
    return panel?.contains(document.activeElement);
  });
  expect(activeInPanel).toBeTruthy();

  // Esc close + focus back
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  // Re-open and click outside
  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(10, 10);
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("子プレビューは最大4件、孫件数の表示", async ({ page }) => {
  await page.route(DETAIL, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(detailOk) })
  );

  await openTasks(page);

  const trigger = page.locator('[data-testid="task-title-1001"]');
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "親A" });
  await expect(dialog).toBeVisible();

  const items = dialog.locator("ul[role='list'] > li[role='listitem']");
  await expect(items).toHaveCount(4);
  await expect(dialog.getByText("孫タスク：3 件")).toBeVisible();
});

test("404: トースト表示後に自動クローズ", async ({ page }) => {
  await page.route(DETAIL, (route) =>
    route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify(detail404) })
  );

  await openTasks(page);
  const trigger = page.locator('[data-testid="task-title-1001"]');
  await expect(trigger).toBeVisible();
  await trigger.click();

  await expect(page.getByText("タスクが見つかりません")).toBeVisible();
  await expect(page.getByRole("dialog").first()).toBeHidden({ timeout: 3000 });
  await expect(trigger).toBeFocused();
});

test("5xx: トースト表示→開いたまま→再試行で復帰", async ({ page }) => {
  await page.route(DETAIL, (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify(detail5xx) })
  );

  await openTasks(page);

  const trigger = page.locator('[data-testid="task-title-1001"]');
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.getByText("サーバーエラー。再試行してください")).toBeVisible();

  await page.unroute(DETAIL);
  await page.route(DETAIL, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(detailOk) })
  );

  await page.getByRole("button", { name: "再試行" }).click();
  await expect(dialog.getByTestId("drawer-progress")).toBeVisible();
  await expect(dialog.getByText("子タスク")).toBeVisible();
});

test("401: auth:logout 連動でクローズ", async ({ page }) => {
  await page.route(DETAIL, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(detailOk) })
  );

  await openTasks(page);

  const trigger = page.locator('[data-testid="task-title-1001"]');
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await page.evaluate(() => window.dispatchEvent(new Event("auth:logout")));
  await expect(page.getByText("セッションが切れました。再ログインしてください")).toBeVisible();
  await expect(dialog).toBeHidden();
});
