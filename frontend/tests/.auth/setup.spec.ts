// tests/.auth/setup.spec.ts
import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "e2e@example.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "password";

test("login and save storage", async ({ page, context }) => {
  // まず /login を開いて同一オリジンで実行
  await page.goto("/login");

  // 1) プログラムでサインイン（失敗なら登録→再サインイン）
  const result = await page.evaluate(async ({ email, password }) => {
    async function signIn() {
      const res = await fetch("/api/auth/sign_in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return res;
    }
    async function signUp() {
      // devise_token_auth 想定
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          password_confirmation: password,
        }),
      });
      return res;
    }

    // サインイン試行
    let res = await signIn();

    // 401 ならユーザー作成を試みてから再サインイン
    if (res.status === 401) {
      await signUp().catch(() => undefined);
      res = await signIn();
    }

    if (!res.ok) {
      return { ok: false, status: res.status, note: "sign_in failed" };
    }

    // レスポンスヘッダからトークン取得
    const at = res.headers.get("access-token");
    const client = res.headers.get("client");
    const uid = res.headers.get("uid");
    const expiry = res.headers.get("expiry");
    const tokenType = res.headers.get("token-type");

    if (!at || !client || !uid) {
      return { ok: false, status: 200, note: "missing headers" };
    }

    // アプリが読むキーに保存（AuthContext 準拠）
    localStorage.setItem("access-token", at);
    localStorage.setItem("client", client);
    localStorage.setItem("uid", uid);
    if (expiry) localStorage.setItem("expiry", expiry);
    if (tokenType) localStorage.setItem("token-type", tokenType);

    // AuthProvider が拾うイベントを発火（実装済みの on 'auth:refresh' を使用）
    window.dispatchEvent(new Event("auth:refresh"));

    return { ok: true };
  }, { email: EMAIL, password: PASSWORD });

  // 2) フォールバック（万一ヘッダ読めない環境用）：UI ログイン
  if (!result?.ok) {
    // 可能性のあるセレクタを総当たり（存在するものが使われる）
    const emailSel = 'input[type="email"], input[name="email"], [data-testid="login-email"]';
    const passSel  = 'input[type="password"], input[name="password"], [data-testid="login-password"]';
    await page.locator(emailSel).first().fill(EMAIL);
    await page.locator(passSel).first().fill(PASSWORD);
    await page.getByRole("button", { name: /ログイン|Sign\s*In|Log\s*in/i }).click();
  }

  // 3) タスクページへ
  await page.goto("/tasks");
  // 見出し or URL でログイン成功を確認
  await expect(page.getByText("タスク一覧ページ")).toBeVisible({ timeout: 15_000 });

  // 4) ストレージを保存（以降の auth プロジェクトが使う）
  await context.storageState({ path: "tests/.auth/storage.json" });
});
