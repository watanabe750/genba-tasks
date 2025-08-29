// src/features/tasks/inline/InlineDropZone.tsx
import { MAX_CHILDREN_PER_NODE } from "../../tasks/constraints";
import { useUpdateTask } from "../../tasks/useUpdateTask";
import { useInlineDnd } from "./dndContext";

type Props = {
  parentId: number;
  acceptDepth: number;
  lastChildId: number | null;
  currentCount?: number;
  showEmptyState?: boolean;
};

// 親IDの正規化 & 比較
const normPid = (v: number | string | null | undefined) =>
  v == null ? null : Number(v);
const samePid = (
  a: number | string | null | undefined,
  b: number | string | null | undefined
) => normPid(a) === normPid(b);

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
  if (!isDragging) return null; // 非ドラッグ時はDOMごと出さない

  const sameDepth = dnd.state.draggingDepth === acceptDepth;

  const fromPid = dnd.state.draggingParentId;        // 現在掴んでるタスクの親
  const toPid = parentId;                            // このDropZoneの親
  const sameParent = samePid(fromPid, toPid);

  // “親またぎ禁止”なので、同一親のみ許可
  const canAccept = isDragging && sameDepth && sameParent;

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (!canAccept) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const movingId = dnd.state.draggingId;
    if (movingId == null) return dnd.onDragEnd();

    // 同一親のみ並べ替え。親が違えば何もしない（禁止）。
    if (!sameParent) return dnd.onDragEnd();

    const afterId = lastChildId ?? null; // 末尾に置く
    dnd.reorderWithinParent(normPid(toPid), movingId, lastChildId ?? -1);

    // ★ DB 永続化：末尾ドロップは after_id = lastChildId（子0なら null で先頭扱い）
    update({ id: movingId, data: { after_id: afterId } });

    dnd.onDragEnd();
  };

  // 禁止メッセージ（同じ深さだが親が違う）
  const showBlockedMsg = isDragging && sameDepth && !sameParent;

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={[
        "transition-all rounded border border-dashed",
        canAccept ? "border-blue-400 bg-blue-50/60" : "border-transparent",
        "my-1",
      ].join(" ")}
      aria-hidden={!isDragging}
    >
      {showEmptyState && showBlockedMsg && (
        <div className="px-2 py-1 text-[12px] text-blue-700/80">
          ここには追加できません（親をまたぐ移動は不可）
        </div>
      )}
    </div>
  );
}
