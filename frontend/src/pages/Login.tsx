// src/pages/Login.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../providers/useAuth";

type FieldErr = string | null;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function takeAuthFrom(): string | null {
  try {
    const v = sessionStorage.getItem("auth:from");
    if (v) sessionStorage.removeItem("auth:from");
    return v;
  } catch {
    return null;
  }
}

export default function Login() {
  const { authed, signIn } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errTop, setErrTop] = useState<string | null>(null);
  const [errEmail, setErrEmail] = useState<FieldErr>(null);
  const [errPw, setErrPw] = useState<FieldErr>(null);

  // 期限切れ通知
  useEffect(() => {
    try {
      if (sessionStorage.getItem("auth:expired") === "1") {
        setErrTop(
          "セッションの有効期限が切れました。もう一度ログインしてください。"
        );
        sessionStorage.removeItem("auth:expired");
      }
    } catch {/* ignore */}
  }, []);

  // 既ログインなら /tasks
  useEffect(() => {
    if (authed) nav("/tasks", { replace: true });
  }, [authed, nav]);

  const emailInvalid = useMemo(() => {
    if (email.trim() === "") return "メールアドレスを入力してください。";
    if (!emailRe.test(email)) return "メールアドレスの形式が正しくありません。";
    return null;
  }, [email]);

  const pwInvalid = useMemo(() => {
    if (pw.trim() === "") return "パスワードを入力してください。";
    return null;
  }, [pw]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // ← フォーム遷移を止める（ここ重要）
    setErrTop(null);

    const eErr = emailInvalid;
    const pErr = pwInvalid;
    setErrEmail(eErr);
    setErrPw(pErr);
    if (eErr || pErr) return;

    setSubmitting(true);
    try {
      // useAuth.signIn は /api/auth/sign_in を axios で叩く前提
      await signIn(email.trim(), pw);

      // 通常ログインはデモフラグ解除
      try {
        sessionStorage.removeItem("auth:demo");
        window.dispatchEvent(new Event("auth:refresh"));
      } catch {/* ignore */}

      const dest = takeAuthFrom() || "/tasks";
      nav(dest, { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.errors?.[0] ??
        err?.message ??
        "ログインに失敗しました。メールアドレスまたはパスワードをご確認ください。";
      setErrTop(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemo() {
    setErrTop(null);
    const demoEmail = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
    const demoPass = import.meta.env.VITE_DEMO_PASS as string | undefined;

    if (!demoEmail || !demoPass) {
      setErrTop("ゲストユーザーが未設定です（VITE_DEMO_EMAIL / VITE_DEMO_PASS）。");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(demoEmail, demoPass);
      try {
        sessionStorage.setItem("auth:demo", "1");
        window.dispatchEvent(new Event("auth:refresh"));
      } catch {/* ignore */}
      const dest = takeAuthFrom() || "/tasks";
      nav(dest, { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.errors?.[0] ??
        err?.message ??
        "ゲストログインに失敗しました。しばらくしてからお試しください。";
      setErrTop(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow rounded-2xl p-6">
          {/* タイトル／説明 */}
          <h1 className="text-2xl font-bold text-gray-900 text-center">Genba Tasks</h1>
          <p className="text-sm text-gray-600 text-center mt-1">現場タスクを“見える化”</p>

          {/* エラーバナー */}
          {errTop && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              data-testid="login-error-banner"
            >
              {errTop}
            </div>
          )}

          {/* フォーム（action を付けない / onSubmit で XHR 化） */}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm outline-none
                  ${errEmail ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errEmail}
                aria-describedby={errEmail ? "email-error" : undefined}
                disabled={submitting}
                required
                autoFocus
              />
              {errEmail && (
                <p id="email-error" className="mt-1 text-xs text-red-600">
                  {errEmail}
                </p>
              )}
            </div>

            {/* Password + 表示切替 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  className={`block w-full rounded-md border px-3 py-2 pr-20 text-sm outline-none
                    ${errPw ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"}`}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  aria-invalid={!!errPw}
                  aria-describedby={errPw ? "password-error" : undefined}
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-2 my-auto text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50"
                  aria-pressed={showPw}
                >
                  {showPw ? "隠す" : "表示"}
                </button>
              </div>
              {errPw && (
                <p id="password-error" className="mt-1 text-xs text-red-600">
                  {errPw}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white text-sm font-medium disabled:opacity-60"
              >
                {submitting && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                    <path d="M22 12a10 10 0 0 1-10 10" fill="none" stroke="currentColor" strokeWidth="4" />
                  </svg>
                )}
                ログイン
              </button>

              <button
                type="button"
                onClick={handleDemo}
                disabled={submitting}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
                data-testid="login-guest-button"
              >
                ゲストユーザーで試す
              </button>
            </div>
          </form>
        </div>

        <p className="mt-3 text-center text-xs text-gray-500">
          このページは保護されています。未ログインの場合はログインが必要です。
        </p>
      </div>
    </div>
  );
}
