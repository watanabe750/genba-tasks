// src/features/drawer/TaskChildForm.tsx
import { useState } from "react";
import { useCreateTask } from "../tasks/useCreateTask";
import { useToast } from "../../components/ToastProvider";
import { brandIso } from "../../lib/brandIso";
import { getUserMessage, logError } from "../../lib/errorHandler";

type Props = {
  taskId: number;
  onSuccess: () => void;
};

/**
 * タスクドロワー内の子タスク作成フォームコンポーネント
 */
export default function TaskChildForm({ taskId, onSuccess }: Props) {
  const { push: toast } = useToast();
  const [childTitle, setChildTitle] = useState("");
  const [childDue, setChildDue] = useState<string>(""); // YYYY-MM-DD
  const { mutateAsync: createTask, isPending: creating } = useCreateTask();

  const handleCreate = async () => {
    if (!childTitle.trim()) return;

    try {
      await createTask({
        title: childTitle.trim(),
        parentId: taskId,
        deadline: brandIso(childDue || undefined),
      });
      setChildTitle("");
      setChildDue("");
      onSuccess();
    } catch (err: unknown) {
      logError(err, 'TaskChildForm - Create');
      const msg = getUserMessage(err);
      toast(msg || "作成に失敗しました", "error");
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && childTitle.trim()) {
      await handleCreate();
    }
  };

  return (
    <div className="mt-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3">
      <div className="mb-2 text-[13px] text-gray-500 dark:text-gray-400">
        子タスクを作成
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="input input-bordered flex-1"
          placeholder="子タスク名（必須）"
          value={childTitle}
          onChange={(e) => setChildTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="子タスク名"
        />
        <input
          type="date"
          className="input input-bordered w-full sm:w-40"
          value={childDue}
          onChange={(e) => setChildDue(e.target.value)}
          aria-label="期限"
        />
        <button
          className="btn btn-primary w-full sm:w-auto"
          onClick={handleCreate}
          disabled={!childTitle.trim() || creating}
        >
          作成
        </button>
      </div>
    </div>
  );
}
