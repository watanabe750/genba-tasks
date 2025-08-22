// src/pages/TaskList.tsx
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import TaskItem from "../components/TaskItem";
import PriorityTasksPanel from "../features/priority/PriorityTasksPanel";
import { useFilteredTasks } from "../features/tasks/useTasks";
import { useAuth } from "../providers/useAuth";
import { usePriorityTasks } from "../features/priority/usePriorityTasks";
import { nestTasks } from "../features/tasks/nest";
import NewParentTaskForm from "../components/NewParentTaskForm";
import { TaskFilterBar } from "../features/tasks/TaskFilterBar";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

export default function TaskList() {
  const { authed } = useAuth();
  usePriorityTasks(authed); // 読み込み副作用だけ必要なら data を使わなくてもOK
  const [sp] = useSearchParams();
  const rawFilters = {
    site: sp.get("site") || undefined,
    status: sp.getAll("status"),
    progress_min: sp.get("progress_min")
      ? Number(sp.get("progress_min"))
      : undefined,
    progress_max: sp.get("progress_max")
      ? Number(sp.get("progress_max"))
      : undefined,
    order_by:
      (sp.get("order_by") as "deadline" | "progress" | "created_at") ||
      "deadline",
    dir: (sp.get("dir") as "asc" | "desc") || "asc",
    parents_only: sp.get("parents_only") === "1" ? "1" : undefined,
  };
  const filters = useDebouncedValue(rawFilters, 300);
  const { data: tasksFlat = [] } = useFilteredTasks(filters, authed);

  // フラット配列 → ツリー化
  const tasks = useMemo(() => nestTasks(tasksFlat), [tasksFlat]);

  return (
    <div className="max-w-6xl mx-auto p-4" data-testid="task-list-root">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">タスク一覧ページ</h1>
      </div>

      <TaskFilterBar />
      <div className="flex gap-6 items-start">
        <section className="flex-1 space-y-3">
          {/* 親タスク作成フォーム（現場名必須）はここ */}
          <NewParentTaskForm />
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </section>

        <aside className="w-[22rem] shrink-0 sticky top-4 self-start pl-4 border-l">
          <PriorityTasksPanel />
        </aside>
      </div>
    </div>
  );
}
