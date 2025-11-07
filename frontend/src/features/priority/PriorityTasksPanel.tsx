// src/features/priority/PriorityTasksPanel.tsx
import { usePriorityTasks } from "./usePriorityTasks";
import useAuth from "../../providers/useAuth";
import { useUpdateTask } from "../tasks/useUpdateTask";
import type { Task } from "../../types/task";
import { useQueryClient } from "@tanstack/react-query";
import { formatDeadlineForDisplay, getDeadlineUrgency, formatDaysUntilDeadline } from "../../utils/date";

const clamp = (n: number, min = 0, max = 100) =>
  Math.min(Math.max(n ?? 0, min), max);

export default function PriorityTasksPanel() {
  const { authed } = useAuth();
  const { data: tasks = [], isLoading, error } = usePriorityTasks(authed);
  const { mutate: update } = useUpdateTask();
  const qc = useQueryClient();
  const queryKey = ["priorityTasks", authed];

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
      data-testid="priority-panel"
      className="
        rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-lg
        dark:border-blue-900 dark:bg-blue-950/30
      "
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h2 className="font-semibold text-blue-700 dark:text-blue-300">
            期限が近いタスク
          </h2>
          <span
            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[10px]"
            title="期限の近い順に表示します"
            aria-label="説明"
          >
            i
          </span>
        </div>
        <span className="text-xs text-blue-700/70 dark:text-blue-300/70">
          {visible.length}件
        </span>
      </div>

      {isLoading && (
        <p className="text-sm text-blue-700/70 dark:text-blue-300/70">
          読み込み中…
        </p>
      )}
      {error && <p className="text-sm text-red-600">読み込みに失敗しました</p>}

      <ul className="space-y-2">
        {visible.map((t) => (
          <li
            key={t.id}
            data-testid="priority-item"
            className="
              rounded-lg border border-blue-100 bg-white/80 p-2 transition-colors
              hover:bg-white dark:border-blue-900/40 dark:bg-blue-900/30 hover:dark:bg-blue-900/40
            "
          >
            <div className="flex items-center gap-2">
              <input
                data-testid="priority-done"
                type="checkbox"
                checked={t.status === "completed"}
                onChange={() => handleToggle(t)}
                aria-label="完了"
                className="accent-blue-600"
              />
              <div className="min-w-0 flex-1">
                <p
                  data-testid="priority-title"
                  className="truncate text-sm font-medium text-blue-900 dark:text-blue-100"
                >
                  {t.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-blue-800/70 dark:text-blue-200/70">
                    {formatDeadlineForDisplay(t.deadline)}
                  </p>
                  <span
                    className={[
                      "text-xs px-1.5 py-0.5 rounded font-semibold",
                      getDeadlineUrgency(t.deadline) === "overdue" && "bg-red-500 text-white",
                      getDeadlineUrgency(t.deadline) === "urgent" && "bg-orange-500 text-white",
                      getDeadlineUrgency(t.deadline) === "warning" && "bg-yellow-500 text-white",
                      getDeadlineUrgency(t.deadline) === "normal" && "bg-blue-500 text-white",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {formatDaysUntilDeadline(t.deadline)}
                  </span>
                  <span className="text-xs text-blue-800/70 dark:text-blue-200/70">
                    進捗 {Math.round(t.progress ?? 0)}%
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded bg-blue-200/70 dark:bg-blue-900/50">
                  <div
                    className="h-2 rounded bg-blue-600 dark:bg-blue-400"
                    style={{ width: `${clamp(t.progress ?? 0, 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {!isLoading && visible.length === 0 && (
        <p className="text-sm text-blue-700/70 dark:text-blue-300/70">
          未完了の優先タスクはありません
        </p>
      )}
    </div>
  );
}
