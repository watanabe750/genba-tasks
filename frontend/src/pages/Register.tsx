import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../providers/useAuth";

type FieldErr = string | null;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { authed, signUp } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errTop, setErrTop] = useState<string | null>(null);
  const [errName, setErrName] = useState<FieldErr>(null);
  const [errEmail, setErrEmail] = useState<FieldErr>(null);
  const [errPw, setErrPw] = useState<FieldErr>(null);
  const [errPwConfirm, setErrPwConfirm] = useState<FieldErr>(null);

  // 既ログインなら /tasks
  useEffect(() => {
    if (authed) nav("/tasks", { replace: true });
  }, [authed, nav]);

  const nameInvalid = useMemo(() => {
    if (name.trim() === "") return "名前を入力してください。";
    return null;
  }, [name]);

  const emailInvalid = useMemo(() => {
    if (email.trim() === "") return "メールアドレスを入力してください。";
    if (!emailRe.test(email)) return "メールアドレスの形式が正しくありません。";
    return null;
  }, [email]);

  const pwInvalid = useMemo(() => {
    if (password.trim() === "") return "パスワードを入力してください。";
    if (password.length < 6) return "パスワードは6文字以上で入力してください。";
    return null;
  }, [password]);

  const pwConfirmInvalid = useMemo(() => {
    if (passwordConfirmation.trim() === "") return "パスワード（確認）を入力してください。";
    if (password !== passwordConfirmation) return "パスワードが一致しません。";
    return null;
  }, [password, passwordConfirmation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrTop(null);

    const nErr = nameInvalid;
    const eErr = emailInvalid;
    const pErr = pwInvalid;
    const pcErr = pwConfirmInvalid;

    setErrName(nErr);
    setErrEmail(eErr);
    setErrPw(pErr);
    setErrPwConfirm(pcErr);

    if (nErr || eErr || pErr || pcErr) return;

    setSubmitting(true);
    try {
      await signUp(name.trim(), email.trim(), password, passwordConfirmation);
      nav("/tasks", { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: { full_messages?: string[] } } }; message?: string };
      const msg =
        error?.response?.data?.errors?.full_messages?.[0] ??
        error?.message ??
        "登録に失敗しました。もう一度お試しください。";
      setErrTop(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 text-center">新規登録</h1>
          <p className="text-sm text-gray-600 text-center mt-1">Genba Tasks アカウント作成</p>

          {errTop && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              data-testid="register-error-banner"
            >
              {errTop}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                名前
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm outline-none
                  ${errName ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errName}
                aria-describedby={errName ? "name-error" : undefined}
                disabled={submitting}
                required
                autoFocus
              />
              {errName && (
                <p id="name-error" className="mt-1 text-xs text-red-600">
                  {errName}
                </p>
              )}
            </div>

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
              />
              {errEmail && (
                <p id="email-error" className="mt-1 text-xs text-red-600">
                  {errEmail}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  className={`block w-full rounded-md border px-3 py-2 pr-20 text-sm outline-none
                    ${errPw ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                パスワード（確認）
              </label>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm outline-none
                  ${errPwConfirm ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"}`}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                aria-invalid={!!errPwConfirm}
                aria-describedby={errPwConfirm ? "password-confirm-error" : undefined}
                disabled={submitting}
                required
              />
              {errPwConfirm && (
                <p id="password-confirm-error" className="mt-1 text-xs text-red-600">
                  {errPwConfirm}
                </p>
              )}
            </div>

            <div className="pt-2">
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
                登録
              </button>
            </div>
          </form>

          <p className="mt-4 text-center text-xs text-gray-600">
            すでにアカウントをお持ちですか？{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              ログイン
            </a>
          </p>
        </div>

        <p className="mt-3 text-center text-xs text-gray-500">
          登録することで、利用規約とプライバシーポリシーに同意したものとみなされます。
        </p>
      </div>
    </div>
  );
}
