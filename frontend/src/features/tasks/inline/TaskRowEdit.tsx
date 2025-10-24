import type { TaskNode } from "../../../types";
import { useTaskEditing } from "./useTaskEditing";
import { useCreateTask } from "../useCreateTask";

interface Props {
  task: TaskNode;
  onCancel: () => void;
}

const STATUS_OPTIONS = [
  { value: "not_started", label: "未着手" },
  { value: "in_progress", label: "進行中" },
  { value: "completed", label: "完了" },
] as const;

/**
 * タスク編集フォーム
 * タイトル・期限・ステータスを編集し、保存・キャンセルできる
 */
export function TaskRowEdit({ task, onCancel }: Props) {
  const {
    title,
    setTitle,
    deadline,
    setDeadline,
    status,
    setStatus,
    save,
    cancel,
  } = useTaskEditing(task);

  const { mutate: createTask, isPending: creating } = useCreateTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save();
  };

  const handleCancel = () => {
    cancel();
    onCancel();
  };

  const createSiblingBelow = () => {
    const isRoot = task.parent_id == null;
    createTask({
      title: "（新規）",
      parentId: task.parent_id ?? null,
      deadline: null,
      site: isRoot ? task.site ?? "" : undefined,
    });
  };

  return (
    <form
      className="grid max-sm:items-start grid-cols-1 gap-2 sm:grid-cols-[1fr,160px,140px]"
      onSubmit={handleSubmit}
    >
      <input
        aria-label="タイトル"
        className="w-full rounded border p-2"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タイトル"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            handleCancel();
          }
          if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            createSiblingBelow();
          }
        }}
      />
      <input
        type="date"
        aria-label="期限"
        className="w-full rounded border p-2"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        placeholder="期限"
      />
      <select
        aria-label="ステータス"
        className="w-full rounded border p-2 text-sm"
        value={status}
        onChange={(e) => setStatus(e.target.value as TaskNode["status"])}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="flex gap-2 sm:col-span-3">
        <button
          type="submit"
          className="rounded bg-gray-900 px-3 py-1.5 text-xs text-white"
          disabled={creating}
        >
          保存
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded border px-3 py-1.5 text-xs"
          disabled={creating}
        >
          取消
        </button>
      </div>
    </form>
  );
}
