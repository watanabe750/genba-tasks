// src/pages/TaskList.tsx
import { useMemo, useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import PriorityTasksPanel from "../features/priority/PriorityTasksPanel";
import { useTasksFromUrl } from "../features/tasks/useTasks";
import useAuth from "../providers/useAuth";
import { usePriorityTasks } from "../features/priority/usePriorityTasks";
import { nestTasks, sortRootNodes } from "../features/tasks/nest";
import type { Task, TaskNode, Status } from "../types";
import { TaskFilterBar } from "../features/tasks/TaskFilterBar";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { parseTaskFilters } from "../features/tasks/parseTaskFilters";
import type { PageComponent } from "../types";
import WorkflowyTaskTree from "../features/tasks/workflowy/WorkflowyTaskTree";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

const TaskList: PageComponent = () => {
  const { authed } = useAuth();
  const DEMO = import.meta.env.VITE_DEMO_MODE === "true";
  const enabled = authed || DEMO;
  usePriorityTasks(enabled);

  const [sp, setSp] = useSearchParams();

  /**
   * ステータスフィルターを切り替えるヘルパー関数
   * 指定されたステータスが既に選択されている場合は解除、
   * 選択されていない場合は単独で選択する
   */
  const toggleStatusFilter = (targetStatus: Status) => {
    const currentStatus = sp.getAll("status") as Status[];
    const next = new URLSearchParams(sp);
    const statusSet = new Set(currentStatus);

    if (statusSet.has(targetStatus)) {
      statusSet.delete(targetStatus);
    } else {
      statusSet.clear();
      statusSet.add(targetStatus);
    }

    next.delete("status");
    for (const s of statusSet) {
      next.append("status", s);
    }
    setSp(next, { replace: true });
  };

  /**
   * 検索ボックスにフォーカスを当てるヘルパー関数
   */
  const focusSearchInput = () => {
    const searchInput = document.querySelector('[data-testid="search-input"]') as HTMLInputElement;
    searchInput?.focus();
  };

  // Keyboard shortcuts for TaskList page
  useKeyboardShortcuts([
    // Search focus (F or /)
    {
      key: "f",
      description: "検索ボックスにフォーカス",
      action: focusSearchInput,
    },
    {
      key: "/",
      description: "検索ボックスにフォーカス",
      action: focusSearchInput,
    },
    // Filter by status
    {
      key: "1",
      description: "未着手のみ表示",
      action: () => toggleStatusFilter("not_started"),
    },
    {
      key: "2",
      description: "進行中のみ表示",
      action: () => toggleStatusFilter("in_progress"),
    },
    {
      key: "3",
      description: "完了のみ表示",
      action: () => toggleStatusFilter("completed"),
    },
    {
      key: "0",
      description: "フィルターをすべて解除",
      action: () => setSp({}, { replace: true }),
    },
  ]);

  const [isGuest, setIsGuest] = useState(false);
  useEffect(() => {
    const read = () => {
      try { setIsGuest(sessionStorage.getItem("auth:demo") === "1"); } catch {}
    };
    read();
    window.addEventListener("auth:refresh", read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("auth:refresh", read);
      window.removeEventListener("focus", read);
    };
  }, []);

  // 優先パネルの表示状態（小画面用）
  const [showPriorityPanel, setShowPriorityPanel] = useState(() => {
    try {
      const saved = localStorage.getItem("priority-panel-visible");
      return saved ? JSON.parse(saved) : false; // 小画面デフォルト非表示
    } catch {
      return false;
    }
  });

  const togglePriorityPanel = () => {
    setShowPriorityPanel((prev: boolean) => {
      const next = !prev;
      try {
        localStorage.setItem("priority-panel-visible", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const rawFilters = parseTaskFilters(sp);
  const filters = useDebouncedValue(rawFilters, 300);

  const { data: tasksFlat = [] as Task[] } = useTasksFromUrl(enabled);

  // 表示用の order/dir
  const orderBy = filters.order_by ?? "position";
  const dir = filters.dir ?? "asc";

  const tasks: TaskNode[] = useMemo(() => {
    const incomplete: Task[] = [];
    const completed: Task[] = [];
    for (const t of tasksFlat) (t.status === "completed" ? completed : incomplete).push(t);
    const prioritized = [...incomplete, ...completed];

    const tree = nestTasks(prioritized);
    if (orderBy === "position") return tree; // DnD保存順をそのまま使う
    return sortRootNodes(tree, orderBy, dir);
  }, [tasksFlat, orderBy, dir]);

  const orderLabel =
    (orderBy === "position" && "手動") ||
    (orderBy === "deadline" && "期限") ||
    (orderBy === "progress" && "進捗") ||
    (orderBy === "created_at" && "作成日") ||
    "手動";

  const dirLabel = dir === "desc" ? "降順" : "昇順";

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white relative overflow-hidden">
        {/* Enhanced Background Layers */}
        <div
          aria-hidden
          className="fixed inset-0 opacity-40 dark:opacity-40 opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 20% 10%, rgba(56,189,248,0.15), transparent 40%), radial-gradient(circle at 80% 20%, rgba(16,185,129,0.12), transparent 35%), radial-gradient(circle at 40% 90%, rgba(99,102,241,0.1), transparent 40%), linear-gradient(180deg, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%)",
          }}
        />

        {/* Animated Grid */}
        <div
          aria-hidden
          className="fixed inset-0 bg-[linear-gradient(rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none opacity-50"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="task-list-root">
          {/* Guest Banner */}
          {isGuest && (
            <div
              className="mb-6 rounded-2xl border border-amber-300 dark:border-amber-400/30 bg-gradient-to-r from-amber-100 via-orange-50 to-amber-100 dark:from-amber-500/15 dark:via-orange-500/10 dark:to-amber-500/15 px-5 py-4 backdrop-blur-md shadow-lg shadow-amber-200/50 dark:shadow-amber-500/10 animate-[fadeIn_0.6s_ease-out]"
              role="note"
            >
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 dark:bg-amber-400"></span>
                </span>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-100">
                  これは<strong className="mx-1 text-amber-900 dark:text-amber-200">ゲスト環境</strong>です。データは定期的に初期化される場合があります。
                </p>
              </div>
            </div>
          )}

          {/* Header Section */}
          <div className="mb-8 animate-[fadeIn_0.8s_ease-out]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-sky-700 to-emerald-700 dark:from-white dark:via-sky-100 dark:to-emerald-100 bg-clip-text text-transparent tracking-tight">
                  タスク管理
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-slate-400 font-medium">
                  全 <span className="text-sky-600 dark:text-sky-400 font-bold">{tasksFlat.length}</span> 件 ・ {orderLabel} / {dirLabel}
                </p>
              </div>

              {/* 優先パネル表示切替ボタン（小画面のみ） */}
              <button
                onClick={togglePriorityPanel}
                className="lg:hidden group relative inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white transition-all duration-300 hover:border-gray-400 dark:hover:border-white/30 hover:scale-105 active:scale-100 backdrop-blur-sm"
                aria-label={showPriorityPanel ? "優先タスクを非表示" : "優先タスクを表示"}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400"></span>
                {showPriorityPanel ? "優先タスクを隠す" : "優先タスク"}
              </button>
            </div>

            <TaskFilterBar />

            {/* Active Filter Badge */}
            {filters.progress_min != null &&
              filters.progress_max != null &&
              filters.progress_min === filters.progress_max && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-300 dark:border-sky-400/30 bg-sky-100 dark:bg-sky-500/15 px-4 py-2 text-xs font-semibold text-sky-700 dark:text-sky-100 backdrop-blur-sm shadow-lg shadow-sky-200/50 dark:shadow-sky-500/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400"></span>
                  進捗: {filters.progress_min}%
                </div>
              )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
            {/* Task List Section - Workflowy Style */}
            <section className="relative z-10 animate-[fadeIn_1s_ease-out_0.2s_both]">
              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900/80 backdrop-blur-sm shadow-xl overflow-hidden">
                <WorkflowyTaskTree tree={tasks} />
              </div>
            </section>

            {/* Priority Panel Aside */}
            <aside
              className={[
                "priority-panel self-start z-0",
                "lg:block lg:sticky lg:top-24",
                showPriorityPanel ? "block" : "hidden",
              ].join(" ")}
            >
              <div className="rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden animate-[fadeIn_1.2s_ease-out_0.4s_both]">
                <PriorityTasksPanel />
              </div>
            </aside>
          </div>
        </div>
      </div>
  );
};

export default TaskList;
