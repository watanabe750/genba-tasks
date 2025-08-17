import { useDeleteTask } from "../features/tasks/useDeleteTask";
import type { Task } from "../types/task";

type TaskItemProps = { task: Task };

const TaskItem = ({ task }: TaskItemProps) => {
  // depth未設定でもズレないように
  const depth = task.depth ?? 1;
  const indent = Math.max(0, (depth - 1) * 20);

  const clamp = (n: number, min = 0, max = 100) =>
    Math.min(Math.max(n, min), max);

  // /api/tasks は children を返さない想定なので安全化
  const children = task.children ?? [];

  // 削除 (楽観的更新&失敗ロールバック)
  const { mutate: remove, isPending } = useDeleteTask();

  return (
    <div
      className="mb-4 border rounded-xl p-3 hover:bg-gray-50"
      style={{ paddingLeft: `${indent}px` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold truncate">{task.title}</h2>
          <p className="text-sm text-gray-600">
            期限: {task.deadline ?? "未設定"} ・ ステータス: {task.status}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            data-testid={`task-delete-${task.id}`}
            onClick={() => {
              if (confirm("このタスクを削除しますか？")) remove(task.id);
            }}
            disabled={isPending}
            className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 disabled:opacity-60"
            title="削除"
          >
            削除
          </button>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
        <div
          className="bg-gray-700 h-3 rounded-full"
          style={{ width: `${clamp(task.progress ?? 0)}%` }}
          aria-label="progress"
        />
      </div>
      <p className="text-sm text-gray-600">{clamp(task.progress ?? 0)}%</p>

      {/* 再帰的に children を表示（将来サブタスク対応用。現状は空配列） */}
      {children.length > 0 && (
        <div className="mt-2">
          {children.map((child) => (
            <TaskItem key={child.id} task={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskItem;
