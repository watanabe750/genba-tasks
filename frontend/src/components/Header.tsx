// src/components/Header.tsx
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import useAuth from "../providers/useAuth";

const HEADER_H = "h-14"; // 3.5rem

const Header = () => {
  const qc = useQueryClient();
  const { authed, uid, name, signOut } = useAuth();

  const handleLogout = async () => {
    qc.clear();
    await signOut();
  };

  // 表示名（なければ uid の @前）
  const display =
    (name && name.trim()) ||
    (uid ? String(uid).split("@")[0] : "");

  return (
    <header className={`fixed inset-x-0 top-0 z-50 bg-blue-600 text-white ${HEADER_H}`}>
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-white text-xl font-bold tracking-wide drop-shadow-sm">
          現場タスク管理アプリ
        </Link>

        <div className="flex items-center gap-3 text-sm">
          {authed ? (
            <>
              {/* ← 名前をクリックで /account へ遷移 */}
              <Link
                to="/account"
                className="opacity-90 hover:underline underline-offset-2"
                data-testid="header-user"
                title="アカウント"
              >
                {display} さん
              </Link>
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
