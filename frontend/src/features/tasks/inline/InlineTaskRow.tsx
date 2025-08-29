// src/features/tasks/inline/InlineTaskRow.tsx
import { useMemo, useState, type DragEvent } from "react";
import type { Task } from "../../../types/task";
import { useUpdateTask } from "../../tasks/useUpdateTask";
import { useDeleteTask } from "../../tasks/useDeleteTask";
import { useCreateTask } from "../../tasks/useCreateTask";
import { MAX_CHILDREN_PER_NODE } from "../../tasks/constraints";
import { useInlineDnd } from "./dndContext";
import InlineDropZone from "./InlineDropZone";

const toDateInputValue = (iso?: string | null) => {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const STATUS_LABEL: Record<Task["status"], string> = {
  not_started: "未着手",
  in_progress: "進行中",
  completed: "完了",
};

type RowProps = { task: Task; depth: number };
const INDENT_STEP = 24;

export default function InlineTaskRow({ task, depth }: RowProps) {
  const children = task.children ?? [];
  const isLeaf = children.length === 0;
  const isParent = depth === 1;
  const dnd = useInlineDnd();

  const { mutate: update } = useUpdateTask();
  const { mutate: remove } = useDeleteTask();
  const { mutate: createTask, isPending: creating } = useCreateTask();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [deadline, setDeadline] = useState(toDateInputValue(task.deadline));
  const [status, setStatus] = useState<Task["status"]>(task.status);
  const [expanded, setExpanded] = useState(true);

  const [addingChild, setAddingChild] = useState(false);
  const [childTitle, setChildTitle] = useState("");

  const leafStats = useMemo(() => {
    if (isLeaf) return null;
    const countLeaves = (n: Task): { done: number; total: number } => {
      const kids = n.children ?? [];
      if (kids.length === 0)
        return { done: n.status === "completed" ? 1 : 0, total: 1 };
      return kids.reduce(
        (acc, c) => {
          const s = countLeaves(c);
          return { done: acc.done + s.done, total: acc.total + s.total };
        },
        { done: 0, total: 0 }
      );
    };
    return countLeaves(task);
  }, [task, isLeaf]);

  const save = () => {
    const payload: Partial<
      Pick<Task, "title" | "deadline" | "status" | "progress">
    > = {
      title: title.trim(),
      deadline: deadline
        ? new Date(`${deadline}T00:00:00`).toISOString()
        : null,
      status,
      progress: status === "completed" ? 100 : Math.min(task.progress ?? 0, 99),
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

  const toggleDone = () => {
    if (!isLeaf) return;
    const nextDone = task.status !== "completed";
    update({
      id: task.id,
      data: nextDone
        ? { status: "completed", progress: 100 }
        : { status: "in_progress", progress: Math.min(task.progress ?? 0, 99) },
    });
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

  const submitChild = () => {
    const t = childTitle.trim();
    if (!t) return;
    createTask(
      { title: t, parentId: task.id, deadline: null },
      {
        onSuccess: () => {
          setChildTitle("");
          setAddingChild(false);
          setExpanded(true);
        },
      }
    );
  };

  // --- DnD: 行コンテナは「ドロップ受け入れのみ」。ドラッグ開始はハンドルのボタンだけ ---
  const onDragOver = (e: DragEvent) => {
    const sameDepth =
      dnd.state.draggingId != null && dnd.state.draggingDepth === depth;
    if (!sameDepth) return;
    const toPid = task.parent_id ?? null;
    const ok =
      dnd.state.draggingParentId === toPid || dnd.canAcceptIntoParent(toPid);
    if (ok) {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const movingId = dnd.state.draggingId;
    if (movingId == null || movingId === task.id) return dnd.onDragEnd();

    const fromPid = dnd.state.draggingParentId;
    const toPid = task.parent_id ?? null;

    if (fromPid === toPid) {
      dnd.reorderWithinParent(toPid, movingId, task.id);
    } else {
      if (!dnd.canAcceptIntoParent(toPid)) return dnd.onDragEnd();
      dnd.moveAcrossParents({ fromPid, toPid, movingId, afterId: task.id });
      update({ id: movingId, data: { parent_id: toPid } });
    }
    dnd.onDragEnd();
  };
  const onDragEnd = () => dnd.onDragEnd();

  const canDropHere =
    dnd.state.draggingId != null &&
    dnd.state.draggingDepth === depth &&
    dnd.state.draggingId !== task.id &&
    (dnd.state.draggingParentId === (task.parent_id ?? null) ||
      dnd.canAcceptIntoParent(task.parent_id ?? null));

  // 子リスト（並びはDND管理の順序）
  const orderedChildren = dnd.getOrderedChildren(task.id, children);
  const lastChildId = orderedChildren.length
    ? orderedChildren[orderedChildren.length - 1].id
    : null;

  return (
    <div
      role="treeitem"
      aria-level={depth}
      aria-expanded={children.length ? expanded : undefined}
      data-testid={`task-item-${task.id}`}
      data-editing={editing ? "1" : "0"}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={[
        "group relative z-0 isolate",
        "py-1.5 pr-0",
        isParent ? "mt-5 mb-1" : "mb-0.5",
        "hover:bg-gray-50/60 transition-colors",
        canDropHere ? "ring-1 ring-blue-300" : "",
      ].join(" ")}
      style={{ paddingLeft: `${(depth - 1) * INDENT_STEP}px` }}
    >
      {depth > 1 && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1 bottom-1 left-1 border-l-2 border-gray-200"
        />
      )}

      <div className="flex items-start gap-2">
        {children.length > 0 ? (
          <button
            type="button"
            aria-label={expanded ? "子タスクを隠す" : "子タスクを表示"}
            aria-expanded={expanded}
            className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-gray-200"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="mt-0.5 inline-block h-5 w-5 shrink-0" />
        )}

        {/* ドラッグハンドル（ドラッグ可能なのはこのボタンだけ） */}
        <button
          type="button"
          aria-label="並び替え"
          data-testid={`task-drag-${task.id}`}
          draggable={true}
          onDragStart={(e) => {
            if (editing) {
              e.preventDefault();
              return;
            }
            e.stopPropagation();
            e.dataTransfer?.setData("application/x-task-id", String(task.id));
            e.dataTransfer?.setData("text/plain", String(task.id));
            if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
            dnd.onDragStart(task, depth);
          }}
          onDragEnd={onDragEnd}
          onMouseDown={(e) => e.stopPropagation()}
          className={[
            "relative z-50 pointer-events-auto select-none touch-none",
            "mt-0.5 inline-flex h-5 w-5 shrink-0 cursor-grab items-center justify-center rounded",
            "hover:bg-gray-200 active:cursor-grabbing",
          ].join(" ")}
          title="ドラッグで並び替え"
        >
          ⋮⋮
        </button>

        {/* 葉の完了チェック */}
        {isLeaf && !editing && (
          <input
            type="checkbox"
            aria-label="完了"
            data-testid={`task-done-${task.id}`}
            className="mt-0.5"
            checked={task.status === "completed"}
            onChange={toggleDone}
          />
        )}

        <div className="min-w-0 flex-1">
          {!editing ? (
            <>
              <div
                className="flex min-w-0 items-center gap-2"
                onClick={() => setEditing(true)}
              >
                <span
                  data-testid={`task-title-${task.id}`}
                  className={[
                    "truncate cursor-text text-[15px] font-medium hover:underline decoration-dotted",
                    task.status === "completed" ? "text-gray-400 line-through" : "",
                  ].join(" ")}
                >
                  {task.title}
                </span>
                {isParent && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                    上位タスク
                  </span>
                )}
                {!isLeaf && (
                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                    自動{leafStats ? ` ${leafStats.done}/${leafStats.total} OK` : ""}
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-gray-600">
                <span>
                  期限: {task.deadline ? toDateInputValue(task.deadline) : "—"}
                </span>
                <span
                  data-testid={`task-status-${task.id}`}
                  data-status={task.status}
                >
                  ステータス: {STATUS_LABEL[task.status]}
                </span>
                {task.site ? <span>site: {task.site}</span> : null}
              </div>
            </>
          ) : (
            <form
              className="grid max-sm:items-start grid-cols-1 gap-2 sm:grid-cols-[1fr,160px,140px]"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
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
                    cancel();
                  }
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.metaKey &&
                    !e.ctrlKey
                  ) {
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
                onChange={(e) => setStatus(e.target.value as Task["status"])}
              >
                <option value="not_started">未着手</option>
                <option value="in_progress">進行中</option>
                <option value="completed">完了</option>
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
                  onClick={cancel}
                  className="rounded border px-3 py-1.5 text-xs"
                  disabled={creating}
                >
                  取消
                </button>
              </div>
            </form>
          )}
        </div>

        {!editing && (
          <div className="shrink-0 space-x-1">
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs"
              onClick={() => setEditing(true)}
            >
              編集
            </button>

            <button
              type="button"
              data-testid={`task-add-child-${task.id}`}
              className="rounded bg-gray-900 text-white px-2 py-1 text-xs disabled:opacity-60"
              disabled={(task.children?.length ?? 0) >= MAX_CHILDREN_PER_NODE}
              onClick={(e) => {
                e.stopPropagation();
                setAddingChild(true);
              }}
              title={
                (task.children?.length ?? 0) >= MAX_CHILDREN_PER_NODE
                  ? `最大${MAX_CHILDREN_PER_NODE}件まで`
                  : undefined
              }
            >
              ＋ サブタスク
            </button>

            <button
              type="button"
              className="rounded border px-2 py-1 text-xs"
              onClick={() => {
                if (children.length > 0) {
                  alert("サブタスクがあるため削除できません（まず子を削除）");
                  return;
                }
                if (confirm("このタスクを削除しますか？")) remove(task.id);
              }}
            >
              削除
            </button>
          </div>
        )}
      </div>

      {isParent && (
        <div
          className="mt-1 h-2 w-full rounded bg-blue-200/40"
          data-testid={`task-progress-${task.id}`}
        >
          <div
            className="h-2 rounded bg-blue-500"
            data-testid={`task-progress-bar-${task.id}`}
            style={{
              width: `${Math.min(Math.max(task.progress ?? 0, 0), 100)}%`,
            }}
          />
        </div>
      )}

      {!editing && addingChild && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submitChild();
          }}
        >
          <input
            data-testid="child-title-input"
            aria-label="サブタスク名"
            className="flex-1 rounded border p-2"
            value={childTitle}
            onChange={(e) => setChildTitle(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            data-testid="child-create-submit"
            className="rounded bg-gray-900 px-2 py-1 text-xs text-white disabled:opacity-60"
            disabled={creating || !childTitle.trim()}
          >
            作成
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={() => setAddingChild(false)}
            disabled={creating}
          >
            取消
          </button>
        </form>
      )}

      {/* 子リスト＋末尾ドロップゾーン */}
      {expanded && (
        <div className="mt-1">
          {orderedChildren.map((c) => (
            <InlineTaskRow key={c.id} task={c} depth={c.depth ?? depth + 1} />
          ))}
          <div className="pointer-events-none">
            <div className="pointer-events-auto">
              <InlineDropZone
                parentId={task.id}
                acceptDepth={depth + 1}
                lastChildId={lastChildId}
                currentCount={orderedChildren.length}
                showEmptyState={orderedChildren.length === 0}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
