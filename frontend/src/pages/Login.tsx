// src/pages/Login.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../providers/useAuth";

export default function Login() {
  const { signIn, authed } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("dev@example.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // 期限切れ通知があれば一度だけ表示
    const expired = sessionStorage.getItem("auth:expired");
    if (expired) {
      setError("ログインの有効期限が切れました。再ログインしてください。");
      sessionStorage.removeItem("auth:expired");
    }
  }, []);

  // ★ テストが localStorage にトークンを注入したケースを拾って自動遷移
  useEffect(() => {
    if (!authed) return;
    const from = sessionStorage.getItem("auth:from") || "/tasks";
    sessionStorage.removeItem("auth:from");
    nav(from, { replace: true });
  }, [authed, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      const from = sessionStorage.getItem("auth:from") || "/tasks";
      sessionStorage.removeItem("auth:from");
      nav(from, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.errors?.[0] ?? "ログインに失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-24 max-w-sm rounded-lg border p-6 shadow-sm">
      <h1 className="mb-4 text-lg font-semibold">ログイン</h1>
      {error && (
        <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded border p-2"
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <input
          className="w-full rounded border p-2"
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="w-full rounded bg-gray-900 px-3 py-2 text-white disabled:opacity-60"
          disabled={busy}
        >
          ログイン
        </button>
      </form>
    </div>
  );
}
