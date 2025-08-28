// src/components/Header.tsx
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../providers/useAuth";

const Header = () => {
  const qc = useQueryClient();
  const { authed, uid, name, signOut } = useAuth();

  const [theme, setTheme] = useState<"light" | "dark">(
    (localStorage.getItem("theme") as "light" | "dark") || "light"
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const handleLogout = async () => {
    qc.clear();
    await signOut();
  };

  return (
    <header className="bg-blue-600 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        {/* ← 完全な白＆うっすら影で視認性UP */}
        <Link
          to="/"
          className="text-white text-xl font-bold tracking-wide drop-shadow-sm"
        >
          現場タスク管理アプリ
        </Link>

        <div className="flex items-center gap-3 text-sm">
          {authed ? (
            <>
              <span className="opacity-90">{(name ?? uid) ?? ""} さん</span>
              {uid && <span className="text-xs opacity-90">uid: {uid}</span>}
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded px-2 py-1 bg-white/10 hover:bg-white/20"
                aria-label="テーマを切り替え"
                title="テーマを切り替え"
              >
                {theme === "dark" ? "🌙" : "🌞"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded px-3 py-1 bg-white/10 hover:bg-white/20"
                data-testid="header-logout"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link to="/login" className="rounded px-3 py-1 bg-white/10 hover:bg-white/20">
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
