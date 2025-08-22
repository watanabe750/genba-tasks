import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../providers/useAuth";

const Header = () => {
  const qc = useQueryClient();
  const { authed, uid, signOut } = useAuth();

  const handleLogout = async () => {
    qc.clear(); // 任意：キャッシュ掃除
    await signOut(); // AuthContext側で /login に遷移する
  };

  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold">
          現場タスク管理アプリ
        </Link>

        <div className="flex items-center gap-3 text-sm">
          {authed ? (
            <>
              <span className="opacity-90">uid: {uid}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
                data-testid="header-logout"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
              >
                ログイン
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
