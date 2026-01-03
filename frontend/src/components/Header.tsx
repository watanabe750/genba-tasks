import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import useAuth from "../providers/useAuth";
import { useSidebar } from "../contexts/SidebarContext";
import { useDarkMode } from "../hooks/useDarkMode";
import { useNotifications } from "../features/notifications/useNotifications";
import { NotificationCenter } from "../features/notifications/NotificationCenter";

const HEADER_H = "h-14";

type HeaderProps = {
  /** ホームなどでバッジを隠したい時に false を渡す */
  showDemoBadge?: boolean;
};

export default function Header({ showDemoBadge = true }: HeaderProps) {
  const qc = useQueryClient();
  const { authed, uid, name, signOut } = useAuth();
  const { toggle } = useSidebar();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { unreadCount } = useNotifications();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const handleLogout = async () => {
    qc.clear();
    await signOut();
  };

  const display = name?.trim() || (uid ? String(uid).split("@")[0] : "");

  const [isDemo, setIsDemo] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        setIsDemo(sessionStorage.getItem("auth:demo") === "1");
      } catch {}
    };
    read();
    window.addEventListener("auth:refresh", read);
    window.addEventListener("focus", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("auth:refresh", read);
      window.removeEventListener("focus", read);
      window.removeEventListener("storage", read);
    };
  }, []);
  const DEMO = import.meta.env.VITE_DEMO_MODE === "true";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 bg-blue-600 dark:bg-blue-800 text-white ${HEADER_H} border-b border-white/10 shadow-[0_10px_30px_-6px_rgba(0,0,0,0.35)]`}
    >
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {authed && (
            <button
              onClick={toggle}
              className="md:hidden p-2 hover:bg-white/10 rounded transition-colors"
              aria-label="メニュー"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
          <Link
            to="/"
            className="text-white font-semibold tracking-wide drop-shadow text-lg md:text-xl"
            title="ホーム"
          >
            Genba Tasks
          </Link>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {(DEMO || isDemo) && showDemoBadge && (
            <span
              className="rounded px-2 py-0.5 bg-white/15 border border-white/20"
              data-testid="badge-demo"
              title="ゲストユーザーでログイン中"
            >
              デモモード
            </span>
          )}

          {/* 通知ベル */}
          {authed && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 hover:bg-white/10 rounded transition-colors relative"
                aria-label="通知"
                title="通知"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <NotificationCenter
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
              />
            </div>
          )}

          {/* ダークモード切り替えボタン */}
          <button
            type="button"
            onClick={toggleDark}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            aria-label={
              isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"
            }
            aria-pressed={isDark}
            title={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
          >
            {isDark ? (
              // 太陽アイコン（ライトモード）
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              // 月アイコン（ダークモード）
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

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
            <Link
              to="/login"
              className="rounded px-3 py-1 bg-white/10 hover:bg-white/20"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
