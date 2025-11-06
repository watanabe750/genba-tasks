import { useState, useCallback } from "react";
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
  const [description, setDescription] = useState(task.description ?? "");

  const { mutate: update } = useUpdateTask();

  const isLeaf = (task.children ?? []).length === 0;

  const save = useCallback(() => {
    const payload: Partial<Pick<TaskNode, "title" | "deadline" | "status" | "progress" | "description">> = {
      title: title.trim(),
      deadline: brandIso(deadline ? new Date(`${deadline}T00:00:00`).toISOString() : null),
      status,
      progress: status === "completed" ? 100 : isLeaf ? 0 : task.progress ?? 0,
      description: description.trim() || undefined,
    };
    update({ id: task.id, data: payload });
    setEditing(false);
  }, [title, deadline, status, description, isLeaf, task.progress, task.id, update]);

  const cancel = useCallback(() => {
    setTitle(task.title);
    setDeadline(toDateInputValue(task.deadline));
    setStatus(task.status);
    setDescription(task.description ?? "");
    setEditing(false);
  }, [task.title, task.deadline, task.status, task.description]);

  return {
    editing,
    setEditing,
    title,
    setTitle,
    deadline,
    setDeadline,
    status,
    setStatus,
    description,
    setDescription,
    save,
    cancel,
  };
}
