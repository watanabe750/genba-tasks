// tests/.auth/setup.spec.ts
import { test, expect } from "@playwright/test";

test("login and save storage", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByTestId("login-email").fill("e2e@example.com");
  await page.getByTestId("login-password").fill("password");
  await page.getByRole("button", { name: "ログイン" }).click();

  await expect(page).toHaveURL(/\/tasks(\?.*)?$/);
  await expect(page.getByTestId("header-logout")).toBeVisible();

  // DTA が入っているか軽く確認
  const dta = await page.evaluate(() => ({
    at: localStorage.getItem("access-token"),
    client: localStorage.getItem("client"),
    uid: localStorage.getItem("uid"),
  }));
  expect(Boolean(dta.at && dta.client && dta.uid)).toBeTruthy();

  await context.storageState({ path: "tests/.auth/storage.json" });
});
