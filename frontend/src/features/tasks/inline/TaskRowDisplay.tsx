import type { TaskNode } from "../../../types";
import { toDateInputValue, getDeadlineUrgency, formatDaysUntilDeadline } from "../../../utils/date";

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

// 期限の緊急度に応じたスタイル
const URGENCY_STYLES = {
  overdue: "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700 font-semibold",
  urgent: "bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700 font-semibold",
  warning: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700",
  normal: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600",
  none: "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600",
};

/**
 * タスク表示コンポーネント
 * タイトル、期限、ステータス、現場名を表示
 */
export function TaskRowDisplay({ task, isParent, titleRef, onTitleClick, onTitleKeyDown }: Props) {
  const urgency = getDeadlineUrgency(task.deadline);
  const daysUntilText = formatDaysUntilDeadline(task.deadline);
  const deadlineDate = task.deadline ? toDateInputValue(task.deadline) : null;

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
            task.status === "completed" ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-900 dark:text-gray-100",
          ].join(" ")}
        >
          {task.title}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
        {/* 期限バッジ */}
        {deadlineDate && (
          <span
            className={[
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs",
              URGENCY_STYLES[urgency],
            ].join(" ")}
            data-testid={`task-deadline-${task.id}`}
            data-urgency={urgency}
          >
            <span>📅</span>
            <span>{deadlineDate}</span>
            <span className="font-semibold">({daysUntilText})</span>
          </span>
        )}
        {!deadlineDate && (
          <span className="text-gray-500 dark:text-gray-400">期限: —</span>
        )}

        {/* ステータス */}
        <span data-testid={`task-status-${task.id}`} data-status={task.status} className="text-gray-600 dark:text-gray-400">
          ステータス: {STATUS_LABEL[task.status]}
        </span>

        {/* 現場名 */}
        {task.site ? <span className="text-gray-600 dark:text-gray-400">現場名: {task.site}</span> : null}
      </div>
    </>
  );
}
