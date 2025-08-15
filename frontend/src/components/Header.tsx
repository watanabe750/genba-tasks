import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "../lib/apiClient";
import { devSignIn } from "../lib/devSignIn";
import { Link } from "react-router-dom";

type Tokens = { uid: string };
const readTokens = (): Tokens | null => {
  try {
    const raw = localStorage.getItem("authTokens");
    if (!raw) return null;
    const t = JSON.parse(raw);
    return t?.uid ? { uid: String(t.uid) } : null;
  } catch {
    return null;
  }
};

const Header = () => {
  const [user, setUser] = useState<Tokens | null>(() => readTokens());
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const onLogout = () => setUser(null);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "authTokens") setUser(readTokens());
    };
    window.addEventListener("auth:logout", onLogout);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("auth:logout", onLogout);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const handleLogout = () => {
    signOut();
    qc.clear();
    nav("/signin");
  };

  const handleDevLogin = async () => {
    await devSignIn();
    setUser(readTokens());
    qc.invalidateQueries({ queryKey: ["priorityTasks"] });
    qc.invalidateQueries({ queryKey: ["tasks"] });
    nav("/tasks");
  };

  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold">
          現場タスク管理アプリ
        </Link>

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="opacity-90">uid: {user.uid}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link
                to="/signin"
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
              >
                ログイン
              </Link>
              <button
                type="button"
                onClick={handleDevLogin}
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
                title="開発用: dev@example.com / password"
              >
                開発ログイン
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
