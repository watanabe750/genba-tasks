import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/apiClient";

type RouteState = { from?: { pathname?: string } };

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "ログインに失敗しました";
}

// AuthContextと同等の最小ヘルパ（重複してOK：まず解消優先）
function applyTokensToAxios(tokens: { at?: string; client?: string; uid?: string }) {
  const { at, client, uid } = tokens;
  if (at) api.defaults.headers.common["access-token"] = at; else delete api.defaults.headers.common["access-token"];
  if (client) api.defaults.headers.common["client"] = client; else delete api.defaults.headers.common["client"];
  if (uid) api.defaults.headers.common["uid"] = uid; else delete api.defaults.headers.common["uid"];
}
function saveTokens(tokens: { at?: string; client?: string; uid?: string }) {
  if (tokens.at) localStorage.setItem("access-token", tokens.at); else localStorage.removeItem("access-token");
  if (tokens.client) localStorage.setItem("client", tokens.client); else localStorage.removeItem("client");
  if (tokens.uid) localStorage.setItem("uid", tokens.uid); else localStorage.removeItem("uid");
}

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
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
      const res = await api.post("/api/auth/sign_in", { email, password });
      const at = typeof res.headers["access-token"] === "string" ? res.headers["access-token"] : undefined;
      const client = typeof res.headers["client"] === "string" ? res.headers["client"] : undefined;
      const headerUid = typeof res.headers["uid"] === "string" ? res.headers["uid"] : undefined;
      const uid = headerUid ?? email;

      saveTokens({ at, client, uid });
      applyTokensToAxios({ at, client, uid });

      // AuthProvider の初期化が次回レンダでトークンを検出する
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