// tests/.auth/setup.spec.ts
import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "e2e@example.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "password";

test.setTimeout(90_000);

test("login and save storage", async ({ page, context }) => {
  await context.clearCookies();
  await page.addInitScript(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
  });

  // 同一オリジンに乗る
  await page.goto("/login");

  // --- 1) プログラムログイン（失敗したら UI フォールバック） ---
  const result = await page.evaluate(async ({ email, password }) => {
    async function signIn() {
      return fetch("/api/auth/sign_in", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });
    }
    async function signUp() {
      return fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ email, password, password_confirmation: password }),
        credentials: "same-origin",
      });
    }

    let res = await signIn();
    if (res.status === 401) {
      await signUp().catch(() => undefined);
      res = await signIn();
    }
    if (!res.ok) return { ok: false, status: res.status };

    const at = res.headers.get("access-token");
    const client = res.headers.get("client");
    const uid = res.headers.get("uid");
    const expiry = res.headers.get("expiry");
    const tokenType = res.headers.get("token-type");
    if (!at || !client || !uid) return { ok: false, status: 200 };

    localStorage.setItem("access-token", at);
    localStorage.setItem("client", client);
    localStorage.setItem("uid", uid);
    if (expiry) localStorage.setItem("expiry", expiry);
    if (tokenType) localStorage.setItem("token-type", tokenType);

    // /login 上でも一度通知
    window.dispatchEvent(new Event("auth:refresh"));
    return { ok: true };
  }, { email: EMAIL, password: PASSWORD });

  if (!result?.ok) {
    const emailSel = 'input[type="email"], input[name="email"], [data-testid="login-email"]';
    const passSel  = 'input[type="password"], input[name="password"], [data-testid="login-password"]';
    await page.locator(emailSel).first().fill(EMAIL);
    await page.locator(passSel).first().fill(PASSWORD);
    await page.getByRole("button", { name: /ログイン|Sign\s*In|Log\s*in/i }).click();
  }

  // --- 2) /tasks へ。Provider マウント後に再通知し、/api/tasks の 200 を待つ ---
  await page.goto("/tasks", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.dispatchEvent(new Event("auth:refresh")));

  const reachedViaApi = await page
    .waitForResponse(
      r => r.url().includes("/api/tasks") && r.request().method() === "GET" && r.status() === 200,
      { timeout: 15_000 }
    )
    .then(() => true)
    .catch(() => false);

  // --- 3) まだなら UI ログインのフォールバックを実施 ---
  if (!reachedViaApi || page.url().includes("/login")) {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const emailSel = 'input[type="email"], input[name="email"], [data-testid="login-email"]';
    const passSel  = 'input[type="password"], input[name="password"], [data-testid="login-password"]';
    await page.locator(emailSel).first().fill(EMAIL);
    await page.locator(passSel).first().fill(PASSWORD);
    await page.getByRole("button", { name: /ログイン|Sign\s*In|Log\s*in/i }).click();
    await page.waitForURL(/\/tasks(\?.*)?$/, { timeout: 15_000 }).catch(() => {});
  }

  // --- 4) 最終到達の確定（どれかが見えればOK） ---
  const reached = await Promise.any([
    page.waitForSelector('[data-testid="task-list-root"]', { state: "attached", timeout: 8_000 }).then(() => true),
    page.getByTestId("filter-bar").waitFor({ state: "visible", timeout: 8_000 }).then(() => true),
    page.getByRole("heading", { name: "タスク一覧ページ" }).waitFor({ state: "visible", timeout: 8_000 }).then(() => true),
  ]).catch(() => false);

  expect(reached).toBeTruthy();
  await page.waitForLoadState("networkidle");

  // --- 5) ストレージ保存（以降の auth プロジェクトが利用） ---
  await context.storageState({ path: "tests/.auth/e2e.json" });
});
