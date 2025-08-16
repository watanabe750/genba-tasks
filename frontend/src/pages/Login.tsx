import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";

type RouteState = { from?: { pathname?: string } };

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "ログインに失敗しました";
}

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const { signIn } = useAuth();
  const state = (loc.state ?? null) as RouteState | null;
  const from = state?.from?.pathname ?? "/tasks";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      nav(from, { replace: true });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-bold mb-4">ログイン</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">メールアドレス</label>
          <input
            className="w-full border rounded p-2"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">パスワード</label>
          <input
            className="w-full border rounded p-2"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          className="w-full border rounded p-2 disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}
