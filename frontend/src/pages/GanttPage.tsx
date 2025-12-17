// src/pages/GanttPage.tsx - ガントチャート（工程表）ページ
import { useMemo, useState } from "react";
import { useTasksFromUrl } from "../features/tasks/useTasks";
import { useTaskDependencies } from "../features/gantt/useTaskDependencies";
import { calculateCriticalPath } from "../features/gantt/criticalPath";
import useAuth from "../providers/useAuth";
import { useSiteList } from "../features/tasks/useSiteList";
import type { GanttTask } from "../types";

export default function GanttPage() {
  const { authed } = useAuth();
  const DEMO = import.meta.env.VITE_DEMO_MODE === "true";
  const enabled = authed || DEMO;

  const { data: tasks = [] } = useTasksFromUrl(enabled);
  const { data: dependencies = [] } = useTaskDependencies();
  const { sites } = useSiteList(tasks);

  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [zoom, setZoom] = useState<"week" | "month" | "quarter">("month");

  // クリティカルパスを計算
  const ganttTasks = useMemo(() => {
    const filtered = selectedSite === "all"
      ? tasks
      : tasks.filter(t => t.site === selectedSite);

    return calculateCriticalPath(filtered, dependencies);
  }, [tasks, dependencies, selectedSite]);

  // 表示期間を計算
  const { minDate, maxDate, dateRange } = useMemo(() => {
    if (ganttTasks.length === 0) {
      return { minDate: new Date(), maxDate: new Date(), dateRange: [] };
    }

    const dates = ganttTasks
      .map(t => t.start_date)
      .filter((d): d is string => d !== null)
      .map(d => new Date(d));

    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));

    // 余白を追加
    min.setDate(min.getDate() - 7);
    max.setDate(max.getDate() + 14);

    // 日付範囲を生成
    const range: Date[] = [];
    const current = new Date(min);
    while (current <= max) {
      range.push(new Date(current));
      current.setDate(current.getDate() + (zoom === "week" ? 1 : zoom === "month" ? 7 : 30));
    }

    return { minDate: min, maxDate: max, dateRange: range };
  }, [ganttTasks, zoom]);

  // タスクを横棒で表示する際の位置とサイズを計算
  const calculateBarStyle = (task: GanttTask) => {
    if (!task.start_date || !task.deadline) {
      return { left: "0%", width: "0%", display: "none" };
    }

    const start = new Date(task.start_date);
    const end = new Date(task.deadline);
    const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const startOffset = (start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.max(1, width)}%`,
    };
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-3 md:p-6 bg-gray-50 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">工程表（ガントチャート）</h1>
        <div className="flex gap-3 items-center">
          {/* 現場フィルター */}
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

          {/* ズーム */}
          <div className="flex gap-2">
            <button
              className={[
                "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                zoom === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600",
              ].join(" ")}
              onClick={() => setZoom("week")}
            >
              週
            </button>
            <button
              className={[
                "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                zoom === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600",
              ].join(" ")}
              onClick={() => setZoom("month")}
            >
              月
            </button>
            <button
              className={[
                "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                zoom === "quarter"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600",
              ].join(" ")}
              onClick={() => setZoom("quarter")}
            >
              四半期
            </button>
          </div>
        </div>
      </div>

      {/* 凡例 */}
      <div className="mb-4 flex gap-4 text-sm text-gray-700 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <div className="h-4 w-8 rounded bg-red-500"></div>
          <span>クリティカルパス（遅延厳禁）</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-8 rounded bg-blue-500"></div>
          <span>通常タスク</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-8 rounded bg-green-500"></div>
          <span>完了</span>
        </div>
      </div>

      {/* ガントチャート */}
      <div className="flex-1 overflow-auto rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {ganttTasks.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
            タスクがありません。開始日と期限が設定されたタスクを作成してください。
          </div>
        ) : (
          <div className="min-w-[800px]">
            {/* ヘッダー（日付軸） */}
            <div className="sticky top-0 z-10 flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-700 px-4 py-2 font-semibold text-gray-900 dark:text-gray-100">
                タスク名
              </div>
              <div className="flex-1 flex relative">
                {dateRange.map((date, i) => (
                  <div
                    key={i}
                    className="flex-1 border-r border-gray-200 dark:border-gray-700 px-2 py-2 text-center text-xs text-gray-600 dark:text-gray-400"
                  >
                    {date.toLocaleDateString("ja-JP", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* タスク行 */}
            {ganttTasks.map((task) => {
              const barStyle = calculateBarStyle(task);
              const barColor = task.status === "completed"
                ? "bg-green-500"
                : task.is_critical
                  ? "bg-red-500"
                  : "bg-blue-500";

              return (
                <div
                  key={task.id}
                  className="flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {/* タスク名 */}
                  <div className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-700 px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{task.title}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {task.site} | 進捗: {task.progress}%
                      {task.is_critical && (
                        <span className="ml-2 rounded bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 text-red-700 dark:text-red-300 font-semibold">
                          重要
                        </span>
                      )}
                      {task.slack_days > 0 && (
                        <span className="ml-2 text-gray-500 dark:text-gray-400">
                          余裕: {task.slack_days}日
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 横棒 */}
                  <div className="flex-1 relative py-3">
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 h-6 rounded ${barColor} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                      style={barStyle}
                      title={`${task.start_date} 〜 ${task.deadline} (${task.duration_days}日間)`}
                    >
                      <div className="h-full flex items-center justify-center text-xs text-white font-semibold">
                        {task.progress}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 説明 */}
      <div className="mt-4 rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
        <p className="font-semibold mb-1">工程表の見方</p>
        <ul className="list-disc list-inside space-y-1">
          <li>赤色のタスクはクリティカルパス上のタスクです。これらが遅れると全体の工期に影響します。</li>
          <li>「余裕: N日」は、そのタスクを最大N日遅らせても全体に影響しない日数です。</li>
          <li>依存関係を設定するには、タスク詳細画面で「先行タスク」を選択してください。</li>
        </ul>
      </div>
    </div>
  );
}
