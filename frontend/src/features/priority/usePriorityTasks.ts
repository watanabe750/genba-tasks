// src/features/priority/priority/usePriorityTasks.ts
import { useQuery } from "@tanstack/react-query";
import type { Task } from "../../types/task";
import { api } from "../../lib/apiClient";

// 取得ロジックは関数に切り出して再利用しやすく
async function getPriorityTasks(): Promise<Task[]> {
  const { data } = await api.get<Task[]>("/tasks/priority");
  return data;
}

export function usePriorityTasks(enabled = true) {
  return useQuery<Task[], Error>({
    queryKey: ["priorityTasks"],
    enabled,                // 未ログイン時は問い合わせない
    queryFn: getPriorityTasks,
    staleTime: 30_000,      // 30秒は新鮮扱い（任意）
    retry: false,           // 401等で無限リトライしない
  });
}
