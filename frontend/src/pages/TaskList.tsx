import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PriorityTasksPanel from "../features/priority/PriorityTasksPanel";
import { useFilteredTasks } from "../features/tasks/useTasks";
import { useAuth } from "../providers/useAuth";
import { usePriorityTasks } from "../features/priority/usePriorityTasks";
import { nestTasks } from "../features/tasks/nest";
import { TaskFilterBar } from "../features/tasks/TaskFilterBar";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { parseTaskFilters } from "../features/tasks/parseTaskFilters";
import type { PageComponent } from "../types";
import InlineTaskTree from "../features/tasks/inline/InlineTaskTree";
import NewParentTaskForm from "../components/NewParentTaskForm";

const TaskList: PageComponent = () => {
  const { authed } = useAuth();
  usePriorityTasks(authed);

  const [sp] = useSearchParams();
  const rawFilters = parseTaskFilters(sp);
  const filters = useDebouncedValue(rawFilters, 300);
  const { data: tasksFlat = [] } = useFilteredTasks(filters, authed);
  const tasks = useMemo(() => nestTasks(tasksFlat), [tasksFlat]);

  return (
    <div className="max-w-6xl mx-auto p-4" data-testid="task-list-root">
      {/* ← E2E が探すテキスト */}
      <h1 className="text-lg font-semibold mb-2">タスク一覧ページ</h1>

      <TaskFilterBar />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-4">
          <NewParentTaskForm />
          <InlineTaskTree tree={tasks} />
        </section>

        <aside className="self-start lg:sticky lg:top-4 border-l pl-4">
          <PriorityTasksPanel />
        </aside>
      </div>
    </div>
  );
};

export default TaskList;
