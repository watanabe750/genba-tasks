import { memo } from "react";
import { useTaskDrawer } from "../../drawer/useTaskDrawer";
import { useTaskDetail } from "../../tasks/useTaskDetail";

type Props = { taskId: number };

function CompactThumb({ taskId }: Props) {
  const { data } = useTaskDetail(taskId); // react-query キャッシュ共有
  const { open } = useTaskDrawer();

  const imageUrl = data?.image_url ?? null;
  const thumbUrl = data?.image_thumb_url ?? null;
  const hasImage = !!imageUrl;

  const onClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    open(taskId, e.currentTarget, { section: "image" });
  };

  return (
    <button
      type="button"
      data-testid={`task-thumb-${taskId}`}
      aria-label={hasImage ? "画像を表示" : "画像は未設定"}
      title={hasImage ? "画像を表示" : "画像は未設定"}
      draggable={false}
      onMouseDown={(e) => e.stopPropagation()} // DnD 干渉防止
      onClick={onClick}
      className={[
        // sm=80px, md=112px
        "inline-flex h-20 w-20 md:h-28 md:w-28 items-center justify-center overflow-hidden",
        "rounded ring-1 ring-gray-200 bg-white hover:ring-gray-300 shrink-0",
      ].join(" ")}
    >
      {hasImage ? (
        <img
          src={thumbUrl || imageUrl!}
          alt=""
          className="block h-full w-full object-cover pointer-events-none"
          draggable={false}
        />
      ) : (
        <span className="text-[20px] md:text-[24px] leading-none text-gray-600 font-semibold">
          未
        </span>
      )}
    </button>
  );
}

export default memo(CompactThumb);
