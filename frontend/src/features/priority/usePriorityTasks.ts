// src/features/priority/usePriorityTasks.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/apiClient";
import type { Task } from "../../types/task";

async function fetchPriorityTasks(): Promise<Task[]> {
  const { data } = await api.get<Task[]>("/tasks/priority");
  return data;
}

export function usePriorityTasks(enabled = true) {
  return useQuery({
    queryKey: ["priorityTasks"],
    queryFn: fetchPriorityTasks,
    enabled,
    // ★ テスト互換のためサーバ更新を自動で拾う
    staleTime: 0,
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });
}
