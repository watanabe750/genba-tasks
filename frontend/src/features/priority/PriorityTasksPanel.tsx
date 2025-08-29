// src/features/priority/PriorityTasksPanel.tsx
import { usePriorityTasks } from "./usePriorityTasks";
import useAuth from "../../providers/useAuth";
import { useUpdateTask } from "../tasks/useUpdateTask";
import type { Task } from "../../types/task";

const clamp = (n: number, min = 0, max = 100) =>
  Math.min(Math.max(n ?? 0, min), max);

function fmtDeadline(iso?: string | null) {
  if (!iso) return "期限なし";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso ?? "";
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = "日月火水木金土"[d.getDay()];
  return `${m}/${day}(${dow})`;
}

export default function PriorityTasksPanel() {
  const { authed } = useAuth();
  const { data: tasks = [], isLoading, error } = usePriorityTasks(authed);
  const { mutate: update } = useUpdateTask();

  return (
    <div
      data-testid="priority-panel"
      className="
        rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-sm
        dark:border-blue-900 dark:bg-blue-950/30
      "
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold text-blue-700 dark:text-blue-300">
          優先タスク
        </h2>
        <span className="text-xs text-blue-700/70 dark:text-blue-300/70">
          {tasks.length}件
        </span>
      </div>

      {isLoading && <p className="text-sm text-blue-700/70 dark:text-blue-300/70">読み込み中…</p>}
      {error && <p className="text-sm text-red-600">読み込みに失敗しました</p>}

      <ul className="space-y-2">
        {tasks.map((t: Task) => (
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
                onChange={() =>
                  update({
                    id: t.id,
                    data: {
                      status:
                        t.status === "completed" ? "in_progress" : "completed",
                    },
                  })
                }
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
                <p className="text-xs text-blue-800/70 dark:text-blue-200/70">
                  {fmtDeadline(t.deadline)}・進捗 {Math.round(t.progress ?? 0)}%
                </p>
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

      {!isLoading && tasks.length === 0 && (
        <p className="text-sm text-blue-700/70 dark:text-blue-300/70">
          未完了の優先タスクはありません
        </p>
      )}
    </div>
  );
}
