// src/features/tasks/compact/CompactTaskTree.tsx
import type { TaskNode } from "../../../types";
import CompactTaskRow from "./CompactTaskRow";

type Props = {
  tree: TaskNode[];
  onEmptySpaceClick: () => void;
};

export default function CompactTaskTree({ tree, onEmptySpaceClick }: Props) {
  const handleContainerClick = (e: React.MouseEvent) => {
    // クリックされた要素が直接コンテナまたは空のメッセージの場合のみ
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-empty-message]')) {
      onEmptySpaceClick();
    }
  };

  if (tree.length === 0) {
    return (
      <div
        className="text-center py-12 text-slate-400 cursor-pointer hover:bg-white/5 rounded-2xl border border-white/15 bg-gradient-to-br from-white/5 via-white/3 to-transparent backdrop-blur-md transition-colors"
        onClick={handleContainerClick}
        data-empty-message
      >
        <p className="text-sm">タスクがありません</p>
        <p className="text-xs mt-2">ここをクリックまたは右下の + ボタンから作成できます</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/5 via-white/3 to-transparent backdrop-blur-md overflow-hidden"
      onClick={handleContainerClick}
    >
      <div role="tree" className="divide-y divide-white/5">
        {tree.map((task, idx) => (
          <CompactTaskRow
            key={task.id}
            task={task}
            depth={0}
            isLast={idx === tree.length - 1}
          />
        ))}
      </div>
      {/* クリック可能な空白エリア */}
      <div className="h-12 hover:bg-white/5 transition-colors cursor-pointer" data-empty-message />
    </div>
  );
}
