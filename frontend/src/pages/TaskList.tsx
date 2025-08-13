// src/pages/TaskList.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import TaskItem from "../components/TaskItem";
import type { Task } from "../types/task";
import PriorityTasksPanel from "../features/priority/PriorityTasksPanel";

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    axios
      .get("/api/tasks")
      .then((res) => {
        const payload = res.data;
        const list = Array.isArray(payload) ? payload : payload?.tasks ?? [];
        setTasks(list);
      })
      .catch((err) => {
        console.error("タスク取得失敗:", err);
        setTasks([]);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">タスク一覧ページ</h1>

      {/* ★ここをflex 2カラムに変更 */}
      <div className="flex gap-6 items-start">
        {/* 左：タスク一覧（可変） */}
        <section className="flex-1 space-y-3">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </section>

        {/* 右：優先タスク（固定幅） */}
        <aside className="w-[22rem] shrink-0 sticky top-4 self-start pl-4 border-l">
          <PriorityTasksPanel />
        </aside>
      </div>
    </div>
  );
}
