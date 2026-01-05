// src/features/drawer/TaskChildForm.tsx
import { useState } from "react";
import { useCreateTask } from "../tasks/useCreateTask";
import { useToast } from "../../components/ToastProvider";
import { brandIso } from "../../lib/brandIso";
import { getUserMessage, logError } from "../../lib/errorHandler";
import { validateTaskTitle, validateDate } from "../../lib/validation";

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
  const [titleError, setTitleError] = useState("");
  const [deadlineError, setDeadlineError] = useState("");
  const { mutateAsync: createTask, isPending: creating } = useCreateTask();

  const handleCreate = async () => {
    // バリデーション
    const titleResult = validateTaskTitle(childTitle);
    if (!titleResult.isValid) {
      setTitleError(titleResult.error || "");
      return;
    }
    setTitleError("");

    const deadlineResult = validateDate(childDue, {
      allowPast: true,
      allowFuture: true,
      fieldName: "期限",
    });
    if (!deadlineResult.isValid) {
      setDeadlineError(deadlineResult.error || "");
      return;
    }
    setDeadlineError("");

    try {
      await createTask({
        title: childTitle.trim(),
        parentId: taskId,
        deadline: brandIso(childDue || undefined),
      });
      setChildTitle("");
      setChildDue("");
      setTitleError("");
      setDeadlineError("");
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
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">タイトル</span>
              <span className={`text-xs ${childTitle.length > 200 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {childTitle.length}/200
              </span>
            </div>
            <input
              className={`input input-bordered w-full ${titleError ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}
              placeholder="子タスク名（必須）"
              value={childTitle}
              onChange={(e) => {
                setChildTitle(e.target.value);
                if (titleError) setTitleError("");
              }}
              onKeyDown={handleKeyDown}
              aria-label="子タスク名"
              aria-invalid={!!titleError}
              aria-describedby={titleError ? "child-title-error" : undefined}
              maxLength={200}
            />
          </div>
          <div className="w-full sm:w-40">
            <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">期限</div>
            <input
              type="date"
              className={`input input-bordered w-full ${deadlineError ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}
              value={childDue}
              onChange={(e) => {
                setChildDue(e.target.value);
                if (deadlineError) setDeadlineError("");
              }}
              aria-label="期限"
              aria-invalid={!!deadlineError}
              aria-describedby={deadlineError ? "child-deadline-error" : undefined}
            />
          </div>
          <div className="w-full sm:w-auto sm:self-end">
            <button
              className="btn btn-primary w-full"
              onClick={handleCreate}
              disabled={!childTitle.trim() || creating}
            >
              作成
            </button>
          </div>
        </div>
        {(titleError || deadlineError) && (
          <div className="flex flex-col gap-1">
            {titleError && (
              <p id="child-title-error" className="text-xs text-red-600 dark:text-red-400">
                {titleError}
              </p>
            )}
            {deadlineError && (
              <p id="child-deadline-error" className="text-xs text-red-600 dark:text-red-400">
                {deadlineError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
