// src/features/tasks/inline/InlineDropZone.tsx
import React from "react";
import { useInlineDnd } from "./dndContext";
import { MAX_CHILDREN_PER_NODE } from "../constraints";
import { useUpdateTask } from "../../tasks/useUpdateTask";

type Props = {
  parentId: number;
  acceptDepth: number;
  lastChildId: number | null;
  currentCount: number;
  showEmptyState?: boolean;
};

export default function InlineDropZone({
  parentId,
  acceptDepth,
  lastChildId,
  currentCount,
  showEmptyState = false,
}: Props) {
  const dnd = useInlineDnd();
  const { mutate: update } = useUpdateTask();

  const isDragging = dnd.state.draggingId != null;
  if (!isDragging) return null; // 非ドラッグ時は DOM から消して邪魔しない

  const sameDepth = dnd.state.draggingDepth === acceptDepth;
  const fromPid = dnd.state.draggingParentId;
  const toPid = parentId;
  const safeCount = typeof currentCount === "number" ? currentCount : 0;
  const capacityOk = fromPid === toPid || safeCount < MAX_CHILDREN_PER_NODE;

  const canAccept = isDragging && sameDepth && capacityOk;

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (canAccept) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    }
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const movingId = dnd.state.draggingId;
    if (movingId == null) return dnd.onDragEnd();

    const afterId = lastChildId ?? -1;

    if (fromPid === toPid) {
      dnd.reorderWithinParent(toPid, movingId, afterId);
    } else {
      if (!capacityOk) return dnd.onDragEnd();
      dnd.moveAcrossParents({ fromPid, toPid, movingId, afterId });
      update({ id: movingId, data: { parent_id: toPid } });
    }
    dnd.onDragEnd();
  };

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={[
        "transition-all rounded border border-dashed",
        canAccept ? "border-blue-400 bg-blue-50/60" : "border-transparent",
        "my-1",
      ].join(" ")}
    >
      {showEmptyState && (
        <div className="px-2 py-1 text-[12px] text-blue-700/80">
          {capacityOk
            ? "ここにドロップ（＋）"
            : `ここには追加できません（最大${MAX_CHILDREN_PER_NODE}件）`}
        </div>
      )}
    </div>
  );
}
