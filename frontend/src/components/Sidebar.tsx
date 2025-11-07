// src/components/Sidebar.tsx
import { NavLink, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useFilteredTasks } from "../features/tasks/useTasks";
import useAuth from "../providers/useAuth";

const Sidebar = () => {
  const { authed } = useAuth();
  const DEMO = import.meta.env.VITE_DEMO_MODE === "true";
  const enabled = authed || DEMO;

  const [sp, setSp] = useSearchParams();
  const [showTasksLinks, setShowTasksLinks] = useState(true);
  const [showSitesLinks, setShowSitesLinks] = useState(true);

  // 全タスクを取得して現場一覧を作成
  const { data: allTasks = [] } = useFilteredTasks({}, enabled);

  // 現場ごとのタスク数を集計（追加順=id順）
  const sitesWithCount = useMemo(() => {
    const siteMap = new Map<string, { count: number; firstId: number }>();

    allTasks.forEach((task) => {
      if (task.site && task.site.trim()) {
        const site = task.site.trim();
        const existing = siteMap.get(site);
        if (existing) {
          existing.count++;
          // より小さいIDを保持（追加順の早い方）
          existing.firstId = Math.min(existing.firstId, task.id);
        } else {
          siteMap.set(site, { count: 1, firstId: task.id });
        }
      }
    });

    // 追加順（firstId昇順）でソート
    return Array.from(siteMap.entries())
      .map(([site, data]) => ({ site, count: data.count, firstId: data.firstId }))
      .sort((a, b) => a.firstId - b.firstId);
  }, [allTasks]);

  const currentSite = sp.get("site") ?? "";

  const selectSite = (site: string) => {
    const next = new URLSearchParams(sp);
    if (site) {
      next.set("site", site);
    } else {
      next.delete("site");
    }
    setSp(next, { replace: true });
  };

  return (
    <aside
      className={[
        "fixed left-0 top-14",
        "w-44 md:w-48 lg:w-52",
        "h-[calc(100vh-3.5rem)]",
        "bg-gray-100/80 backdrop-blur-0",
        "border-r shadow-md",
        "overflow-y-auto",
        "p-3 md:p-3.5",
        "z-40",
      ].join(" ")}
    >
      <nav className="flex flex-col gap-3 text-[14px] md:text-[15px]">
        {/* タスクセクション - 折りたたみ可能 */}
        <div>
          <button
            onClick={() => setShowTasksLinks(!showTasksLinks)}
            className="flex items-center gap-1 w-full text-left font-medium mb-2 hover:text-blue-700"
          >
            <span className="text-xs">{showTasksLinks ? "▼" : "▶"}</span>
            <span>ページ</span>
          </button>
          {showTasksLinks && (
            <div className="flex flex-col gap-2 ml-4">
              <NavLink
                to="/tasks"
                className={({ isActive }) =>
                  isActive ? "font-semibold text-blue-700" : "hover:underline"
                }
              >
                タスク
              </NavLink>
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  isActive ? "font-semibold text-blue-700" : "hover:underline"
                }
              >
                アカウント
              </NavLink>
              <NavLink
                to="/help"
                className={({ isActive }) =>
                  isActive ? "font-semibold text-blue-700" : "hover:underline"
                }
              >
                ヘルプ
              </NavLink>
            </div>
          )}
        </div>

        {/* 現場一覧セクション - 折りたたみ可能 */}
        <div className="border-t pt-3">
          <button
            onClick={() => setShowSitesLinks(!showSitesLinks)}
            className="flex items-center gap-1 w-full text-left font-medium mb-2 hover:text-blue-700"
          >
            <span className="text-xs">{showSitesLinks ? "▼" : "▶"}</span>
            <span>📍 現場一覧</span>
          </button>
          {showSitesLinks && (
            <div className="flex flex-col gap-1.5 ml-4">
              {/* すべての現場を一番上に */}
              <button
                onClick={() => selectSite("")}
                className={[
                  "text-left px-2 py-1 rounded text-sm hover:bg-gray-200 transition-colors",
                  !currentSite ? "bg-blue-100 font-semibold text-blue-700" : "",
                ].join(" ")}
              >
                <span className="block truncate">すべての現場</span>
                <span className="text-xs text-gray-500">({allTasks.length})</span>
              </button>

              {/* 各現場（追加順） */}
              {sitesWithCount.map(({ site, count }) => (
                <button
                  key={site}
                  onClick={() => selectSite(site)}
                  className={[
                    "text-left px-2 py-1 rounded text-sm hover:bg-gray-200 transition-colors",
                    currentSite === site ? "bg-blue-100 font-semibold text-blue-700" : "",
                  ].join(" ")}
                  title={site}
                >
                  <span className="block truncate">{site}</span>
                  <span className="text-xs text-gray-500">({count})</span>
                </button>
              ))}

              {sitesWithCount.length === 0 && (
                <p className="text-xs text-gray-500 px-2">現場がありません</p>
              )}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
