// src/pages/CalendarPage.tsx
import { useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useTasksFromUrl } from "../features/tasks/useTasks";
import useAuth from "../providers/useAuth";
import type { Task } from "../types/task";
import type { DateClickArg, EventClickArg } from "@fullcalendar/interaction";

// 期限に応じた色分けロジック
function getColorByDeadline(deadline: string, status: string): string {
  if (status === "completed") return "#10b981"; // 緑（完了）

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return "#ef4444"; // 赤（期限切れ）
  if (daysUntil <= 3) return "#f59e0b"; // 黄（3日以内）
  return "#3b82f6"; // 青（通常）
}

export default function CalendarPage() {
  const { authed } = useAuth();
  const DEMO = import.meta.env.VITE_DEMO_MODE === "true";
  const enabled = authed || DEMO;

  const { data: tasks = [] } = useTasksFromUrl(enabled);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // 期限ありタスクをカレンダーイベント形式に変換
  const events = useMemo(() => {
    return tasks
      .filter((task) => task.deadline)
      .map((task) => ({
        id: String(task.id),
        title: task.title,
        date: task.deadline,
        backgroundColor: getColorByDeadline(task.deadline!, task.status),
        borderColor: getColorByDeadline(task.deadline!, task.status),
        extendedProps: { task },
      }));
  }, [tasks]);

  // 選択日のタスク一覧
  const tasksOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split("T")[0];
    return tasks.filter((task) => task.deadline?.startsWith(dateStr));
  }, [selectedDate, tasks]);

  // 日付クリックハンドラ
  const handleDateClick = (info: DateClickArg) => {
    setSelectedDate(new Date(info.dateStr));
    setSelectedTaskId(null);
  };

  // タスククリックハンドラ
  const handleEventClick = (info: EventClickArg) => {
    const taskId = Number(info.event.id);
    setSelectedTaskId(taskId);
    // TODO: タスク詳細ドロワーを開く実装（次のPRで対応）
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">カレンダー</h1>
        <div className="flex gap-3 text-sm">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "#ef4444" }}></div>
            <span>期限切れ</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "#f59e0b" }}></div>
            <span>3日以内</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
            <span>通常</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: "#10b981" }}></div>
            <span>完了</span>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded border bg-white p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="ja"
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          buttonText={{
            today: "今日",
          }}
        />
      </div>

      {selectedDate && (
        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">
            {selectedDate.toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            のタスク（{tasksOnSelectedDate.length}件）
          </h2>
          {tasksOnSelectedDate.length === 0 ? (
            <p className="text-gray-500">この日のタスクはありません</p>
          ) : (
            <div className="space-y-2">
              {tasksOnSelectedDate.map((task) => (
                <div
                  key={task.id}
                  className={[
                    "cursor-pointer rounded border p-3 transition-colors hover:bg-gray-50",
                    selectedTaskId === task.id ? "ring-2 ring-blue-500" : "",
                  ].join(" ")}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{task.title}</h3>
                      {task.site && (
                        <p className="text-sm text-gray-600">現場: {task.site}</p>
                      )}
                      <div className="mt-1 flex items-center gap-3 text-sm">
                        <span className="text-gray-600">進捗: {task.progress}%</span>
                        <span
                          className={[
                            "rounded px-2 py-0.5 text-xs",
                            task.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : task.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800",
                          ].join(" ")}
                        >
                          {task.status === "completed"
                            ? "完了"
                            : task.status === "in_progress"
                              ? "進行中"
                              : "未着手"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
