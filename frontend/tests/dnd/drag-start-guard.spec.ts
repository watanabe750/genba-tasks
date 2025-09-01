// tests/dnd/drag-start-guard.spec.ts
import { test, expect } from "@playwright/test";
import H from "./_helpers";
import { createTaskViaApi } from "../helpers";

test.use({ storageState: "tests/.auth/e2e.json" });

test("D&D: ハンドル以外からはdrag開始しない", async ({ page }) => {
  await page.goto("/tasks");

  const p1 = await createTaskViaApi(page, { title: `DRAG-P1-${Date.now()}`, site: "E2E", parent_id: null });
  const p2 = await createTaskViaApi(page, { title: `DRAG-P2-${Date.now()}`, site: "E2E", parent_id: null });

  // 1) タイトルからは is-dragging が立たない
  const title = page.getByTestId(`task-title-${p1.id}`);
  const boxT = await title.boundingBox();
  if (!boxT) test.skip();

  await page.mouse.move(boxT.x + 2, boxT.y + 2);
  await page.mouse.down();
  await page.mouse.move(boxT.x + 20, boxT.y + 2);

  await expect
    .poll(() => page.evaluate(() => document.body.classList.contains("is-dragging")), { timeout: 600 })
    .toBeFalsy();

  await page.mouse.up();

  // 2) ハンドルからは drag 成立
  const waitDragging = page.waitForFunction(() => document.body.classList.contains("is-dragging"));
  const doDrag = H.dragAfter(page, p1.id, p2.id);
  await Promise.race([waitDragging, doDrag]).catch(() => {});
  await doDrag;

  // 終了後はフラグが落ちる
  await expect
    .poll(() => page.evaluate(() => document.body.classList.contains("is-dragging")), { timeout: 1000 })
    .toBeFalsy();
});
