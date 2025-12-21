// src/features/priority/PriorityTasksPanel.tsx
import { useState, useEffect, useRef } from "react";
import { usePriorityTasks } from "./usePriorityTasks";
import useAuth from "../../providers/useAuth";
import { useUpdateTask } from "../tasks/useUpdateTask";
import type { Task } from "../../types/task";
import { useQueryClient } from "@tanstack/react-query";
import { formatDeadlineForDisplay, getDeadlineUrgency, formatDaysUntilDeadline } from "../../utils/date";

const clamp = (n: number, min = 0, max = 100) =>
  Math.min(Math.max(n ?? 0, min), max);

const STORAGE_KEYS = {
  COLLAPSED: "priorityPanel.collapsed",
  LIMIT: "priorityPanel.limit",
  WIDTH: "priorityPanel.width",
};

const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 240;
const MAX_WIDTH = 600;

export default function PriorityTasksPanel() {
  const { authed } = useAuth();

  // LocalStorageから初期値を取得
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COLLAPSED);
    return saved === "true";
  });

  const [limit, setLimit] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LIMIT);
    return saved ? parseInt(saved, 10) : 5;
  });

  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WIDTH);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  const { data: tasks = [], isLoading, error } = usePriorityTasks(authed, limit);
  const { mutate: update } = useUpdateTask();
  const qc = useQueryClient();
  const queryKey = ["priorityTasks", limit];

  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // LocalStorageに保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLLAPSED, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LIMIT, String(limit));
  }, [limit]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WIDTH, String(width));
  }, [width]);

  // リサイズ処理
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      setWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // 完了チェック時に即非表示（楽観更新）
  const handleToggle = (t: Task) => {
    const next = t.status === "completed" ? "in_progress" : "completed";

    // 1) 先にキャッシュを書き換え（completed は非表示）
    const prev = (qc.getQueryData<Task[]>(queryKey) ?? []).slice();
    const nextList = prev
      .map((it) => (it.id === t.id ? { ...it, status: next } : it))
      .filter((it) => it.status !== "completed");
    qc.setQueryData(queryKey, nextList);

    // 2) サーバ更新。失敗なら復元、最後に正で同期
    update(
      { id: t.id, data: { status: next } },
      {
        onError: () => qc.setQueryData(queryKey, prev),
        onSettled: () => qc.invalidateQueries({ queryKey }),
      }
    );
  };

  // 表示は未完了のみ
  const visible = tasks.filter((t) => t.status !== "completed");

  return (
    <div
      ref={panelRef}
      data-testid="priority-panel"
      style={{ width: `${width}px` }}
      className="
        relative rounded-xl border border-blue-200 bg-blue-50/60 shadow-lg
        dark:border-slate-700 dark:bg-slate-800/50
      "
    >
      {/* リサイザー */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className="
          absolute left-0 top-0 bottom-0 w-1 cursor-col-resize
          hover:bg-blue-400 dark:hover:bg-slate-600 active:bg-blue-500 dark:active:bg-slate-500 transition-colors
        "
        title="ドラッグして幅を調整"
      />

      <div className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="
                text-blue-700 dark:text-slate-300 hover:text-blue-900 dark:hover:text-slate-100
                transition-transform
              "
              title={isCollapsed ? "展開" : "折りたたむ"}
              aria-label={isCollapsed ? "展開" : "折りたたむ"}
            >
              <svg
                className={`w-5 h-5 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <h2 className="font-semibold text-blue-700 dark:text-slate-200">
              期限が近いタスク
            </h2>
            <span
              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 dark:bg-slate-600 text-white text-[10px]"
              title="期限の近い順に表示します"
              aria-label="説明"
            >
              i
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="
                text-xs px-2 py-1 rounded border border-blue-300 bg-white
                dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-slate-500
              "
              title="表示件数"
            >
              <option value={3}>3件</option>
              <option value={5}>5件</option>
              <option value={10}>10件</option>
              <option value={15}>15件</option>
            </select>
            <span className="text-xs text-blue-700/70 dark:text-slate-300/70">
              {visible.length}件
            </span>
          </div>
        </div>

        {!isCollapsed && (
          <>
            {isLoading && (
              <p className="text-sm text-blue-700/70 dark:text-slate-300/70">
                読み込み中…
              </p>
            )}
            {error && <p className="text-sm text-red-600 dark:text-red-400">読み込みに失敗しました</p>}

            <ul className="space-y-2">
        {visible.map((t) => (
          <li
            key={t.id}
            data-testid="priority-item"
            className="
              rounded-lg border border-blue-100 bg-white/80 p-2 transition-colors
              hover:bg-white dark:border-slate-700 dark:bg-slate-700/50 dark:hover:bg-slate-700/70
            "
          >
            <div className="flex items-center gap-2">
              <input
                data-testid="priority-done"
                type="checkbox"
                checked={t.status === "completed"}
                onChange={() => handleToggle(t)}
                aria-label="完了"
                className="accent-blue-600 dark:accent-slate-400"
              />
              <div className="min-w-0 flex-1">
                <p
                  data-testid="priority-title"
                  className="truncate text-sm font-medium text-blue-900 dark:text-slate-100"
                >
                  {t.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-blue-800/70 dark:text-slate-300/70">
                    {formatDeadlineForDisplay(t.deadline)}
                  </p>
                  <span
                    className={[
                      "text-xs px-1.5 py-0.5 rounded font-semibold",
                      getDeadlineUrgency(t.deadline) === "overdue" && "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300",
                      getDeadlineUrgency(t.deadline) === "urgent" && "bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300",
                      getDeadlineUrgency(t.deadline) === "warning" && "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300",
                      getDeadlineUrgency(t.deadline) === "normal" && "bg-blue-100 dark:bg-slate-500/20 text-blue-800 dark:text-slate-300",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {formatDaysUntilDeadline(t.deadline)}
                  </span>
                  <span className="text-xs text-blue-800/70 dark:text-slate-300/70">
                    進捗 {Math.round(t.progress ?? 0)}%
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded bg-blue-200/70 dark:bg-slate-900/50">
                  <div
                    className="h-2 rounded bg-blue-600 dark:bg-slate-400"
                    style={{ width: `${clamp(t.progress ?? 0, 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

            {!isLoading && visible.length === 0 && (
              <p className="text-sm text-blue-700/70 dark:text-slate-300/70">
                未完了の優先タスクはありません
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
