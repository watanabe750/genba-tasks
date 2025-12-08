import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/apiClient";

type FieldErr = string | null;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errTop, setErrTop] = useState<string | null>(null);
  const [errPw, setErrPw] = useState<FieldErr>(null);
  const [errPwConfirm, setErrPwConfirm] = useState<FieldErr>(null);

  // URLパラメータからトークン情報を取得
  const resetToken = searchParams.get("reset_password_token");
  const clientId = searchParams.get("client_id");
  const uid = searchParams.get("uid");

  useEffect(() => {
    if (!resetToken) {
      setErrTop("無効なリンクです。パスワード再設定メールからアクセスしてください。");
    }
  }, [resetToken]);

  const pwInvalid = useMemo(() => {
    if (password.trim() === "") return "パスワードを入力してください。";
    if (password.length < 8) return "パスワードは8文字以上で入力してください。";
    return null;
  }, [password]);

  const pwConfirmInvalid = useMemo(() => {
    if (passwordConfirmation.trim() === "") return "確認用パスワードを入力してください。";
    if (password !== passwordConfirmation) return "パスワードが一致しません。";
    return null;
  }, [password, passwordConfirmation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrTop(null);

    const pErr = pwInvalid;
    const pcErr = pwConfirmInvalid;
    setErrPw(pErr);
    setErrPwConfirm(pcErr);
    if (pErr || pcErr || !resetToken) return;

    setSubmitting(true);
    try {
      await api.put("/auth/password", {
        password,
        password_confirmation: passwordConfirmation,
        reset_password_token: resetToken,
      }, {
        headers: {
          ...(clientId && { client: clientId }),
          ...(uid && { uid }),
        },
      });

      // 成功したらログインページへ
      navigate("/login", {
        replace: true,
        state: { message: "パスワードを再設定しました。新しいパスワードでログインしてください。" },
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: { full_messages?: string[] } } }; message?: string };
      const msg =
        error?.response?.data?.errors?.full_messages?.[0] ??
        error?.message ??
        "パスワードの再設定に失敗しました。リンクの有効期限が切れている可能性があります。";
      setErrTop(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
            パスワード再設定
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
            新しいパスワードを入力してください
          </p>

          {errTop && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {errTop}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                新しいパスワード
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  className={`block w-full rounded-md border px-3 py-2 pr-20 text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                    ${errPw ? "border-red-300 focus:ring-red-200 dark:border-red-600 dark:focus:ring-red-800" : "border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-800"}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errPw}
                  aria-describedby={errPw ? "password-error" : undefined}
                  disabled={submitting || !resetToken}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-2 my-auto text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  aria-pressed={showPw}
                  disabled={!resetToken}
                >
                  {showPw ? "隠す" : "表示"}
                </button>
              </div>
              {errPw && (
                <p id="password-error" className="mt-1 text-xs text-red-600">
                  {errPw}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                8文字以上で入力してください
              </p>
            </div>

            <div>
              <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                新しいパスワード（確認）
              </label>
              <input
                id="password-confirm"
                name="password-confirmation"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  ${errPwConfirm ? "border-red-300 focus:ring-red-200 dark:border-red-600 dark:focus:ring-red-800" : "border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-800"}`}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                aria-invalid={!!errPwConfirm}
                aria-describedby={errPwConfirm ? "password-confirm-error" : undefined}
                disabled={submitting || !resetToken}
                required
              />
              {errPwConfirm && (
                <p id="password-confirm-error" className="mt-1 text-xs text-red-600">
                  {errPwConfirm}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !resetToken}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white text-sm font-medium disabled:opacity-60 hover:bg-blue-700"
            >
              {submitting && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path d="M22 12a10 10 0 0 1-10 10" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              )}
              パスワードを再設定
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400">
            <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              ログインページに戻る
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
