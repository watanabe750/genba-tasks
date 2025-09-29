// src/pages/TaskList.tsx
import { useMemo, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PriorityTasksPanel from "../features/priority/PriorityTasksPanel";
import { useFilteredTasks } from "../features/tasks/useTasks";
import useAuth from "../providers/useAuth";
import { usePriorityTasks } from "../features/priority/usePriorityTasks";
import { nestTasks, sortRootNodes } from "../features/tasks/nest";
import type { Task, TaskNode } from "../types";
import { TaskFilterBar } from "../features/tasks/TaskFilterBar";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { parseTaskFilters } from "../features/tasks/parseTaskFilters";
import type { PageComponent } from "../types";
import InlineTaskTree from "../features/tasks/inline/InlineTaskTree";
import NewParentTaskForm from "../components/NewParentTaskForm";
import { InlineDndProvider } from "../features/tasks/inline/dndContext";

const TaskList: PageComponent = () => {
  const { authed } = useAuth();
  const DEMO = import.meta.env.VITE_DEMO_MODE === "true";
  const enabled = authed || DEMO;
  usePriorityTasks(enabled);

  const [isGuest, setIsGuest] = useState(false);
  useEffect(() => {
    const read = () => {
      try { setIsGuest(sessionStorage.getItem("auth:demo") === "1"); } catch {}
    };
    read();
    window.addEventListener("auth:refresh", read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("auth:refresh", read);
      window.removeEventListener("focus", read);
    };
  }, []);

  const [sp] = useSearchParams();
  const rawFilters = parseTaskFilters(sp);
  const filters = useDebouncedValue(rawFilters, 300);

  // APIにも position をデフォルトで渡す
  const effectiveFilters = useMemo(
    () => ({ ...filters, order_by: filters.order_by ?? "position" }),
    [filters]
  );
  const { data: tasksFlat = [] as Task[] } = useFilteredTasks(effectiveFilters, enabled);

  // 表示用の order/dir も一元化
  const orderBy = effectiveFilters.order_by ?? "position";
  const dir = effectiveFilters.dir ?? "asc";

  const tasks: TaskNode[] = useMemo(() => {
    const incomplete: Task[] = [];
    const completed: Task[] = [];
    for (const t of tasksFlat) (t.status === "completed" ? completed : incomplete).push(t);
    const prioritized = [...incomplete, ...completed];

    const tree = nestTasks(prioritized);
    if (orderBy === "position") return tree; // DnD保存順をそのまま使う
    return sortRootNodes(tree, orderBy, dir);
  }, [tasksFlat, orderBy, dir]);

  const orderLabel =
    (orderBy === "position" && "手動") ||
    (orderBy === "deadline" && "期限") ||
    (orderBy === "progress" && "進捗") ||
    (orderBy === "created_at" && "作成日") ||
    "手動";

  const dirLabel = dir === "desc" ? "降順" : "昇順";

  return (
    <InlineDndProvider>
      <div className="max-w-6xl mx-auto p-4" data-testid="task-list-root">
        {isGuest && (
          <div className="mb-3 rounded border border-amber-2 00 bg-amber-50 px-3 py-2 text-xs text-amber-800" role="note">
            これは<strong className="mx-1">ゲスト環境</strong>です。データは定期的に初期化される場合があります。
          </div>
        )}

        <TaskFilterBar summary={`全 ${tasksFlat.length} 件・${orderLabel}/${dirLabel}`} />

        {filters.progress_min != null &&
          filters.progress_max != null &&
          filters.progress_min === filters.progress_max && (
            <div className="mb-2 inline-flex items-center gap-2 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
              進捗: {filters.progress_min}%
            </div>
          )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="space-y-4 relative z-10" data-dnd-surface="1">
            <NewParentTaskForm />
            <InlineTaskTree tree={tasks} />
          </section>
          <aside className="priority-panel self-start lg:sticky lg:top-20 border-l pl-4 z-0">
            <PriorityTasksPanel />
          </aside>
        </div>
      </div>
    </InlineDndProvider>
  );
};

export default TaskList;
