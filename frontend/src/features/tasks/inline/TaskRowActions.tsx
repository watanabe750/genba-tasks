import { useState } from "react";
import type { TaskNode } from "../../../types";
import { MAX_CHILDREN_PER_NODE } from "../constraints";
import ConfirmPopover from "../../../components/ConfirmPopover";

interface Props {
  task: TaskNode;
  isParent: boolean;
  onEdit: () => void;
  onAddChild: () => void;
  onShowImage: () => void;
  onDelete: () => void;
}

/**
 * タスク行のアクションボタン群
 * 編集・削除・子タスク追加・画像表示ボタンを提供
 */
export function TaskRowActions({ task, isParent, onEdit, onAddChild, onShowImage, onDelete }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const children = task.children ?? [];
  const childrenCount = children.length;
  const canAddChild = childrenCount < MAX_CHILDREN_PER_NODE;
  const canDelete = childrenCount === 0;

  const handleDeleteClick = () => {
    if (!canDelete) return;
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    setConfirmOpen(false);
    onDelete();
  };

  return (
    <div className="shrink-0 flex flex-col items-end gap-1">
      {/* バッジ */}
      <div className="flex flex-wrap justify-end gap-1">
        {isParent && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
            上位タスク
          </span>
        )}
        {childrenCount > 0 && (
          <span
            data-testid={`leafstats-${task.id}`}
            className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
            title="子タスクの完了数 / 子タスク総数"
          >
            自動 {children.filter((c: TaskNode) => c.status === "completed").length}/{childrenCount} OK
          </span>
        )}
      </div>

      {/* アクションボタン */}
      <div className="flex items-center gap-1" data-testid={`row-actions-${task.id}`}>
        {/* 子タスク追加 */}
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
          disabled={!canAddChild}
          onClick={onAddChild}
          title={
            canAddChild
              ? "サブタスクを追加"
              : `最大${MAX_CHILDREN_PER_NODE}件まで`
          }
          aria-label="サブタスクを追加"
        >
          ＋
        </button>

        {/* 編集 */}
        <button
          type="button"
          className="h-8 rounded border px-2 text-xs hover:bg-gray-50"
          onClick={onEdit}
          title="編集"
        >
          編集
        </button>

        {/* 画像（親のみ） */}
        {isParent && (
          <button
            data-testid={`btn-image-${task.id}`}
            type="button"
            className="h-8 rounded border px-2 text-xs hover:bg-gray-50"
            onClick={onShowImage}
            title="画像の表示・アップロード・削除"
          >
            画像
          </button>
        )}

        {/* 削除 */}
        <div className="relative inline-block">
          <button
            type="button"
            className={[
              "h-8 rounded border px-2 text-xs",
              !canDelete
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "hover:bg-red-50 border-red-200 text-red-600",
            ].join(" ")}
            onClick={handleDeleteClick}
            title={
              canDelete
                ? "削除"
                : "サブタスクがあるため削除できません\n（まずサブタスクを削除）"
            }
            aria-haspopup="dialog"
            aria-expanded={confirmOpen}
            disabled={!canDelete}
          >
            削除
          </button>
          {confirmOpen && (
            <ConfirmPopover
              text={"このタスクを削除しますか？"}
              onCancel={() => setConfirmOpen(false)}
              onConfirm={handleDeleteConfirm}
            />
          )}
        </div>
      </div>

      {/* 子タスク上限警告 */}
      {!canAddChild && (
        <div className="text-[12px] text-red-600 mt-1">
          最大{MAX_CHILDREN_PER_NODE}件まで
        </div>
      )}
    </div>
  );
}
