// tests/subtasks-nesting.spec.ts
import { test, expect } from "@playwright/test";
import { createTaskViaApi } from "./helpers";

// 各ノード、子は最大4つまで／5つ目は不可
test("親に子4つまで、5つ目は不可", async ({ page }) => {
  await page.goto("/tasks"); // 先に踏む（helpers 側で reload 済み）
  const p = await createTaskViaApi(page, { title: `E2E親-${Date.now()}` });

  const parent = page.getByTestId(`task-item-${p.id}`).first();
  await expect(parent).toBeVisible();

  const plus = parent.locator('[data-testid^="task-add-child-"]').first();
  for (let i = 1; i <= 4; i++) {
    await plus.scrollIntoViewIfNeeded();
    await plus.click();
    await parent.getByTestId("child-title-input").fill(`子${i}`);
    await parent.getByRole("button", { name: "作成" }).click();
    await expect(parent.getByRole("heading", { name: `子${i}` })).toBeVisible();
  }

  await expect(plus).toBeDisabled();
});

test("子の下にさらに子を作れる（ネスト作成+折りたたみ）", async ({ page }) => {
  await page.goto("/tasks");
  const p = await createTaskViaApi(page, { title: `E2E親-${Date.now()}` });

  const parent = page.getByTestId(`task-item-${p.id}`).first();
  await expect(parent).toBeVisible();

  const plusParent = parent.locator('[data-testid^="task-add-child-"]').first();
  await plusParent.scrollIntoViewIfNeeded();
  await expect(plusParent).toBeEnabled();
  await plusParent.click();
  const uid = Date.now();
  const childName = `子A-${uid}`;
  await parent.getByTestId("child-title-input").fill(childName);
  await parent.getByRole("button", { name: "作成" }).click();

  // 見出しから一番近い TaskItem を祖先辿りで特定
  const childAHeading = page
    .getByRole("heading", { name: childName, exact: true })
    .first();
  const childA = childAHeading.locator(
    "xpath=ancestor::*[@data-testid][starts-with(@data-testid,'task-item-')][1]"
  );
  await expect(childA).toBeVisible();

  const plusChild = childA.getByTestId(/task-add-child-/).first();
  await expect(plusChild).toBeEnabled();
  await plusChild.click();
  await childA.getByTestId("child-title-input").fill("孫A-1");
  await childA.getByRole("button", { name: "作成" }).click();
  await expect(
    childA.getByRole("heading", { name: "孫A-1", exact: true }).first()
  ).toBeVisible();

  const toggleHide = parent.getByRole("button", { name: /子を隠す/ }).first();
  await toggleHide.click();
  await expect(
    parent.getByRole("heading", { name: childName, exact: true })
  ).toHaveCount(0);

  const toggleShow = parent.getByRole("button", { name: /子を表示/ }).first();
  await toggleShow.click();
  await expect(
    parent.getByRole("heading", { name: childName, exact: true })
  ).toBeVisible();
});
