// src/components/Sidebar.tsx
import { NavLink, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTasksFromUrl } from "../features/tasks/useTasks";
import { useSiteList } from "../features/tasks/useSiteList";
import useAuth from "../providers/useAuth";
import { useSidebar } from "../contexts/SidebarContext";

const Sidebar = () => {
  const { authed } = useAuth();
  const DEMO = import.meta.env.VITE_DEMO_MODE === "true";
  const enabled = authed || DEMO;
  const { isOpen, close } = useSidebar();

  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showTasksLinks, setShowTasksLinks] = useState(true);
  const [showSitesLinks, setShowSitesLinks] = useState(true);

  // ページ遷移時にサイドバーを閉じる（モバイルのみ）
  useEffect(() => {
    close();
  }, [location.pathname, close]);

  // 全タスクを取得して現場一覧を作成
  const { data: allTasks = [] } = useTasksFromUrl(enabled);
  const { sitesWithCount } = useSiteList(allTasks);

  const currentSite = sp.get("site") ?? "";

  const selectSite = (site: string) => {
    console.log("[Sidebar] selectSite called with:", site);
    const next = new URLSearchParams(sp);

    // 他のフィルターパラメータをクリア
    next.delete("status");
    next.delete("progress_min");
    next.delete("progress_max");
    next.delete("parents_only");

    if (site) {
      next.set("site", site);
    } else {
      next.delete("site");
    }

    console.log("[Sidebar] Navigating to:", next.toString());

    // /tasksページ以外にいる場合は、/tasksに遷移する
    if (location.pathname !== "/tasks") {
      navigate(`/tasks?${next.toString()}`, { replace: false });
    } else {
      navigate(`?${next.toString()}`, { replace: false });
    }
  };

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={close}
          aria-label="サイドバーを閉じる"
        />
      )}

      {/* サイドバー本体 */}
      <aside
        className={[
          "fixed left-0 top-14",
          "w-64 md:w-48 lg:w-52",
          "h-[calc(100vh-3.5rem)]",
          "bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-0",
          "border-r border-gray-200 dark:border-gray-700 shadow-md",
          "overflow-y-auto",
          "p-3 md:p-3.5",
          "z-40",
          "transition-transform duration-300 ease-in-out",
          // モバイル: デフォルトで隠す、isOpenで表示
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
      <nav className="flex flex-col gap-3 text-[14px] md:text-[15px] text-gray-900 dark:text-gray-100">
        {/* タスクセクション - 折りたたみ可能 */}
        <div>
          <button
            onClick={() => setShowTasksLinks(!showTasksLinks)}
            className="flex items-center gap-1 w-full text-left font-medium mb-2 hover:text-blue-700 dark:hover:text-blue-400"
          >
            <span className="text-xs">{showTasksLinks ? "▼" : "▶"}</span>
            <span>ページ</span>
          </button>
          {showTasksLinks && (
            <div className="flex flex-col gap-2 ml-4">
              <NavLink
                to="/tasks"
                className={({ isActive }) =>
                  isActive ? "font-semibold text-blue-700 dark:text-blue-400" : "hover:underline"
                }
              >
                タスク
              </NavLink>
              <NavLink
                to="/calendar"
                className={({ isActive }) =>
                  isActive ? "font-semibold text-blue-700 dark:text-blue-400" : "hover:underline"
                }
              >
                カレンダー
              </NavLink>
              <NavLink
                to="/gallery"
                className={({ isActive }) =>
                  isActive ? "font-semibold text-blue-700 dark:text-blue-400" : "hover:underline"
                }
              >
                ギャラリー
              </NavLink>
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  isActive ? "font-semibold text-blue-700 dark:text-blue-400" : "hover:underline"
                }
              >
                アカウント
              </NavLink>
              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  isActive ? "font-semibold text-blue-700 dark:text-blue-400" : "hover:underline"
                }
              >
                通知設定
              </NavLink>
              <NavLink
                to="/help"
                className={({ isActive }) =>
                  isActive ? "font-semibold text-blue-700 dark:text-blue-400" : "hover:underline"
                }
              >
                ヘルプ
              </NavLink>
            </div>
          )}
        </div>

        {/* 現場一覧セクション - 折りたたみ可能 */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <button
            onClick={() => setShowSitesLinks(!showSitesLinks)}
            className="flex items-center gap-1 w-full text-left font-medium mb-2 hover:text-blue-700 dark:hover:text-blue-400"
          >
            <span className="text-xs">{showSitesLinks ? "▼" : "▶"}</span>
            <span>現場一覧</span>
          </button>
          {showSitesLinks && (
            <div className="flex flex-col gap-1.5 ml-4">
              {/* すべての現場を一番上に */}
              <button
                onClick={() => selectSite("")}
                className={[
                  "text-left px-2 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                  !currentSite ? "bg-blue-100 dark:bg-blue-900/50 font-semibold text-blue-700 dark:text-blue-400" : "",
                ].join(" ")}
              >
                <span className="block truncate">すべての現場</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">({allTasks.length})</span>
              </button>

              {/* 各現場（追加順） */}
              {sitesWithCount.map(({ site, count }) => (
                <button
                  key={site}
                  onClick={() => selectSite(site)}
                  className={[
                    "text-left px-2 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                    currentSite === site ? "bg-blue-100 dark:bg-blue-900/50 font-semibold text-blue-700 dark:text-blue-400" : "",
                  ].join(" ")}
                  title={site}
                >
                  <span className="block truncate">{site}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({count})</span>
                </button>
              ))}

              {sitesWithCount.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 px-2">現場がありません</p>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* モバイル用閉じるボタン */}
      <button
        onClick={close}
        className="md:hidden absolute top-2 right-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        aria-label="閉じる"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </aside>
    </>
  );
};

export default Sidebar;
