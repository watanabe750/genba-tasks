// PriorityTasksPanel.tsx
import { usePriorityTasks } from "./usePriorityTasks";
import useAuth from "../../providers/useAuth";
import { useUpdateTask } from "../tasks/useUpdateTask";
import type { Task } from "../../types/task";
import { useQueryClient } from "@tanstack/react-query"; // ← 追加

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
  const qc = useQueryClient();
  const queryKey = ["priorityTasks", authed]; // ← このキーは usePriorityTasks 側と合わせて

  // 完了チェック時に即非表示（楽観更新）
  const handleToggle = (t: Task) => {
    const next = t.status === "completed" ? "in_progress" : "completed";
    update(
      { id: t.id, data: { status: next } },
      {
        onMutate: async () => {
          await qc.cancelQueries({ queryKey });
          const prev = (qc.getQueryData<Task[]>(queryKey) ?? []).slice();

          // 先にローカル反映：ステータス更新→completed は消す
          const nextList = prev
            .map((it) => (it.id === t.id ? { ...it, status: next } : it))
            .filter((it) => it.status !== "completed");

          qc.setQueryData(queryKey, nextList);
          return { prev };
        },
        onError: (_err, _vars, ctx) => {
          if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev); // 失敗時ロールバック
        },
        onSettled: () => {
          qc.invalidateQueries({ queryKey }); // 最終的に正データで同期
        },
      }
    );
  };

  // 画面表示は未完了のみ（サーバ側が返していてもガード）
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
        {visible.map((t: Task) => (
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
                onChange={() => handleToggle(t)}   // ← ここだけに集約
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

      {!isLoading && visible.length === 0 && (
        <p className="text-sm text-blue-700/70 dark:text-blue-300/70">
          未完了の優先タスクはありません
        </p>
      )}
    </div>
  );
}