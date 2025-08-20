// src/components/TaskItem.tsx
import { useState } from "react";
import { useDeleteTask } from "../features/tasks/useDeleteTask";
import { useUpdateTask } from "../features/tasks/useUpdateTask";
import { useCreateTask } from "../features/tasks/useCreateTask";
import type { Task } from "../types/task";

type TaskItemProps = { task: Task };
const clamp = (n: number, min = 0, max = 100) =>
  Math.min(Math.max(n, min), max);

// ISO⇄<input type="date"> 変換
const toDateInputValue = (iso?: string | null) => {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};
const fromDateInputValue = (v: string): string | null =>
  v ? new Date(`${v}T00:00:00`).toISOString() : null;

export default function TaskItem({ task }: TaskItemProps) {
  const depth = task.depth ?? 1;
  const indent = Math.max(0, (depth - 1) * 20);
  const children = task.children ?? [];

  const { mutate: remove, isPending: removing } = useDeleteTask();
  const { mutate: update, isPending: updating } = useUpdateTask();
  const { mutate: createChild, isPending: creating } = useCreateTask();

  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [addingChild, setAddingChild] = useState(false);
  const [childTitle, setChildTitle] = useState("");
  const [title, setTitle] = useState(task.title);
  const [status, setStatus] = useState<Task["status"]>(task.status);
  const [progress, setProgress] = useState<number>(task.progress ?? 0);
  const [deadline, setDeadline] = useState<string>(
    toDateInputValue(task.deadline)
  );

  const saveEdit = () => {
    update(
      {
        id: task.id,
        data: {
          title: title.trim(),
          deadline: deadline ? fromDateInputValue(deadline) : null,
          status,
          progress: clamp(progress),
        },
      },
      { onSuccess: () => setEditing(false) }
    );
  };
  const cancelEdit = () => {
    setEditing(false);
    setTitle(task.title);
    setStatus(task.status);
    setProgress(task.progress ?? 0);
    setDeadline(toDateInputValue(task.deadline));
  };

  const toggleComplete = () => {
    const done = task.status !== "completed";
    update({
      id: task.id,
      data: done
        ? { status: "completed", progress: 100 }
        : { status: "in_progress", progress: Math.min(task.progress ?? 0, 99) },
    });
  };

  return (
    <div
      data-testid={`task-item-${task.id}`}
      className="mb-4 border rounded-xl p-3 hover:bg-gray-50"
      style={{ paddingLeft: `${indent}px` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {!editing ? (
            <>
              <h2 className="text-lg font-semibold truncate">{task.title}</h2>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                期限: {task.deadline ?? "未設定"} ・ ステータス: {task.status}
                <label className="inline-flex items-center gap-1 text-xs ml-2">
                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={toggleComplete}
                  />
                  完了
                </label>
              </p>
              {children.length > 0 && (
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                >
                  {expanded
                    ? "－ 子を隠す"
                    : `＋ 子を表示（${children.length}）`}
                </button>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label
                  className="block text-xs text-gray-600 mb-1"
                  htmlFor={`title-${task.id}`}
                >
                  タイトル
                </label>
                <input
                  id={`title-${task.id}`}
                  className="w-full border rounded p-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={updating}
                  required
                  minLength={1}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    className="block text-xs text-gray-600 mb-1"
                    htmlFor={`deadline-${task.id}`}
                  >
                    期限
                  </label>
                  <input
                    id={`deadline-${task.id}`}
                    type="date"
                    className="w-full border rounded p-2"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    disabled={updating}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs text-gray-600 mb-1"
                    htmlFor={`status-${task.id}`}
                  >
                    ステータス
                  </label>
                  <select
                    id={`status-${task.id}`}
                    className="w-full border rounded p-2"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as Task["status"])
                    }
                    disabled={updating}
                  >
                    <option value="todo">未着手</option>
                    <option value="in_progress">進行中</option>
                    <option value="completed">完了</option>
                  </select>
                </div>
                <div>
                  <label
                    className="block text-xs text-gray-600 mb-1"
                    htmlFor={`progress-${task.id}`}
                  >
                    進捗 {clamp(progress)}%
                  </label>
                  <input
                    id={`progress-${task.id}`}
                    type="range"
                    min={0}
                    max={100}
                    value={clamp(progress)}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full"
                    disabled={updating}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {!editing ? (
            <>
              {depth < 2 && (
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded bg-gray-900 text-white disabled:opacity-60"
                  onClick={() => {
                    setAddingChild(true);
                    setExpanded(true);
                  }}
                  disabled={creating}
                >
                  ＋ サブタスク
                </button>
              )}

              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => {
                  setEditing(true);
                  setTitle(task.title);
                  setStatus(task.status);
                  setProgress(task.progress ?? 0);
                  setDeadline(toDateInputValue(task.deadline));
                }}
              >
                編集
              </button>
              <button
                type="button"
                data-testid={`task-delete-${task.id}`}
                onClick={() => {
                  if (children.length > 0) {
                    alert("サブタスクがあるため削除できません（まず子を削除）");
                    return;
                  }
                  if (confirm("このタスクを削除しますか？")) remove(task.id);
                }}
                disabled={removing}
                className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 disabled:opacity-60"
              >
                削除
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-gray-900 text-white disabled:opacity-60"
                onClick={saveEdit}
                disabled={updating || title.trim() === ""}
              >
                保存
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded border"
                onClick={cancelEdit}
                disabled={updating}
              >
                取消
              </button>
            </>
          )}
        </div>
      </div>

      {!editing && (
        <>
          <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
            <div
              className="bg-gray-700 h-3 rounded-full"
              style={{ width: `${clamp(task.progress ?? 0)}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{clamp(task.progress ?? 0)}%</p>
        </>
      )}

      {/* 子作成フォーム（親の直下のみ） */}
      {!editing && addingChild && depth < 2 && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const title = childTitle.trim();
            if (!title) return;
            createChild(
              { title, parentId: task.id, deadline: null },
              { onSuccess: () => { setChildTitle(""); setAddingChild(false); } }
            );
          }}
        >
          <input
            aria-label="サブタスク名"
            className="flex-1 border rounded p-2"
            value={childTitle}
            onChange={(e) => setChildTitle(e.target.value)}
            disabled={creating}
            autoFocus
          />
          <button type="submit" className="text-xs px-2 py-1 rounded bg-gray-900 text-white disabled:opacity-60" disabled={creating || !childTitle.trim()}>
            作成
          </button>
          <button type="button" className="text-xs px-2 py-1 rounded border" onClick={() => setAddingChild(false)} disabled={creating}>
            取消
          </button>
        </form>
      )}

      {/* 子の表示 */}
      {children.length > 0 && expanded && (
        <div className="mt-2">
          {children.map((child) => (<TaskItem key={child.id} task={child} />))}
        </div>
      )}
    </div>
  );
}
