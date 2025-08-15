// src/pages/TaskList.tsx
import { useEffect, useState } from "react";
import TaskItem from "../components/TaskItem";
import type { Task } from "../types/task";
import PriorityTasksPanel from "../features/priority/priority/PriorityTasksPanel";
import { api, signIn } from "../lib/apiClient";


export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    (async () => {
      // --- 開発用: 一度サインインしてトークン保存（後でログイン画面ができたら削除） ---

      await signIn("test@example.com", "password"); // ← あなたのテストユーザーに変更

      // --- タスク取得 ---
      const res = await api.get("/tasks"); // baseURLが /api なので "/tasks" でOK
      const payload = res.data;
      const list = Array.isArray(payload) ? payload : payload?.tasks ?? [];
      setTasks(list);
    })().catch((err) => {
      console.error("タスク取得失敗:", err);
      setTasks([]);
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">タスク一覧ページ</h1>
      <div className="flex gap-6 items-start">
        <section className="flex-1 space-y-3">
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