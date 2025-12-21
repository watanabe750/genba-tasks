// src/features/tasks/workflowy/WorkflowyTaskRow.tsx
import { useState, useCallback, useRef, useEffect, type DragEvent } from "react";
import { useSearchParams } from "react-router-dom";
import type { TaskNode } from "../../../types";
import { useUpdateTask } from "../useUpdateTask";
import { useDeleteTask } from "../useDeleteTask";
import { useCreateTask } from "../useCreateTask";
import { useTaskDrawer } from "../../drawer/useTaskDrawer";
import { highlightText } from "../../../utils/highlightText";

type Props = {
  task: TaskNode;
  depth: number;
  prevId?: number | null;
  onDragStart?: (task: TaskNode) => void;
  onDragEnd?: () => void;
  onDrop?: (targetId: number, prevId: number | null) => void;
};

const fromISOtoDateInput = (iso: string | null): string => {
  if (!iso) return "";
  return iso.split("T")[0];
};

const STATUS_LABEL: Record<string, string> = {
  not_started: "未着手",
  in_progress: "進行中",
  completed: "完了",
};

export default function WorkflowyTaskRow({
  task,
  depth,
  prevId = null,
  onDragStart,
  onDragEnd,
  onDrop,
}: Props) {
  const [sp] = useSearchParams();
  const searchQuery = sp.get("search") || "";

  const children = task.children ?? [];
  const isLeaf = children.length === 0;
  const isParent = depth === 1;

  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editSite, setEditSite] = useState(task.site || "");
  const [dragging, setDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [creatingChild, setCreatingChild] = useState(false);
  const [childTitle, setChildTitle] = useState("");

  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();
  const { mutate: createTask } = useCreateTask();
  const { open: openDrawer } = useTaskDrawer();

  const inputRef = useRef<HTMLInputElement>(null);
  const siteInputRef = useRef<HTMLInputElement>(null);
  const childInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (creatingChild) {
      childInputRef.current?.focus();
    }
  }, [creatingChild]);

  // クリックで編集開始
  const handleClick = () => {
    if (!editing) {
      setEditing(true);
    }
  };

  // 詳細ドロワーを開く
  const handleOpenDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDrawer(task.id);
  };

  // 保存処理
  const handleSave = useCallback(() => {
    const trimmed = editTitle.trim();
    const trimmedSite = editSite.trim();

    // 空欄なら削除
    if (!trimmed) {
      deleteTask(task.id);
      return;
    }

    // 変更があれば更新
    const hasChanges =
      trimmed !== task.title ||
      trimmedSite !== (task.site || "");

    if (hasChanges) {
      updateTask({
        id: task.id,
        data: {
          title: trimmed,
          site: trimmedSite || null,
        },
      });
    }

    setEditing(false);
  }, [editTitle, editSite, task.id, task.title, task.site, updateTask, deleteTask]);

  // キャンセル
  const handleCancel = useCallback(() => {
    setEditTitle(task.title);
    setEditSite(task.site || "");
    setEditing(false);
  }, [task.title, task.site]);

  // キーボード操作
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      // 親タスクの場合、Enterで子タスク作成フォーム表示
      if (isParent && !e.metaKey && !e.ctrlKey) {
        handleSave();
        setCreatingChild(true);
        setChildTitle("");
        setExpanded(true);
        return;
      }

      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  // 子タスク作成保存
  const handleSaveChild = useCallback(() => {
    const trimmed = childTitle.trim();
    if (trimmed) {
      createTask({
        title: trimmed,
        parentId: task.id,
      });
    }
    setCreatingChild(false);
    setChildTitle("");
  }, [childTitle, task.id, createTask]);

  // 子タスク作成キャンセル
  const handleCancelChild = useCallback(() => {
    setCreatingChild(false);
    setChildTitle("");
  }, []);

  // 子タスク入力のキーボード操作
  const handleChildKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveChild();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelChild();
    }
  };

  // 完了チェック toggle
  const toggleCompleted = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLeaf) return;

    const nextStatus = task.status === "completed" ? "not_started" : "completed";
    updateTask({
      id: task.id,
      data: {
        status: nextStatus,
        progress: nextStatus === "completed" ? 100 : 0,
      },
    });
  };

  // 折りたたみトグル
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  // ドラッグ&ドロップ
  const handleDragStart = (e: DragEvent) => {
    if (!isParent) return;

    setDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(task.id));
    onDragStart?.(task);
  };

  const handleDragEndLocal = () => {
    setDragging(false);
    onDragEnd?.();
  };

  const handleDragOver = (e: DragEvent) => {
    if (!isParent) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDropLocal = (e: DragEvent) => {
    if (!isParent) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    onDrop?.(task.id, prevId);
  };

  // インデント（12px刻み）
  const indentPx = depth * 12;

  // 進捗バーの背景グラデーション（親タスクのみ）
  const progressGradient = isParent && task.progress
    ? `linear-gradient(90deg, rgba(14, 165, 233, 0.1) 0%, rgba(14, 165, 233, 0.1) ${task.progress}%, transparent ${task.progress}%)`
    : undefined;

  return (
    <>
      <div
        className={[
          "relative group flex items-center gap-2 py-1 px-2 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors",
          "min-h-[26px]", // 24-28px
          dragging ? "opacity-50" : "",
          dragOver ? "before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-sky-500 dark:before:bg-sky-400 before:shadow-lg before:shadow-sky-400/50" : "",
        ].join(" ")}
        style={{
          paddingLeft: `${indentPx + 8}px`,
          background: progressGradient,
        }}
        draggable={isParent}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEndLocal}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropLocal}
      >
        {/* 折りたたみアイコン */}
        {children.length > 0 ? (
          <button
            type="button"
            onClick={toggleExpanded}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 rounded text-xs text-gray-500 dark:text-slate-400"
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="flex-shrink-0 w-4" />
        )}

        {/* 完了チェックボックス（葉タスクのみ） */}
        {isLeaf && (
          <input
            type="checkbox"
            checked={task.status === "completed"}
            onChange={(e) => {
              e.stopPropagation();
              toggleCompleted(e as unknown as React.MouseEvent);
            }}
            className="flex-shrink-0 w-3.5 h-3.5 rounded border-gray-400 dark:border-slate-600"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* タスク情報 */}
        {editing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              placeholder="タスク名"
              className="flex-1 bg-gray-50 dark:bg-slate-800 border border-sky-400 dark:border-sky-500 rounded px-2 py-0.5 text-sm text-gray-900 dark:text-white outline-none"
            />
            {isParent && (
              <input
                ref={siteInputRef}
                type="text"
                value={editSite}
                onChange={(e) => setEditSite(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                placeholder="現場名（任意）"
                className="w-32 bg-gray-50 dark:bg-slate-800 border border-emerald-400 dark:border-emerald-500/50 rounded px-2 py-0.5 text-xs text-gray-900 dark:text-white outline-none"
              />
            )}
          </div>
        ) : (
          <div
            className="flex-1 flex items-center gap-2 min-w-0 cursor-text"
            onClick={handleClick}
          >
            {/* タスク名 */}
            <span
              className={[
                "text-sm truncate",
                task.status === "completed" ? "line-through text-gray-400 dark:text-slate-500" : "text-gray-900 dark:text-slate-200",
              ].join(" ")}
            >
              {highlightText(task.title, searchQuery)}
            </span>

            {/* 現場名（親タスクのみ） */}
            {isParent && task.site && (
              <span className="flex-shrink-0 text-xs text-emerald-700 dark:text-slate-400 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 rounded">
                {task.site}
              </span>
            )}

            {/* 期限 */}
            {task.deadline && (
              <span className="flex-shrink-0 text-xs text-gray-500 dark:text-slate-400">
                {fromISOtoDateInput(task.deadline)}
              </span>
            )}

            {/* ステータス */}
            <span className="flex-shrink-0 text-xs text-gray-400 dark:text-slate-500">
              {STATUS_LABEL[task.status]}
            </span>

            {/* 進捗%（親タスクのみ） */}
            {isParent && (
              <span className="flex-shrink-0 text-xs text-sky-600 dark:text-sky-400 font-mono">
                {task.progress || 0}%
              </span>
            )}

            {/* 詳細ボタン */}
            <button
              type="button"
              onClick={handleOpenDetail}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded"
              title="詳細を表示"
            >
              <svg className="w-4 h-4 text-gray-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 子タスク作成フォーム */}
      {expanded && creatingChild && (
        <div
          className="flex items-center gap-2 py-1 px-2 bg-gray-50 dark:bg-white/5 min-h-[26px]"
          style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
        >
          <span className="flex-shrink-0 w-4" />
          <div className="flex-1 flex items-center gap-2">
            <input
              ref={childInputRef}
              type="text"
              value={childTitle}
              onChange={(e) => setChildTitle(e.target.value)}
              onKeyDown={handleChildKeyDown}
              onBlur={handleSaveChild}
              placeholder="子タスク名"
              className="flex-1 bg-gray-50 dark:bg-slate-800 border border-sky-400 dark:border-sky-500 rounded px-2 py-0.5 text-sm text-gray-900 dark:text-white outline-none"
            />
          </div>
        </div>
      )}

      {/* 子タスク */}
      {expanded && children.length > 0 && (
        <div>
          {children.map((child, idx) => (
            <WorkflowyTaskRow
              key={child.id}
              task={child}
              depth={depth + 1}
              prevId={idx === 0 ? null : children[idx - 1].id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </>
  );
}
