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
        setTasks([]); // 保険
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">タスク一覧ページ</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* 右カラム：優先タスク（小画面＝先頭 / LG以上＝右） */}
        <aside className="order-1 lg:order-2 lg:col-span-1 sticky top-4 self-start">
          <PriorityTasksPanel />
        </aside>

        {/* 左カラム：一覧（小画面＝後ろ / LG以上＝左） */}
        <section className="order-2 lg:order-1 lg:col-span-2 space-y-3">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </section>
      </div>
    </div>
  );
}