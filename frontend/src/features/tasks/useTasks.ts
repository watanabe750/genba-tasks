// src/features/tasks/useTasks.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/apiClient";
import type { Task } from "../../types/task";

// ---- 新規: フィルタ型 ----
export type TaskFilters = {
  site?: string;
  status?: string[]; // ["not_started","in_progress","completed"]
  progress_min?: number;
  progress_max?: number;
  order_by?: "deadline" | "progress" | "created_at";
  dir?: "asc" | "desc";
  parents_only?: "1" | "0"; // 親のみ表示
};

// APIの揺れを型で吸収（サーバ側は配列返却でOKだが念のため）
type TasksResponse = Task[] | { tasks: Task[] };
function normalizeTasks(data: TasksResponse): Task[] {
  return Array.isArray(data) ? data : data.tasks;
}

// ---- 新規: フィルタ対応の取得関数 ----
async function fetchTasks(filters?: TaskFilters): Promise<Task[]> {
  // NOTE: APIは /api/tasks を叩く
  const { data } = await api.get<TasksResponse>("/tasks", { params: filters });
  return normalizeTasks(data);
}

// ---- 新規: フィルタ対応フック ----
export function useFilteredTasks(filters: TaskFilters, enabled = true) {
  // filters を queryKey に入れることで操作に応じて自動リフェッチ
  return useQuery<Task[], Error>({
    queryKey: ["tasks", filters],
    queryFn: () => fetchTasks(filters),
    enabled,
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    retry: false,
  });
}

// ---- 既存互換: 引数が boolean のままでも動くように薄ラッパーを残す ----
export function useTasks(enabled: boolean) {
  return useFilteredTasks({}, enabled);
}