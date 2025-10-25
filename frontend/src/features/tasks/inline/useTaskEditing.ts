import { useState } from "react";
import type { TaskNode } from "../../../types";
import { useUpdateTask } from "../useUpdateTask";
import { brandIso } from "../../../lib/brandIso";
import { toDateInputValue } from "../../../utils/date";

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
