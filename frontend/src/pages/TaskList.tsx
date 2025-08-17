// src/pages/TaskList.tsx
  import { useState } from "react";
  import TaskItem from "../components/TaskItem";
  import type { Task } from "../types/task";
  import PriorityTasksPanel from "../features/priority/PriorityTasksPanel";
  import { useTasks } from "../features/tasks/useTasks";
  import { useAuth } from "../providers/useAuth";
  import NewTaskButton from "../components/NewTaskButton";

export default function TaskList() {
  const { authed } = useAuth();
  const { data: tasks = [] } = useTasks(authed);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">タスク一覧ページ</h1>
        <NewTaskButton />
      </div>
      <div className="flex gap-6 items-start">
        <section className="flex-1 space-y-3">
          {tasks.map((task: Task) => (
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