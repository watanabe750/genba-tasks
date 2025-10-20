// src/features/tasks/inline/InlineDropZone.tsx
import { useInlineDnd } from "./dndContext";

type Props = {
  parentId: number | null;
  lastChildId: number | null;
  showEmptyState: boolean;
};

const DBG = import.meta.env.DEV;
const log = (...a: any[]) => DBG && console.log("[DND:DropZone]", ...a);

// 親IDの正規化 & 比較
const normPid = (v: number | string | null | undefined) =>
  v == null ? null : Number(v);
const samePid = (
  a: number | string | null | undefined,
  b: number | string | null | undefined
) => normPid(a) === normPid(b);

export default function InlineDropZone({
  parentId,
  lastChildId,
  showEmptyState = false,
}: Props) {
  const dnd = useInlineDnd();

  const isDragging = dnd.state.draggingId != null;
  const sameParent = samePid(dnd.state.draggingParentId, parentId);

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  };
  const onDragEnter: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging) return;
    e.preventDefault();
  };
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const movingId = dnd.state.draggingId;
    log("drop zone", { movingId, parentId, lastChildId, sameParent });

    if (movingId == null) return dnd.onDragEnd();
    if (!sameParent) return dnd.onDragEnd(); // 親またぎ不可

    const afterId = lastChildId ?? -1; // 末尾に付ける
    dnd.reorderWithinParent(normPid(parentId), movingId, afterId);
    dnd.onDragEnd();
  };

  const canAccept = isDragging && sameParent;

  return (
    <div
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
      className={[
        "transition-all rounded border border-dashed",
        canAccept ? "border-blue-400 bg-blue-50/60" : "border-transparent",
        "my-1",
      ].join(" ")}
      aria-hidden={!isDragging}
    >
      {showEmptyState && isDragging && !sameParent && (
        <div className="px-2 py-1 text-[12px] text-blue-700/80">
          ここには追加できません（親をまたぐ移動は不可）
        </div>
      )}
    </div>
  );
}
