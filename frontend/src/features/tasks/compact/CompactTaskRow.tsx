// src/features/tasks/compact/CompactTaskRow.tsx
import { useState, useCallback, useRef, useEffect } from "react";
import type { TaskNode } from "../../../types";
import { useUpdateTask } from "../useUpdateTask";
import { brandIso } from "../../../lib/brandIso";
import { toISOorNull, fromISOtoDateInput } from "../../../utils/dateFormat";
import { getStatusLabel } from "../../../constants/taskStatus";

type Props = {
  task: TaskNode;
  depth: number;
  isLast?: boolean;
  parentPath?: boolean[];
};

const getStatusColor = (status: string) => {
  if (status === "completed") return "text-emerald-400";
  if (status === "in_progress") return "text-sky-400";
  return "text-slate-500";
};

export default function CompactTaskRow({ task, depth, isLast = false, parentPath = [] }: Props) {
  const [expanded, setExpanded] = useState(false); // デフォルト折りたたみ
  const [editing, setEditing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // 編集用のローカルステート
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDeadline, setEditDeadline] = useState(fromISOtoDateInput(task.deadline));
  const [editSite, setEditSite] = useState(task.site || "");

  const { mutate: updateTask } = useUpdateTask();

  const rowRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const hasChildren = task.children && task.children.length > 0;

  // 編集モードに入るときにフォーカス
  useEffect(() => {
    if (editing) {
      titleInputRef.current?.focus();
    }
  }, [editing]);

  // 行クリックで編集モード開始
  const handleRowClick = (e: React.MouseEvent) => {
    // 既に編集中、または特定の要素（ボタンなど）をクリックした場合は無視
    if (editing || (e.target as HTMLElement).closest("button")) return;
    setEditing(true);
  };

  // 編集を保存
  const saveEdit = useCallback(() => {
    if (!editTitle.trim()) {
      // タイトルが空の場合は元に戻す
      setEditTitle(task.title);
      setEditing(false);
      return;
    }

    updateTask(
      {
        id: task.id,
        data: {
          title: editTitle.trim(),
          deadline: brandIso(toISOorNull(editDeadline)),
          site: editSite.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setEditing(false);
        },
      }
    );
  }, [task.id, editTitle, editDeadline, editSite, updateTask, task.title]);

  // 編集をキャンセル
  const cancelEdit = useCallback(() => {
    setEditTitle(task.title);
    setEditDeadline(fromISOtoDateInput(task.deadline));
    setEditSite(task.site || "");
    setEditing(false);
  }, [task.title, task.deadline, task.site]);

  // Enterで保存、Escでキャンセル
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  // 折りたたみトグル
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  // 完了チェックボックストグル
  const toggleCompleted = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = task.status === "completed" ? "not_started" : "completed";
    updateTask({
      id: task.id,
      data: { status: newStatus },
    });
  };

  // インデント計算（16px刻み）
  const indentPx = depth * 16;

  // 階層表示用の線のパス
  const currentPath = [...parentPath, !isLast];

  return (
    <>
      <div
        ref={rowRef}
        className="relative group"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* 階層表示の線 */}
        <div className="absolute left-0 top-0 bottom-0 pointer-events-none" aria-hidden>
          {currentPath.slice(0, -1).map((hasLine, idx) => (
            hasLine ? (
              <div
                key={idx}
                className="absolute top-0 bottom-0 w-px bg-white/10"
                style={{ left: `${idx * 16 + 8}px` }}
              />
            ) : null
          ))}
          {depth > 0 && (
            <>
              {/* 縦線 */}
              {!isLast && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-white/10"
                  style={{ left: `${(depth - 1) * 16 + 8}px` }}
                />
              )}
              {/* 横線 */}
              <div
                className="absolute top-[16px] w-2 h-px bg-white/10"
                style={{ left: `${(depth - 1) * 16 + 8}px` }}
              />
            </>
          )}
        </div>

        {/* 縦の進捗バー（左端4px） */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/5">
          <div
            className="w-full bg-gradient-to-b from-sky-400 to-emerald-400 transition-all"
            style={{ height: `${task.progress || 0}%` }}
          />
        </div>

        {/* メイン行（32-36px高さ） */}
        <div
          className={[
            "relative flex items-center min-h-[34px] px-2 transition-colors cursor-pointer",
            editing ? "bg-sky-500/10" : "hover:bg-white/5",
          ].join(" ")}
          style={{ paddingLeft: `${indentPx + 12}px` }}
          onClick={handleRowClick}
        >
          {/* 完了チェックボックス */}
          <button
            onClick={toggleCompleted}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center mr-2 rounded border-2 transition-all"
            style={{
              borderColor: task.status === "completed" ? "rgb(52, 211, 153)" : "rgb(148, 163, 184)",
              backgroundColor: task.status === "completed" ? "rgb(52, 211, 153)" : "transparent",
            }}
            aria-label={task.status === "completed" ? "未完了にする" : "完了にする"}
          >
            {task.status === "completed" && (
              <svg className="w-3 h-3 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* 折りたたみボタン */}
          {hasChildren && (
            <button
              onClick={toggleExpanded}
              className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white transition-colors mr-1"
              aria-label={expanded ? "折りたたむ" : "展開する"}
              aria-expanded={expanded}
            >
              <svg
                className={["w-3 h-3 transition-transform", expanded ? "rotate-90" : ""].join(" ")}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {editing ? (
            // 編集モード
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <input
                ref={titleInputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={saveEdit}
                className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-400/50"
                placeholder="タイトル"
              />
              <input
                type="text"
                value={editSite}
                onChange={(e) => setEditSite(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-20 bg-white/10 border border-white/20 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-400/50"
                placeholder="現場"
              />
              <input
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-28 bg-white/10 border border-white/20 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-400/50 [color-scheme:dark]"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cancelEdit();
                }}
                className="text-xs text-slate-400 hover:text-white px-2"
              >
                ESC
              </button>
            </div>
          ) : (
            // 表示モード
            <div className="flex-1 flex items-center gap-2 min-w-0 text-sm">
              {/* タスク名 */}
              <span className={["flex-1 min-w-0 truncate font-medium", task.status === "completed" ? "line-through text-slate-500" : "text-white"].join(" ")}>
                {task.title}
              </span>
              {/* 現場名 */}
              {task.site && (
                <span className="flex-shrink-0 text-xs text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {task.site}
                </span>
              )}
              {/* 期限 */}
              {task.deadline && (
                <span className="flex-shrink-0 text-xs text-slate-400">
                  {new Date(task.deadline).toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" })}
                </span>
              )}
              {/* 進捗率 */}
              <span className="flex-shrink-0 text-xs text-slate-400 w-10 text-right">
                {task.progress || 0}%
              </span>
              {/* ステータス */}
              <span className={["flex-shrink-0 text-xs w-12", getStatusColor(task.status)].join(" ")}>
                {getStatusLabel(task.status)}
              </span>
            </div>
          )}
        </div>

        {/* ホバーツールチップ */}
        {showTooltip && !editing && (
          <div className="absolute left-full top-0 ml-2 z-50 pointer-events-none">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-lg px-3 py-2 shadow-2xl text-xs text-white whitespace-nowrap">
              <div className="space-y-1">
                <div><span className="text-slate-400">タイトル:</span> {task.title}</div>
                {task.site && <div><span className="text-slate-400">現場:</span> {task.site}</div>}
                {task.deadline && <div><span className="text-slate-400">期限:</span> {new Date(task.deadline).toLocaleDateString("ja-JP")}</div>}
                <div><span className="text-slate-400">進捗:</span> {task.progress || 0}%</div>
                <div><span className="text-slate-400">ステータス:</span> {getStatusLabel(task.status)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 子タスク */}
      {expanded && hasChildren && (
        <div>
          {task.children!.map((child, idx) => (
            <CompactTaskRow
              key={child.id}
              task={child}
              depth={depth + 1}
              isLast={idx === task.children!.length - 1}
              parentPath={currentPath}
            />
          ))}
        </div>
      )}
    </>
  );
}
