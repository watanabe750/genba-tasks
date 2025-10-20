import { useEffect, useMemo } from "react";
import InlineTaskRow from "./InlineTaskRow";
import InlineDropZone from "./InlineDropZone";
import { useInlineDnd } from "./dndContext";
import type { TaskNode } from "../../../types";

type Props = { tree: TaskNode[] };

const DBG = import.meta.env.DEV;
const log = (...a: any[]) => DBG && console.log("[DND:Tree]", ...a);

export default function InlineTaskTree({ tree }: Props) {
  const { registerChildren, getOrderedChildren } = useInlineDnd();

  // ① 素の tree の順序（サーバ/クライアントの並び替え結果そのもの）
  const rawIds = useMemo(() => tree.map((t) => t.id), [tree]);

  // ② registerChildren へは“素の順序”を渡す
  useEffect(() => {
    log("register root", rawIds);
    registerChildren(null, rawIds);
  }, [registerChildren, rawIds]);

  // ③ 表示は orderMap を加味した順序で描画
  const orderedRoot = getOrderedChildren(null, tree);
  const lastRootId =
    orderedRoot.length ? orderedRoot[orderedRoot.length - 1].id : null;

  return (
    <div role="tree" aria-label="タスク" data-testid="task-tree-root">
      {orderedRoot.map((t, i) => (
        <InlineTaskRow
          key={t.id}
          task={t}
          depth={1}
          prevId={i === 0 ? null : orderedRoot[i - 1].id}
        />
      ))}

      {/* 末尾専用のドロップゾーン（同一親内のみ受け付ける） */}
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
