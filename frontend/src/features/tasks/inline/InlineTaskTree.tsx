import { useEffect, useMemo } from "react";
import InlineTaskRow from "./InlineTaskRow";
import InlineDropZone from "./InlineDropZone";
import { useInlineDnd } from "./dndContext";
import type { TaskNode } from "../../../types";

type Props = { tree: TaskNode[] };

export default function InlineTaskTree({ tree }: Props) {
  const { registerChildren, getOrderedChildren } = useInlineDnd();
  const orderedRoot = getOrderedChildren(null, tree);
  const orderedIds = useMemo(() => orderedRoot.map(t => t.id), [orderedRoot]);

  // ★ 表示順で登録する（DnDの楽観順を壊さない）
  useEffect(() => {
    registerChildren(null, orderedIds);
    return () => {
      // 任意：アンレジスタする場合
      // registerChildren(null, []);
    };
  }, [registerChildren, orderedIds]);

  const lastRootId =
    orderedRoot.length ? orderedRoot[orderedRoot.length - 1].id : null;

  return (
    <div role="tree" aria-label="タスク" data-testid="task-tree-root">
      {orderedRoot.map((t, i) => {
   const prevId = i > 0 ? orderedRoot[i - 1].id : null;
   return <InlineTaskRow key={t.id} task={t} depth={1} prevId={prevId} />;
 })}
      <div className="pointer-events-none">
        <div className="pointer-events-auto">
          <InlineDropZone
            parentId={null}
            lastChildId={lastRootId}
            showEmptyState={orderedRoot.length === 0}
          />
        </div>
      </div>
    </div>
  );
}
