// src/features/tasks/inline/InlineTaskRow.tsx
import {
  useMemo,
  useState,
  useLayoutEffect,
  type DragEvent,
  useRef,
} from "react";
import type { TaskNode as Task } from "../../../types";
import { useUpdateTask } from "../../tasks/useUpdateTask";
import { useDeleteTask } from "../../tasks/useDeleteTask";
import { useCreateTask } from "../../tasks/useCreateTask";
import { MAX_CHILDREN_PER_NODE } from "../../tasks/constraints";
import { useInlineDnd } from "./dndContext";
import { useTaskDrawer } from "../../drawer/useTaskDrawer";
import TaskImagePanel from "../image/TaskImagePanel";
import CompactThumb from "./CompactThumb";
import ConfirmPopover from "../../../components/ConfirmPopover";
import { brandIso } from "../../../lib/brandIso";

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

type RowProps = { task: Task; depth: number; prevId?: number | null };
const INDENT_STEP = 24;

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

export default function InlineTaskRow({ task, depth, prevId = null }: RowProps) {
  const children = task.children ?? [];
  const isLeaf = children.length === 0;
  const isParent = depth === 1;
  const isChild = depth > 1;

  const dnd = useInlineDnd();
  const dragFromHandle = useRef(false);

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
  const [childDue, setChildDue] = useState<string>("");
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 親タイトル → ドロワー、子はインライン編集（★ここは1回だけ）
  const { open: openDrawer } = useTaskDrawer();
  const titleRef = useRef<HTMLSpanElement | null>(null);

  // 子完了数
  const leafStats = useMemo(() => {
    const kids = task.children ?? [];
    if (kids.length === 0) return null;
    const total = kids.length;
    const done = kids.filter(c => c.status === "completed").length;
    return { done, total };
  }, [task.children]);

  const save = () => {
    const payload: Partial<Pick<Task, "title" | "deadline" | "status" | "progress">> = {
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

  const toggleDone = () => {
    if (!isLeaf) return;
    const nextDone = task.status !== "completed";
    update({
      id: task.id,
      data: nextDone
        ? { status: "completed", progress: 100 }
        : { status: "in_progress", progress: 0 },
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
  };

  // ---- DnD（親のみ）----
  const onDragOver = (e: DragEvent) => {
    if (!isParent) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  };
  const onDragEnter = (e: DragEvent) => {
    if (!isParent) return;
    e.preventDefault();
  };
  const onDrop = (e: DragEvent) => {
    if (!isParent) return;
    e.preventDefault();

    const movingId = dnd.state.draggingId;
    if (movingId == null || movingId === task.id) return dnd.onDragEnd();

    const fromPid = dnd.state.draggingParentId;
    const toPid   = task.parent_id ?? null;

    if (samePid(fromPid, toPid)) {
      const pid       = normPid(toPid);
      const movingIdx = dnd.getIndexInParent(pid, movingId);
      const targetIdx = dnd.getIndexInParent(pid, task.id);

      let afterId: number | null;
      if (movingIdx != null && targetIdx != null && movingIdx < targetIdx) {
        // 下へ移動中：ターゲット“の後ろ”
        afterId = task.id;
      } else {
        // 上へ移動中 or 不明：直前(prevId)の“後ろ”（= targetの前）
        afterId = prevId ?? null;
      }
      dnd.reorderWithinParent(pid, movingId, afterId);
    }

    dnd.onDragEnd();
  };

  const onRowDragStart = (e: DragEvent<HTMLDivElement>) => {
    if (!isParent || !dragFromHandle.current) {
      e.preventDefault();
      return;
    }
    const dt = e.dataTransfer!;
    dt.effectAllowed = "move";
    dt.setData("application/x-task-id", String(task.id));
    dt.setData("text/plain", String(task.id));
    dt.setDragImage(e.currentTarget as HTMLElement, 16, 8);
    document.body.classList.add("is-dragging");
    dnd.onDragStart(task, depth);
  };
  const onRowDragEnd = () => {
    if (!isParent) return;
    document.body.classList.remove("is-dragging");
    dnd.onDragEnd();
    dragFromHandle.current = false;
  };

  // 子の表示順は固定
  const childIds = useMemo(() => (task.children ?? []).map(c => c.id), [task.children]);
  const childIdsKey = useMemo(() => childIds.join(","), [childIds]);
  useLayoutEffect(() => { /* children: 並びは固定 */ }, [childIdsKey]);

  const orderedChildren = useMemo(() => sortChildrenFixed(children), [children]);

  const canDropHere =
    isParent &&
    dnd.state.draggingId != null &&
    dnd.state.draggingId !== task.id &&
    samePid(dnd.state.draggingParentId, task.parent_id ?? null);

  // 親タイトル → ドロワー、子はインライン編集
  const handleTitleClick = () => {
    if (isParent) openDrawer(task.id, titleRef.current || undefined);
    else setEditing(true);
  };
  const handleTitleKeyDown = (e: any) => {
    if (!isParent) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDrawer(task.id, titleRef.current || undefined);
    }
  };

  // ===== 1行表示 =====
  const Row = (
    <div
      draggable={isParent}
      onDragStart={onRowDragStart}
      onDragEnd={onRowDragEnd}
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
      style={{ paddingLeft: `${(depth - 1) * INDENT_STEP}px` }}
    >
      {depth > 1 && (
        <span aria-hidden className="pointer-events-none absolute top-1 bottom-1 left-1 border-l-2 border-gray-200" />
      )}

      <div className="flex items-start gap-4">
        {/* 開閉 */}
        {children.length > 0 ? (
          <button
            type="button"
            aria-label={expanded ? "子タスクを隠す" : "子タスクを表示"}
            aria-expanded={expanded}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-gray-200 mt-0.5"
            onClick={() => setExpanded(v => !v)}
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
            tabIndex={0}
            aria-label="並び替え"
            data-testid={`task-drag-${task.id}`}
            draggable={false}
            onMouseDown={() => (dragFromHandle.current = true)}
            onMouseUp={() => (dragFromHandle.current = false)}
            onMouseLeave={() => (dragFromHandle.current = false)}
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

        {/* 親のみ：軽量サムネ */}
        {isParent && <CompactThumb taskId={task.id} />}

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
          {!editing ? (
            <>
              <div className="flex min-w-0 items-center gap-2" onClick={handleTitleClick} onKeyDown={handleTitleKeyDown}>
                <span
                  ref={titleRef}
                  data-testid={`task-title-${task.id}`}
                  role={isParent ? "button" : undefined}
                  tabIndex={isParent ? 0 : undefined}
                  aria-haspopup={isParent ? "dialog" : undefined}
                  title={isParent ? "詳細を開く" : undefined}
                  className={[
                    "truncate hover:underline decoration-dotted",
                    isParent ? "text-[18px] md:text-[20px] font-semibold leading-tight" : "text-[15px] font-medium",
                    isParent ? "cursor-pointer" : "cursor-text",
                    task.status === "completed" ? "text-gray-400 line-through" : "",
                  ].join(" ")}
                >
                  {task.title}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-600">
                <span>期限: {task.deadline ? toDateInputValue(task.deadline) : "—"}</span>
                <span data-testid={`task-status-${task.id}`} data-status={task.status}>ステータス: {STATUS_LABEL[task.status]}</span>
                {task.site ? <span>現場名: {task.site}</span> : null}
              </div>
            </>
          ) : (
            <form
              className="grid max-sm:items-start grid-cols-1 gap-2 sm:grid-cols-[1fr,160px,140px]"
              onSubmit={(e) => { e.preventDefault(); save(); }}
            >
              <input
                aria-label="タイトル"
                className="w-full rounded border p-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="タイトル"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") { e.preventDefault(); cancel(); }
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
                onChange={(e) => setStatus(e.target.value as Task["status"])}
              >
                <option value="not_started">未着手</option>
                <option value="in_progress">進行中</option>
                <option value="completed">完了</option>
              </select>

              <div className="flex gap-2 sm:col-span-3">
                <button type="submit" className="rounded bg-gray-900 px-3 py-1.5 text-xs text-white" disabled={creating}>保存</button>
                <button type="button" onClick={cancel} className="rounded border px-3 py-1.5 text-xs" disabled={creating}>取消</button>
              </div>
            </form>
          )}
        </div>

        {/* 右カラム */}
        {!editing && (
          <div className="shrink-0 flex flex-col items-end gap-1">
            <div className="flex flex-wrap justify-end gap-1">
              {isParent && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">上位タスク</span>}
              {!isLeaf && (
                <span
                  data-testid={`leafstats-${task.id}`}
                  className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                  title="子タスクの完了数 / 子タスク総数"
                >
                  自動 {leafStats?.done ?? 0}/{leafStats?.total ?? 0} OK
                </span>
              )}
            </div>

            <div className="flex items-center gap-1" data-testid={`row-actions-${task.id}`}>
              <button
                type="button"
                data-testid={`task-add-child-${task.id}`}
                className={[
                  "inline-flex items-center justify-center text-xs text-white",
                  "bg-blue-600 hover:bg-blue-700",
                  "rounded px-2.5 h-8",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
                disabled={(task.children?.length ?? 0) >= MAX_CHILDREN_PER_NODE}
                onClick={() => setAddingChild(true)}
                title={(task.children?.length ?? 0) >= MAX_CHILDREN_PER_NODE ? `最大${MAX_CHILDREN_PER_NODE}件まで` : "サブタスクを追加"}
                aria-label="サブタスクを追加"
              >
                ＋
              </button>

              <button type="button" className="h-8 rounded border px-2 text-xs hover:bg-gray-50" onClick={() => setEditing(true)} title="編集">編集</button>

              {isParent && (
                <button
                  data-testid={`btn-image-${task.id}`}
                  type="button"
                  className="h-8 rounded border px-2 text-xs hover:bg-gray-50"
                  onClick={() => setShowImagePanel(v => !v)}
                  title="画像の表示・アップロード・削除"
                >
                  画像
                </button>
              )}

              <div className="relative inline-block">
                <button
                  type="button"
                  className={[
                    "h-8 rounded border px-2 text-xs",
                    children.length > 0 ? "border-gray-200 text-gray-400 cursor-not-allowed" : "hover:bg-red-50 border-red-200 text-red-600",
                  ].join(" ")}
                  onClick={() => { if (children.length > 0) return; setConfirmOpen(true); }}
                  title={children.length > 0 ? "サブタスクがあるため削除できません\n（まずサブタスクを削除）" : "削除"}
                  aria-haspopup="dialog"
                  aria-expanded={confirmOpen}
                  disabled={children.length > 0}
                >
                  削除
                </button>
                {confirmOpen && (
                  <ConfirmPopover
                    text={"このタスクを削除しますか？"}
                    onCancel={() => setConfirmOpen(false)}
                    onConfirm={() => { setConfirmOpen(false); remove(task.id); }}
                  />
                )}
              </div>
            </div>

            {(task.children?.length ?? 0) >= MAX_CHILDREN_PER_NODE && (
              <div className="text-[12px] text-red-600 mt-1">最大{MAX_CHILDREN_PER_NODE}件まで</div>
            )}
          </div>
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
        <form className="mt-2 flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); submitChild(); }}>
          <input data-testid="child-title-input" aria-label="サブタスク名" className="flex-1 rounded border p-2" value={childTitle} onChange={(e) => setChildTitle(e.target.value)} autoFocus />
          <input type="date" aria-label="期限" className="w-[160px] rounded border p-2" value={childDue} onChange={(e) => setChildDue(e.target.value)} />
          <button type="submit" data-testid="child-create-submit" className="rounded bg-gray-900 px-2 py-1 text-xs text-white disabled:opacity-60" disabled={creating || !childTitle.trim()}>作成</button>
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => setAddingChild(false)} disabled={creating}>取消</button>
        </form>
      )}
    </div>
  );

  // ===== 子リスト =====
  const Children = expanded ? (
    <div className="mt-1" data-testid={`children-of-${task.id}`}>
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
    <div data-testid={`task-item-${task.id}`} data-editing={editing ? "1" : "0"} role="treeitem" aria-level={depth} aria-expanded={children.length ? expanded : undefined}>
      {Row}
      {isParent && showImagePanel && <TaskImagePanel taskId={task.id} />}
      {Children}
    </div>
  );
}
