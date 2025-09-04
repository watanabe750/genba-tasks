import { test, expect } from "@playwright/test";
import { createTaskViaApi, openTasks } from "./helpers";

test("子完了で親の 自動 x/y OK が更新される", async ({ page }) => {
  const p = await createTaskViaApi(page, { title: `P-${Date.now()}`, site: "E2E" });
  const c1 = await createTaskViaApi(page, { title: "a", parent_id: p.id });
  await createTaskViaApi(page, { title: "b", parent_id: p.id });

  await openTasks(page);

  const leafstats = page.getByTestId(`leafstats-${p.id}`);
  await expect(leafstats).toHaveText(/自動\s+0\/2\s+OK/);

  // 子 a を完了
  await page.getByTestId(`task-done-${c1.id}`).check();

  await expect(leafstats).toHaveText(/自動\s+1\/2\s+OK/);
});
