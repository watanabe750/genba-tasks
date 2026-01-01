import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/apiClient";
import { getUserMessage, logError } from "../lib/errorHandler";

type FieldErr = string | null;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [errTop, setErrTop] = useState<string | null>(null);
  const [errEmail, setErrEmail] = useState<FieldErr>(null);

  const emailInvalid = useMemo(() => {
    if (email.trim() === "") return "メールアドレスを入力してください。";
    if (!emailRe.test(email)) return "メールアドレスの形式が正しくありません。";
    return null;
  }, [email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrTop(null);

    const eErr = emailInvalid;
    setErrEmail(eErr);
    if (eErr) return;

    setSubmitting(true);
    try {
      await api.post("/auth/password", {
        email: email.trim(),
        redirect_url: `${window.location.origin}/reset-password`,
      });

      setSuccess(true);
    } catch (err: unknown) {
      logError(err, 'ForgotPassword');
      const msg = getUserMessage(err);
      setErrTop(msg || "パスワードリセットメールの送信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h1 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">
                メールを送信しました
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                パスワード再設定のリンクをメールでお送りしました。
                <br />
                メールをご確認の上、リンクをクリックしてパスワードを再設定してください。
              </p>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                メールが届かない場合は、迷惑メールフォルダをご確認ください。
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                ログインページに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
            パスワードを忘れた方
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
            登録したメールアドレスを入力してください。
            <br />
            パスワード再設定のリンクをお送りします。
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  ${errEmail ? "border-red-300 focus:ring-red-200 dark:border-red-600 dark:focus:ring-red-800" : "border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-800"}`}
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white text-sm font-medium disabled:opacity-60 hover:bg-blue-700"
            >
              {submitting && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path d="M22 12a10 10 0 0 1-10 10" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              )}
              パスワード再設定メールを送信
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400">
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              ログインページに戻る
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
