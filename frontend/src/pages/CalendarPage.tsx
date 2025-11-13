// src/pages/CalendarPage.tsx
import { useState, useMemo, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useTasksFromUrl } from "../features/tasks/useTasks";
import { useUpdateTask } from "../features/tasks/useUpdateTask";
import { useTaskDrawer } from "../features/drawer/useTaskDrawer";
import useAuth from "../providers/useAuth";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import { useToast } from "../components/ToastProvider";
import { brandIso } from "../lib/brandIso";

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
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [calendarView, setCalendarView] = useState<"month" | "week">("month");

  // ビューの切り替え
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(
        calendarView === "month" ? "dayGridMonth" : "timeGridWeek"
      );
    }
  }, [calendarView]);

  // 現場名の一覧を抽出
  const sites = useMemo(() => {
    const siteSet = new Set<string>();
    tasks.forEach((task) => {
      if (task.site) siteSet.add(task.site);
    });
    return Array.from(siteSet).sort();
  }, [tasks]);

  // 期限ありタスクをカレンダーイベント形式に変換（現場フィルター適用）
  const events = useMemo(() => {
    const filteredTasks =
      selectedSite === "all"
        ? tasks
        : tasks.filter((task) => task.site === selectedSite);

    return filteredTasks
      .filter((task): task is typeof task & { deadline: string } =>
        task.deadline !== null && task.deadline !== undefined
      )
      .map((task) => ({
        id: String(task.id),
        title: task.title,
        date: task.deadline,
        backgroundColor: getColorByDeadline(task.deadline, task.status),
        borderColor: getColorByDeadline(task.deadline, task.status),
        extendedProps: { task },
      }));
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

      {/* フィルターとビュー切替 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="site-filter" className="text-sm font-medium text-gray-700">
            現場:
          </label>
          <select
            id="site-filter"
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm"
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
                : "bg-gray-200 text-gray-700 hover:bg-gray-300",
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
                : "bg-gray-200 text-gray-700 hover:bg-gray-300",
            ].join(" ")}
            onClick={() => setCalendarView("week")}
          >
            週表示
          </button>
        </div>
      </div>

      <div className="mb-6 rounded border bg-white p-4">
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
          height="auto"
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
