// src/features/tasks/inline/InlineTaskRow.tsx (REFACTORED VERSION)
import {
  useMemo,
  useState,
  useLayoutEffect,
  useCallback,
  type DragEvent,
  useRef,
} from "react";
import type { TaskNode as Task } from "../../../types";
import { useUpdateTask } from "../../tasks/useUpdateTask";
import { useDeleteTask } from "../../tasks/useDeleteTask";
import { useCreateTask } from "../../tasks/useCreateTask";
import { useInlineDnd } from "./dndContext";
import TaskImagePanel from "../image/TaskImagePanel";
import { brandIso } from "../../../lib/brandIso";
import { demoImageStore } from "../../../lib/demoImageStore";
import { toDateInputValue } from "../../../utils/date";

// 新しく作成したコンポーネント
import { TaskRowEdit } from "./TaskRowEdit";
import { TaskRowDisplay } from "./TaskRowDisplay";
import { TaskRowActions } from "./TaskRowActions";

const DBG = import.meta.env.DEV;
const log = (...args: unknown[]) => DBG && console.log("[DND:Row]", ...args);

type RowProps = { task: Task; depth: number; prevId?: number | null };

// レスポンシブインデント: 小画面12px、中画面以上24px
const getIndentPx = (depth: number): string => {
  const step = depth <= 1 ? 0 : depth - 1;
  // Tailwind CSSのブレークポイントに合わせてCSSカスタムプロパティで制御
  return `calc(${step} * var(--indent-step, 24px))`;
};

const normPid = (v: number | null | undefined) => (v == null ? null : Number(v));
const samePid = (a: number | null | undefined, b: number | null | undefined) =>
  normPid(a) === normPid(b);

/** 子タスクは固定: 期限昇順 -> 期限なし -> id昇順 */
const sortChildrenFixed = (kids: Task[]) => {
  const key = (t: Task) => {
    const d = toDateInputValue(t.deadline) || "9999-12-31";
    return `${d}:${String(t.id).padStart(10, "0")}`;
  };
  return kids.slice().sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
};

/**
 * タスク1行を表示するメインコンポーネント（リファクタリング版）
 * 編集・表示・アクションを別コンポーネントに分離し、シンプルに保つ
 */
export default function InlineTaskRow({ task, depth, prevId = null }: RowProps) {
  const children = task.children ?? [];
  const isLeaf = children.length === 0;
  const isParent = depth === 1;
  const isChild = depth > 1;

  const dnd = useInlineDnd();

  const { mutate: update } = useUpdateTask();
  const { mutate: remove } = useDeleteTask();
  const { mutate: createTask, isPending: creating } = useCreateTask();

  // 状態管理（最小限に削減）
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [addingChild, setAddingChild] = useState(false);
  const [childTitle, setChildTitle] = useState("");
  const [childDue, setChildDue] = useState<string>("");
  const [showImagePanel, setShowImagePanel] = useState(false);

  const titleRef = useRef<HTMLSpanElement | null>(null);

  const thumbSrc = isParent ? demoImageStore.get(task.id) : undefined;

  // 編集モード終了のコールバックを安定化
  const handleEditCancel = useCallback(() => {
    setEditing(false);
  }, []);

  // === 子タスク追加ロジック ===
  const submitChild = useCallback(() => {
    const t = childTitle.trim();
    if (!t) return;
    createTask(
      { title: t, parentId: task.id, deadline: brandIso(childDue || undefined) },
      {
        onSuccess: () => {
          setChildTitle("");
          setChildDue("");
          setAddingChild(false);
          setExpanded(true);
        },
      }
    );
  }, [childTitle, childDue, task.id, createTask]);

  // === 完了トグル（葉のみ） ===
  const toggleDone = useCallback(() => {
    if (!isLeaf) return;
    const nextDone = task.status !== "completed";
    update({
      id: task.id,
      data: nextDone
        ? { status: "completed", progress: 100 }
        : { status: "in_progress", progress: 0 },
    });
  }, [isLeaf, task.status, task.id, update]);

  // === インライン編集（全タスク対応） ===
  const handleTitleClick = useCallback(() => {
    setEditing(true);
  }, []);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setEditing(true);
    }
  }, []);

  // === ドラッグ&ドロップ処理 ===
  const performDropHere = useCallback(() => {
    const movingId = dnd.state.draggingId;
    log("performDropHere =>", {
      movingId,
      over: task.id,
      fromPid: dnd.state.draggingParentId,
      toPid: task.parent_id ?? null,
      prevId,
    });

    if (movingId == null || movingId === task.id) return dnd.onDragEnd();

    const fromPid = dnd.state.draggingParentId;
    const toPid = task.parent_id ?? null;

    if (!samePid(fromPid, toPid)) {
      dnd.onDragEnd();
      return;
    }

    const pid = normPid(toPid);
    const movingIdx = dnd.getIndexInParent(pid, movingId);
    const targetIdx = dnd.getIndexInParent(pid, task.id);

    let afterId: number | null;
    if (movingIdx != null && targetIdx != null && movingIdx < targetIdx) {
      afterId = task.id;
    } else {
      afterId = prevId ?? null;
    }
    log("call reorderWithinParent", { pid, movingId, afterId });
    dnd.reorderWithinParent(pid, movingId, afterId);
    dnd.onDragEnd();
  }, [dnd, task.id, task.parent_id, prevId]);

  const onDragOver = useCallback((e: DragEvent) => {
    if (!isParent) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  }, [isParent]);

  const onDragEnter = useCallback((e: DragEvent) => {
    if (!isParent) return;
    e.preventDefault();
  }, [isParent]);

  const onDrop = useCallback((e: DragEvent) => {
    if (!isParent) return;
    e.preventDefault();
    log("drop row", { over: task.id });
    performDropHere();
  }, [isParent, task.id, performDropHere]);

  // 子の表示順は固定
  const childIds = useMemo(() => (task.children ?? []).map((c) => c.id), [task.children]);
  const childIdsKey = useMemo(() => childIds.join(","), [childIds]);
  useLayoutEffect(() => { /* children: 並びは固定 */ }, [childIdsKey]);

  const orderedChildren = useMemo(() => sortChildrenFixed(children), [children]);

  const canDropHere =
    isParent &&
    dnd.state.draggingId != null &&
    dnd.state.draggingId !== task.id &&
    samePid(dnd.state.draggingParentId, task.parent_id ?? null);

  // === レンダリング ===
  const Row = (
    <div
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
      className={[
        "group relative z-0 isolate",
        "py-1.5 pr-0",
        isParent ? "mt-5 mb-1" : "mb-0.5",
        "hover:bg-gray-50/60 transition-colors",
        canDropHere ? "ring-1 ring-blue-300" : "",
      ].join(" ")}
      style={{ paddingLeft: getIndentPx(depth) }}
    >
      {depth > 1 && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1 bottom-1 left-1 border-l-2 border-gray-200"
        />
      )}

      <div className="flex items-start gap-4">
        {/* 開閉ボタン */}
        {children.length > 0 ? (
          <button
            type="button"
            aria-label={expanded ? "子タスクを隠す" : "子タスクを表示"}
            aria-expanded={expanded}
            aria-controls={`task-children-${task.id}`}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-gray-200 mt-0.5"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="inline-block h-5 w-5 shrink-0 mt-0.5" />
        )}

        {/* ドラッグハンドル（親のみ） */}
        {!isChild && (
          <div
            role="button"
            tabIndex={isParent ? 0 : -1}
            aria-label={isParent ? "タスクをドラッグして並び替え" : "子タスクは並び替えできません"}
            aria-disabled={!isParent}
            aria-describedby={`drag-help-${task.id}`}
            data-testid={`task-drag-${task.id}`}
            draggable={isParent}
            onKeyDown={(e) => {
              if (!isParent) return;
              // キーボードでのドラッグ操作はサポートしないが、説明は提供
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // TODO: 将来的にキーボードによる並び替えをサポート
              }
            }}
            onDragStart={(e) => {
              const dt = e.dataTransfer!;
              dt.effectAllowed = "move";
              dt.setData("application/x-task-id", String(task.id));
              dt.setData("text/plain", String(task.id));
              dt.setDragImage((e.currentTarget as HTMLElement), 8, 8);
              document.body.classList.add("is-dragging");
              dnd.onDragStart(task, depth);
            }}
            onDragEnd={() => {
              document.body.classList.remove("is-dragging");
              dnd.onDragEnd();
            }}
            onDragOver={(e) => {
              if (!isParent) return;
              e.preventDefault();
              if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              if (!isParent) return;
              e.preventDefault();
              log("drop handle", { over: task.id });
              performDropHere();
            }}
            className={[
              "relative z-[999] pointer-events-auto select-none",
              "inline-flex h-5 w-5 shrink-0 cursor-grab items-center justify-center rounded",
              "hover:bg-gray-200 active:cursor-grabbing mt-0.5",
            ].join(" ")}
            title="ドラッグで並び替え"
          >
            ⋮⋮
          </div>
        )}

        {/* 親のみ：軽量サムネ（レスポンシブ：小画面48px、中画面以上64px） */}
        {isParent && (
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
            {thumbSrc ? (
              <img
                src={thumbSrc}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-gray-400 text-xs sm:text-base">未</span>
            )}
          </div>
        )}

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

        {/* 左カラム：タイトル＆メタ */}
        <div className="min-w-0 flex-1">
          {editing ? (
            <TaskRowEdit task={task} onCancel={handleEditCancel} />
          ) : (
            <TaskRowDisplay
              task={task}
              isParent={isParent}
              titleRef={titleRef}
              onTitleClick={handleTitleClick}
              onTitleKeyDown={handleTitleKeyDown}
            />
          )}
        </div>

        {/* 右カラム：アクション */}
        {!editing && (
          <TaskRowActions
            task={task}
            isParent={isParent}
            onEdit={() => setEditing(true)}
            onAddChild={() => setAddingChild(true)}
            onShowImage={() => setShowImagePanel((v) => !v)}
            onDelete={() => remove(task.id)}
          />
        )}
      </div>

      {/* 親だけ進捗バー */}
      {isParent && (
        <div className="mt-2 h-2 w-full rounded bg-blue-200/40" data-testid={`task-progress-${task.id}`}>
          <div
            className="h-2 rounded bg-blue-500"
            data-testid={`task-progress-bar-${task.id}`}
            style={{ width: `${Math.min(Math.max(task.progress ?? 0, 0), 100)}%` }}
          />
        </div>
      )}

      {/* 子追加フォーム */}
      {!editing && addingChild && (
        <form
          className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
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
          <input
            type="date"
            aria-label="期限"
            className="w-full sm:w-[160px] rounded border p-2"
            value={childDue}
            onChange={(e) => setChildDue(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              data-testid="child-create-submit"
              className="flex-1 sm:flex-none rounded bg-gray-900 px-2 py-1 text-xs text-white disabled:opacity-60"
              disabled={creating || !childTitle.trim()}
            >
              作成
            </button>
            <button
              type="button"
              className="flex-1 sm:flex-none rounded border px-2 py-1 text-xs"
              onClick={() => setAddingChild(false)}
              disabled={creating}
            >
              取消
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const Children = expanded ? (
    <div
      id={`task-children-${task.id}`}
      className="mt-1"
      data-testid={`children-of-${task.id}`}
      role="group"
      aria-label={`${task.title}の子タスク`}
    >
      {orderedChildren.map((c, i) => (
        <InlineTaskRow
          key={c.id}
          task={c}
          depth={c.depth ?? depth + 1}
          prevId={i === 0 ? null : orderedChildren[i - 1].id}
        />
      ))}
    </div>
  ) : null;

  return (
    <div
      data-testid={`task-item-${task.id}`}
      data-editing={editing ? "1" : "0"}
      role="treeitem"
      aria-level={depth}
      aria-expanded={children.length ? expanded : undefined}
    >
      {Row}
      {isParent && showImagePanel && <TaskImagePanel taskId={task.id} />}
      {Children}
    </div>
  );
}
