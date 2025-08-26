import { usePriorityTasks } from "./usePriorityTasks";
import { useAuth } from "../../providers/useAuth";
import { useUpdateTask } from "../tasks/useUpdateTask";
import type { Task } from "../../types/task";

const clamp = (n: number, min = 0, max = 100) =>
  Math.min(Math.max(n ?? 0, min), max);

function fmtDeadline(iso?: string | null) {
  if (!iso) return "期限なし";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
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
      className="rounded-xl border p-3 shadow-sm bg-white/60 dark:bg-zinc-900/40"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">優先タスク</h2>
        <span className="text-xs text-gray-500">{tasks.length}件</span>
      </div>

      {isLoading && <p className="text-sm text-gray-500">読み込み中…</p>}
      {error && <p className="text-sm text-red-600">読み込みに失敗しました</p>}

      <ul className="space-y-2">
        {tasks.map((t: Task) => (
          <li
            key={t.id}
            data-testid="priority-item"
            className="rounded-lg border p-2"
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
              />
              <div className="min-w-0 flex-1">
                <p
                  data-testid="priority-title"
                  className="truncate text-sm font-medium"
                >
                  {t.title}
                </p>
                <p className="text-xs text-gray-500">
                  {fmtDeadline(t.deadline)}・進捗 {Math.round(t.progress ?? 0)}%
                </p>
                <div className="mt-1 h-2 w-full rounded bg-gray-200">
                  <div
                    className="h-2 rounded bg-gray-700"
                    style={{ width: `${clamp(t.progress ?? 0, 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {!isLoading && tasks.length === 0 && (
        <p className="text-sm text-gray-500">未完了の優先タスクはありません</p>
      )}
    </div>
  );
}
