// src/features/tasks/inline/InlineTaskTree.tsx
import { useEffect, useMemo } from "react";
import InlineTaskRow from "./InlineTaskRow";
import InlineDropZone from "./InlineDropZone";
import { useInlineDnd } from "./dndContext";
import type { Task } from "../../../types/task";

type Props = { tree: Task[] };

export default function InlineTaskTree({ tree }: Props) {
  const dnd = useInlineDnd();

  // ルート配下の現在順を登録
  const rootIds = useMemo(() => tree.map((t) => t.id), [tree]);
  useEffect(() => {
    if (rootIds.length) dnd.registerChildren(null, rootIds);
  }, [dnd, rootIds]);

  // ルートも DnD の並びで描画
  const orderedRoot = dnd.getOrderedChildren(null, tree);
  const lastRootId =
    orderedRoot.length ? orderedRoot[orderedRoot.length - 1].id : null;

  return (
    <div role="tree" aria-label="タスク" data-testid="task-tree-root">
      {orderedRoot.map((t) => (
        <InlineTaskRow key={t.id} task={t} depth={1} />
      ))}

      {/* 末尾に入れられるように（任意だけど便利） */}
      <div className="pointer-events-none">
        <div className="pointer-events-auto">
          <InlineDropZone
            parentId={null}
            acceptDepth={1}
            lastChildId={lastRootId}
            currentCount={orderedRoot.length}
            showEmptyState={orderedRoot.length === 0}
          />
        </div>
      </div>
    </div>
  );
}
