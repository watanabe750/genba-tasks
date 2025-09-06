import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PriorityTasksPanel from "../features/priority/PriorityTasksPanel";
import { useFilteredTasks } from "../features/tasks/useTasks";
import useAuth from "../providers/useAuth";
import { usePriorityTasks } from "../features/priority/usePriorityTasks";
import { nestTasks, sortRootNodes } from "../features/tasks/nest";
import { TaskFilterBar } from "../features/tasks/TaskFilterBar";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { parseTaskFilters } from "../features/tasks/parseTaskFilters";
import type { PageComponent } from "../types";
import InlineTaskTree from "../features/tasks/inline/InlineTaskTree";
import NewParentTaskForm from "../components/NewParentTaskForm";
import { InlineDndProvider } from "../features/tasks/inline/dndContext";

const TaskList: PageComponent = () => {
  const { authed } = useAuth();
  usePriorityTasks(authed);

  const [sp] = useSearchParams();
  const rawFilters = parseTaskFilters(sp);
  const filters = useDebouncedValue(rawFilters, 300);
  const { data: tasksFlat = [] } = useFilteredTasks(filters, authed);

  const tasks = useMemo(() => {
    const tree = nestTasks(tasksFlat);
    return sortRootNodes(
      tree,
      filters.order_by ?? "deadline",
      filters.dir ?? "asc"
    );
  }, [tasksFlat, filters.order_by, filters.dir]);

  const orderLabel =
    (filters.order_by === "deadline" && "期限") ||
    (filters.order_by === "progress" && "進捗") ||
    (filters.order_by === "created_at" && "作成日") ||
    "期限";

  const dirLabel = filters.dir === "desc" ? "降順" : "昇順";

  return (
    <InlineDndProvider>
      <div className="max-w-6xl mx-auto p-4" data-testid="task-list-root">
        {/* H1は非表示。右肩要約は TaskFilterBar に渡す */}
        <TaskFilterBar summary={`全 ${tasksFlat.length} 件・${orderLabel}/${dirLabel}`} />

        {/* 進捗単一値のインジケータ（既存） */}
        {filters.progress_min != null &&
          filters.progress_max != null &&
          filters.progress_min === filters.progress_max && (
            <div
              className="mb-2 inline-flex items-center gap-2 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700"
              data-testid="progress-single-indicator"
            >
              進捗: {filters.progress_min}%
            </div>
          )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="space-y-4 relative z-10" data-dnd-surface="1">
            <NewParentTaskForm />
            <InlineTaskTree tree={tasks} />
          </section>

          {/* 優先タスクは sticky。ヘッダー分の余白 top-20 は維持 */}
          <aside className="priority-panel self-start lg:sticky lg:top-20 border-l pl-4 z-0">
            <PriorityTasksPanel />
          </aside>
        </div>
      </div>
    </InlineDndProvider>
  );
};

export default TaskList;
