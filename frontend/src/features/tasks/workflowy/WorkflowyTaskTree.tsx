// src/features/tasks/workflowy/WorkflowyTaskTree.tsx
import { useState, useRef } from "react";
import type { TaskNode } from "../../../types";
import WorkflowyTaskRow from "./WorkflowyTaskRow";
import { useCreateTask } from "../useCreateTask";
import { useUpdateTask } from "../useUpdateTask";

type Props = {
  tree: TaskNode[];
};

export default function WorkflowyTaskTree({ tree }: Props) {
  const [draggingTask, setDraggingTask] = useState<TaskNode | null>(null);
  const { mutate: createTask } = useCreateTask();
  const { mutate: updateTask } = useUpdateTask();
  const emptyAreaRef = useRef<HTMLDivElement>(null);

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

  // 空白エリアクリックで新規タスク作成
  const handleEmptyAreaClick = () => {
    createTask({ title: "", parentId: null });
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

      {/* 空白エリア（クリックで新規タスク作成） */}
      <div
        ref={emptyAreaRef}
        className="min-h-[100px] hover:bg-white/[0.02] cursor-pointer transition-colors group"
        onClick={handleEmptyAreaClick}
      >
        <div className="flex items-center justify-center h-full text-slate-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          クリックして新規タスクを作成
        </div>
      </div>
    </div>
  );
}
