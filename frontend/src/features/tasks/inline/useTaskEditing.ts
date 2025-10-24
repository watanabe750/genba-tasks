import { useState } from "react";
import type { TaskNode } from "../../../types";
import { useUpdateTask } from "../useUpdateTask";
import { brandIso } from "../../../lib/brandIso";

/**
 * タスク編集用のカスタムフック
 * 編集状態の管理、保存・キャンセル処理を提供
 */
export function useTaskEditing(task: TaskNode) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [deadline, setDeadline] = useState(toDateInputValue(task.deadline));
  const [status, setStatus] = useState<TaskNode["status"]>(task.status);

  const { mutate: update } = useUpdateTask();

  const isLeaf = (task.children ?? []).length === 0;

  const save = () => {
    const payload: Partial<Pick<TaskNode, "title" | "deadline" | "status" | "progress">> = {
      title: title.trim(),
      deadline: brandIso(deadline ? new Date(`${deadline}T00:00:00`).toISOString() : null),
      status,
      progress: status === "completed" ? 100 : isLeaf ? 0 : task.progress ?? 0,
    };
    update({ id: task.id, data: payload });
    setEditing(false);
  };

  const cancel = () => {
    setTitle(task.title);
    setDeadline(toDateInputValue(task.deadline));
    setStatus(task.status);
    setEditing(false);
  };

  return {
    editing,
    setEditing,
    title,
    setTitle,
    deadline,
    setDeadline,
    status,
    setStatus,
    save,
    cancel,
  };
}

// 日付を input[type="date"] 用の文字列に変換
function toDateInputValue(iso?: string | null): string {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
