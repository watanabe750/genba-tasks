import { useMemo, useRef, useState } from "react";
import type { TaskNode } from "../../types";
import { useUpdateTask } from "../../features/tasks/useUpdateTask";
import { useDeleteTask } from "../../features/tasks/useDeleteTask";
import { useCreateTask } from "../../features/tasks/useCreateTask";
import { MAX_CHILDREN_PER_NODE } from "../../features/tasks/constraints";

type Props = {
  node: TaskNode;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onIndent?: () => void;   // Tab
  onOutdent?: () => void;  // Shift+Tab
  dragHandleProps?: any;
};

const clamp = (n: number, min = 0, max = 100) =>
  Math.min(Math.max(n, min), max);

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

export default function OutlineRow({
  node, collapsed = false, onToggleCollapsed, onIndent, onOutdent, dragHandleProps,
}: Props) {
  const depth = node.depth ?? 1;
  const children = node.children ?? [];
  const isLeaf = children.length === 0;

  const { mutate: update } = useUpdateTask();
  const { mutate: remove } = useDeleteTask();
  const { mutateAsync: createChild } = useCreateTask() as any;

  const [hover, setHover] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(node.title);
  const [deadline, setDeadline] = useState<string>(toDateInputValue(node.deadline));
  const inputRef = useRef<HTMLInputElement>(null);

  const leafStats = useMemo(() => {
    if (isLeaf) return null;
    const walk = (n: TaskNode): { done: number; total: number } => {
      const kids = n.children ?? [];
      if (kids.length === 0)
        return { done: n.status === "completed" ? 1 : 0, total: 1 };
      return kids.reduce(
        (acc, k) => {
          const s = walk(k);
          return { done: acc.done + s.done, total: acc.total + s.total };
        },
        { done: 0, total: 0 }
      );
    };
    return walk(node);
  }, [node, isLeaf]);

  const save = () => {
    update({
      id: node.id,
      data: {
        title: title.trim(),
        deadline: deadline ? fromDateInputValue(deadline) : null,
      },
    });
    setEditing(false);
  };
  const cancel = () => {
    setTitle(node.title);
    setDeadline(toDateInputValue(node.deadline));
    setEditing(false);
  };

  const toggleDone = () => {
    const done = node.status !== "completed";
    update({
      id: node.id,
      data: done
        ? { status: "completed", progress: 100 }
        : { status: "in_progress", progress: Math.min(node.progress ?? 0, 99) },
    });
  };

  // ★ Enter: 兄弟作成 → そのまま編集へ
  const handleEnter = async () => {
    const parentId = node.parent_id ?? null;
    // createChild を使い、親はそのまま
    const title = ""; // 空で作成 → 直後に編集
    const created = await createChild({ title: "（新規）", parentId, deadline: null });
    // ここでは UI 側のフォーカス切替だけ（編集開始は簡易に）
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
    setTitle("");
  };

  // ★ Tab / Shift+Tab
  const handleTab = (e: React.KeyboardEvent) => {
    if (e.shiftKey) {
      onOutdent?.();
    } else {
      onIndent?.();
    }
  };

  return (
    <div
      role="treeitem"
      aria-level={depth}
      aria-expanded={!collapsed}
      data-testid={`task-item-${node.id}`}
      className={[
          "relative group flex items-center gap-2 px-2 py-1",
          "hover:bg-gray-50",
        ].join(" ")}
      style={{ paddingLeft: Math.max(8, depth * 16) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* 折りたたみトグル */}
      <button
        type="button"
        className="shrink-0 h-5 w-5 grid place-items-center rounded hover:bg-gray-200/60"
        aria-label={collapsed ? "展開" : "折りたたみ"}
        onClick={onToggleCollapsed}
      >
        <span className="text-gray-600">{collapsed ? "▶" : "▼"}</span>
      </button>

      {/* DnD ハンドル */}
      <button
        type="button"
        className="shrink-0 h-5 w-5 grid place-items-center rounded hover:bg-gray-200/60"
        aria-label="ドラッグ"
        {...dragHandleProps}
      >
        <span className="text-gray-500">⋮⋮</span>
      </button>

      {/* 葉はチェック可 / 中間は自動表示 */}
      {isLeaf ? (
        <input
          type="checkbox"
          className="mt-0.5"
          checked={node.status === "completed"}
          onChange={toggleDone}
          aria-label="完了"
        />
      ) : (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
          自動{leafStats ? ` ${leafStats.done}/${leafStats.total} OK` : ""}
        </span>
      )}

      {/* タイトル or インライン入力（Enter/Tab対応） */}
      {!editing ? (
        <div
          className="min-w-0 flex-1 cursor-text"
          tabIndex={0}
          onClick={() => {
            setEditing(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleEnter(); }
            if (e.key === "Tab") { e.preventDefault(); handleTab(e); }
          }}
        >
          <div className="truncate font-medium">{node.title}</div>
          <div className="mt-1 h-1 w-full rounded-full bg-gray-200">
            <div
              className="h-1 rounded-full bg-gray-700"
              style={{ width: `${clamp(node.progress ?? 0)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            className="w-full rounded border px-2 py-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); save(); }
              if (e.key === "Escape") { e.preventDefault(); cancel(); }
              if (e.key === "Tab") { e.preventDefault(); handleTab(e); }
            }}
          />
        </div>
      )}

      {/* 右端：期日ピル & 編集時は date 入力 */}
      <div className="flex items-center gap-2">
        <div className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          {deadline ? deadline.replaceAll("-", "/") : "—"}
        </div>
        {editing && (
          <input
            type="date"
            className="rounded border px-2 py-1 text-sm"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        )}
      </div>

      {/* ホバーアクション */}
      <div
        className={[
          "ml-2 shrink-0 flex items-center gap-1",
          hover || editing ? "opacity-100" : "opacity-0 pointer-events-none",
          "group-hover:opacity-100 transition-opacity",
        ].join(" ")}
      >
        {!editing ? (
          <>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded bg-gray-900 text-white"
              onClick={() => setEditing(true)}
            >
              編集
            </button>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded bg-red-50 text-red-700"
              onClick={() => {
                if ((node.children?.length ?? 0) > 0) {
                  alert("サブタスクがあるため削除できません（先に子を削除）");
                  return;
                }
                if (confirm("このタスクを削除しますか？")) remove(node.id);
              }}
              data-testid={`task-delete-${node.id}`}
            >
              削除
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded bg-gray-900 text-white"
              onClick={save}
              disabled={title.trim() === ""}
            >
              保存
            </button>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded border"
              onClick={cancel}
            >
              取消
            </button>
          </>
        )}
      </div>
    </div>
  );
}
