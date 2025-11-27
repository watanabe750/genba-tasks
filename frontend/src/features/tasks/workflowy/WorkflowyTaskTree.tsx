// src/features/tasks/workflowy/WorkflowyTaskTree.tsx
import { useState, useRef, useEffect } from "react";
import type { TaskNode } from "../../../types";
import WorkflowyTaskRow from "./WorkflowyTaskRow";
import { useCreateTask } from "../useCreateTask";
import { useUpdateTask } from "../useUpdateTask";

type Props = {
  tree: TaskNode[];
};

export default function WorkflowyTaskTree({ tree }: Props) {
  const [draggingTask, setDraggingTask] = useState<TaskNode | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSite, setNewSite] = useState("");

  const { mutate: createTask } = useCreateTask();
  const { mutate: updateTask } = useUpdateTask();
  const emptyAreaRef = useRef<HTMLDivElement>(null);
  const newTitleInputRef = useRef<HTMLInputElement>(null);

  // 新規作成フォーム表示時にフォーカス
  useEffect(() => {
    if (creatingNew) {
      newTitleInputRef.current?.focus();
    }
  }, [creatingNew]);

  const handleDragStart = (task: TaskNode) => {
    setDraggingTask(task);
  };

  const handleDragEnd = () => {
    setDraggingTask(null);
  };

  const handleDrop = (targetId: number, prevId: number | null) => {
    if (!draggingTask || draggingTask.id === targetId) return;

    // 並び替え処理
    updateTask({
      id: draggingTask.id,
      data: {
        after_id: prevId,
      },
    });
  };

  // 空白エリアクリックで新規タスク作成フォーム表示
  const handleEmptyAreaClick = () => {
    setCreatingNew(true);
    setNewTitle("");
    setNewSite("");
  };

  // 新規タスク保存
  const handleSaveNew = () => {
    const trimmed = newTitle.trim();
    if (trimmed) {
      createTask({
        title: trimmed,
        site: newSite.trim() || null,
        parentId: null,
      });
    }
    setCreatingNew(false);
    setNewTitle("");
    setNewSite("");
  };

  // 新規タスクキャンセル
  const handleCancelNew = () => {
    setCreatingNew(false);
    setNewTitle("");
    setNewSite("");
  };

  // キーボード操作
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveNew();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelNew();
    }
  };

  return (
    <div className="relative">
      {/* タスクリスト */}
      <div className="divide-y divide-white/5">
        {tree.map((task, idx) => (
          <WorkflowyTaskRow
            key={task.id}
            task={task}
            depth={1}
            prevId={idx === 0 ? null : tree[idx - 1].id}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* 新規タスク作成フォーム */}
      {creatingNew && (
        <div className="flex items-center gap-2 py-1 px-2 bg-white/5 min-h-[26px]" style={{ paddingLeft: "20px" }}>
          <span className="flex-shrink-0 w-4" />
          <div className="flex-1 flex items-center gap-2">
            <input
              ref={newTitleInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveNew}
              placeholder="タスク名"
              className="flex-1 bg-slate-800 border border-sky-500 rounded px-2 py-0.5 text-sm text-white outline-none"
            />
            <input
              type="text"
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveNew}
              placeholder="現場名（任意）"
              className="w-32 bg-slate-800 border border-emerald-500/50 rounded px-2 py-0.5 text-xs text-white outline-none"
            />
          </div>
        </div>
      )}

      {/* 空白エリア（クリックで新規タスク作成） */}
      {!creatingNew && (
        <div
          ref={emptyAreaRef}
          className="min-h-[100px] hover:bg-white/[0.02] cursor-pointer transition-colors group"
          onClick={handleEmptyAreaClick}
        >
          <div className="flex items-center justify-center h-full text-slate-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            クリックして新規タスクを作成
          </div>
        </div>
      )}
    </div>
  );
}
