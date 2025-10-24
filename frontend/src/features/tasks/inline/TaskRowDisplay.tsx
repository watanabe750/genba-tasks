import type { TaskNode } from "../../../types";

interface Props {
  task: TaskNode;
  isParent: boolean;
  titleRef?: React.RefObject<HTMLSpanElement>;
  onTitleClick: () => void;
  onTitleKeyDown: (e: React.KeyboardEvent) => void;
}

const STATUS_LABEL: Record<TaskNode["status"], string> = {
  not_started: "未着手",
  in_progress: "進行中",
  completed: "完了",
};

function toDateInputValue(iso?: string | null): string {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * タスク表示コンポーネント
 * タイトル、期限、ステータス、現場名を表示
 */
export function TaskRowDisplay({ task, isParent, titleRef, onTitleClick, onTitleKeyDown }: Props) {
  return (
    <>
      <div
        className="flex min-w-0 items-center gap-2"
        onClick={onTitleClick}
        onKeyDown={onTitleKeyDown}
      >
        <span
          ref={titleRef}
          data-testid={`task-title-${task.id}`}
          role={isParent ? "button" : undefined}
          tabIndex={isParent ? 0 : undefined}
          aria-haspopup={isParent ? "dialog" : undefined}
          title={isParent ? "詳細を開く" : undefined}
          className={[
            "truncate hover:underline decoration-dotted",
            isParent
              ? "text-[18px] md:text-[20px] font-semibold leading-tight"
              : "text-[15px] font-medium",
            isParent ? "cursor-pointer" : "cursor-text",
            task.status === "completed" ? "text-gray-400 line-through" : "",
          ].join(" ")}
        >
          {task.title}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-600">
        <span>期限: {task.deadline ? toDateInputValue(task.deadline) : "—"}</span>
        <span data-testid={`task-status-${task.id}`} data-status={task.status}>
          ステータス: {STATUS_LABEL[task.status]}
        </span>
        {task.site ? <span>現場名: {task.site}</span> : null}
      </div>
    </>
  );
}
