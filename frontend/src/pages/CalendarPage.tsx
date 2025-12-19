// src/pages/CalendarPage.tsx
import { useState, useMemo, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useTasksFromUrl } from "../features/tasks/useTasks";
import { useUpdateTask } from "../features/tasks/useUpdateTask";
import { useTaskDrawer } from "../features/drawer/useTaskDrawer";
import { useSiteList } from "../features/tasks/useSiteList";
import useAuth from "../providers/useAuth";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import type { DayCellContentArg } from "@fullcalendar/core";
import { useToast } from "../components/ToastProvider";
import { brandIso } from "../lib/brandIso";
import { isJapaneseHoliday } from "../utils/japaneseHolidays";

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
  const { mutateAsync: updateTask } = useUpdateTask();
  const { open: openDrawer } = useTaskDrawer();
  const { push: toast } = useToast();
  const { sites } = useSiteList(tasks);
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month");

  // ビューの切り替え
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const viewMap = {
        month: "dayGridMonth",
        week: "timeGridWeek",
        day: "timeGridDay",
      };
      calendarApi.changeView(viewMap[calendarView]);
    }
  }, [calendarView]);

  // 期限ありタスクをカレンダーイベント形式に変換（現場フィルター適用・複数日対応）
  const events = useMemo(() => {
    const filteredTasks =
      selectedSite === "all"
        ? tasks
        : tasks.filter((task) => task.site === selectedSite);

    return filteredTasks
      .filter((task): task is typeof task & { deadline: string } =>
        task.deadline !== null && task.deadline !== undefined
      )
      .map((task) => {
        const hasStartDate = task.start_date && task.start_date !== null;

        // 複数日タスク（開始日〜期限日）または単日タスク（期限日のみ）
        return {
          id: String(task.id),
          title: task.title,
          start: hasStartDate ? task.start_date : task.deadline,
          end: hasStartDate ? task.deadline : undefined,
          allDay: true,
          backgroundColor: getColorByDeadline(task.deadline, task.status),
          borderColor: getColorByDeadline(task.deadline, task.status),
          extendedProps: { task },
        };
      });
  }, [tasks, selectedSite]);

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
    openDrawer(taskId);
  };

  // ドラッグ&ドロップハンドラ
  const handleEventDrop = async (info: EventDropArg) => {
    const taskId = Number(info.event.id);
    const newDate = info.event.start;

    if (!newDate) {
      info.revert();
      return;
    }

    // YYYY-MM-DD形式に変換
    const newDeadlineStr = newDate.toISOString().split("T")[0];
    const newDeadline = brandIso(newDeadlineStr);

    try {
      await updateTask({
        id: taskId,
        data: { deadline: newDeadline },
      });
      toast("期限を更新しました", "success");
    } catch (error) {
      info.revert();
      const err = error as { message?: string };
      toast(err?.message ?? "期限の更新に失敗しました", "error");
    }
  };

  // 日付セルのカスタムレンダリング（土日祝日の背景色）
  const dayCellClassNames = (arg: DayCellContentArg) => {
    const date = arg.date;
    const dayOfWeek = date.getDay();
    const classes: string[] = [];

    // 祝日判定
    if (isJapaneseHoliday(date)) {
      classes.push("fc-day-holiday");
    }
    // 日曜日
    else if (dayOfWeek === 0) {
      classes.push("fc-day-sunday");
    }
    // 土曜日
    else if (dayOfWeek === 6) {
      classes.push("fc-day-saturday");
    }

    return classes;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-3 md:p-6 bg-gray-50 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">カレンダー</h1>
        <div className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
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

      {/* フィルターとビュー切替 */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="site-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            現場:
          </label>
          <select
            id="site-filter"
            className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm"
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
          >
            <option value="all">すべて</option>
            {sites.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            className={[
              "rounded px-3 py-1.5 text-sm font-medium transition-colors",
              calendarView === "month"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600",
            ].join(" ")}
            onClick={() => setCalendarView("month")}
          >
            月表示
          </button>
          <button
            className={[
              "rounded px-3 py-1.5 text-sm font-medium transition-colors",
              calendarView === "week"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600",
            ].join(" ")}
            onClick={() => setCalendarView("week")}
          >
            週表示
          </button>
          <button
            className={[
              "rounded px-3 py-1.5 text-sm font-medium transition-colors",
              calendarView === "day"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600",
            ].join(" ")}
            onClick={() => setCalendarView("day")}
          >
            日表示
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden md:flex-row">
        <div className={[
          "rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4",
          selectedDate ? "md:w-2/3" : "w-full"
        ].join(" ")}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="ja"
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            editable={true}
            height="100%"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
            buttonText={{
              today: "今日",
            }}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={true}
            dayCellClassNames={dayCellClassNames}
            dayCellContent={(arg) => arg.dayNumberText.replace('日', '')}
          />
        </div>

        {selectedDate && (
          <div className="flex flex-col rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 md:w-1/3">
            <h2 className="mb-3 flex items-center justify-between text-lg font-semibold text-gray-900 dark:text-gray-100">
              <span>
                {selectedDate.toLocaleDateString("ja-JP", {
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                {tasksOnSelectedDate.length}件
              </span>
            </h2>
            <div className="flex-1 overflow-y-auto">
              {tasksOnSelectedDate.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">この日のタスクはありません</p>
              ) : (
                <div className="space-y-2">
                  {tasksOnSelectedDate.map((task) => (
                    <div
                      key={task.id}
                      className={[
                        "cursor-pointer rounded border border-gray-200 dark:border-gray-700 p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700",
                        selectedTaskId === task.id ? "ring-2 ring-blue-500" : "",
                      ].join(" ")}
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{task.title}</h3>
                          {task.site && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">現場: {task.site}</p>
                          )}
                          <div className="mt-1 flex items-center gap-3 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">進捗: {task.progress}%</span>
                            <span
                              className={[
                                "rounded px-2 py-0.5 text-xs",
                                task.status === "completed"
                                  ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300"
                                  : task.status === "in_progress"
                                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
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
          </div>
        )}
      </div>
    </div>
  );
}
