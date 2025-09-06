import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import useAuth from "../providers/useAuth";

const HEADER_H = "h-14"; // 3.5rem

export default function Header() {
  const qc = useQueryClient();
  const { authed, uid, name, signOut } = useAuth();

  const handleLogout = async () => {
    qc.clear();
    await signOut();
  };

  const display = (name?.trim()) || (uid ? String(uid).split("@")[0] : "");

  return (
    <header
  className={`fixed inset-x-0 top-0 z-50 bg-blue-600 text-white ${HEADER_H}
  border-b border-white/10
  shadow-[0_10px_30px_-6px_rgba(0,0,0,0.35)]`}
>
      {/* 左寄せ：max-wを使わずpxのみ */}
      <div className="flex h-full items-center justify-between px-4">
        <Link
          to="/"
          className="text-white font-semibold tracking-wide drop-shadow text-lg md:text-xl"
          title="ホーム"
        >
          Genba Tasks
        </Link>

        <div className="flex items-center gap-3 text-sm">
          {authed ? (
            <>
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
}
