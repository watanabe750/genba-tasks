// tests/.auth/setup.spec.ts
import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "e2e@example.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "password";
const API_ORIGIN =
  process.env.PW_API_ORIGIN /* 推奨: http://localhost:3000 */ ||
  process.env.VITE_API_ORIGIN ||
  "http://localhost:3000";

test.setTimeout(90_000);

test("login and save storage", async ({ page, context }) => {
  await context.clearCookies();
  await page.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });

  // ---- ここを Vite 経由の fetch ではなく Rails 直叩きにする ----
  const res = await page.request.post(new URL("/api/auth/sign_in", API_ORIGIN).toString(), {
    data: { email: EMAIL, password: PASSWORD },
    timeout: 15000,
  });

  if (!res.ok()) {
    // 無ければサインアップ→再サインイン（どちらも直叩き）
    await page.request.post(new URL("/api/auth", API_ORIGIN).toString(), {
      data: { email: EMAIL, password: PASSWORD, password_confirmation: PASSWORD },
      timeout: 15000,
    }).catch(() => {});
  }
  const sres = res.ok() ? res : await page.request.post(new URL("/api/auth/sign_in", API_ORIGIN).toString(), {
    data: { email: EMAIL, password: PASSWORD },
    timeout: 15000,
  });

  const h = sres.headers();
  await page.addInitScript((p: any) => {
    if (!p.at || !p.client || !p.uid) return;
    localStorage.setItem("access-token", p.at);
    localStorage.setItem("client", p.client);
    localStorage.setItem("uid", p.uid);
    if (p.expiry) localStorage.setItem("expiry", p.expiry);
    if (p.tokenType) localStorage.setItem("token-type", p.tokenType);
  }, {
    at: h["access-token"] ?? "",
    client: h["client"] ?? "",
    uid: h["uid"] ?? "",
    expiry: h["expiry"] ?? "",
    tokenType: h["token-type"] ?? "Bearer",
  });
  // ------------------------------------------------------------

  // 一覧でトークン有効性を確認してから保存
  await page.goto("/tasks", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.dispatchEvent(new Event("auth:refresh")));
  await page.waitForResponse(r =>
    r.url().includes("/api/tasks") && r.request().method() === "GET" && r.status() === 200,
    { timeout: 15000 }
  ).catch(() => {});

  await context.storageState({ path: "tests/.auth/storage.json" });
  await context.storageState({ path: "tests/.auth/e2e.json" });

  expect(true).toBeTruthy();
});
