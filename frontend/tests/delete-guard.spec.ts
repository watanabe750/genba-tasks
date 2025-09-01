// tests/delete-guard.spec.ts
import { test, expect } from "@playwright/test";
import { createTaskViaApi } from "./helpers";

test.use({ storageState: "tests/.auth/e2e.json" });

test("親は子があると削除不可（ネットワークも飛ばない）", async ({ page }) => {
  await page.goto("/tasks");

  const parent = await createTaskViaApi(page, {
    title: `DEL-${Date.now()}`,
    site: "E2E-DEL",
    parent_id: null,
  });
  const child = await createTaskViaApi(page, { title: "C1", parent_id: parent.id });

  const parentRow = page.getByTestId(`task-item-${parent.id}`).first();
  await expect(parentRow).toBeVisible();
  await expect(page.getByTestId(`task-item-${child.id}`)).toBeVisible();

  // DELETE計測（飛んだらフラグON）
  let triedDelete = false;
  page.on("request", (req) => {
    if (req.method() === "DELETE" && /\/api\/tasks\/\d+$/.test(req.url())) {
      triedDelete = true;
    }
  });

  // 親行の“最上段”だけに限定して削除ボタンをクリック
  const delBtn = parentRow.locator(":scope > div").first().getByRole("button", { name: "削除" });
  await delBtn.click();

  // ちょい待ち（UIハンドラ実行タイミング）
  await page.waitForTimeout(300);

  // 親・子ともに残っている（削除されていない）
  await expect(parentRow).toBeVisible();
  await expect(page.getByTestId(`task-item-${child.id}`)).toBeVisible();

  // ネットワーク上もDELETEは飛んでいない
  expect(triedDelete).toBeFalsy();
});
