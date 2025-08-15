import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { useState } from "react";

type FromState = { from?: { pathname: string } } | null;

export default function SignInPage() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const redirectTo = (loc.state as FromState)?.from?.pathname ?? "/tasks";

  const [email, setEmail] = useState("dev@example.com");
  const [password, setPassword] = useState("password");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">サインイン</h1>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr(null);
          setPending(true);
          try {
            await signIn(email, password);
            nav(redirectTo, { replace: true });
          } catch {
            setErr("ログインに失敗しました");
          } finally {
            setPending(false);
          }
        }}
      >
        <label className="block">
          <span className="text-sm">メール</span>
          <input
            className="mt-1 w-full border rounded p-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm">パスワード</span>
          <input
            className="mt-1 w-full border rounded p-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-gray-900 text-white rounded py-2 disabled:opacity-60"
        >
          {pending ? "送信中..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}
