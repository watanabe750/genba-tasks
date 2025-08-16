// src/features/priority/usePriorityTasks.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/apiClient";
import type { Task } from "../../types/task";

// APIの揺れ（配列 or { tasks: [] }）を型で吸収
type PriorityTasksResponse = Task[] | { tasks: Task[] };
const normalize = (d: PriorityTasksResponse): Task[] =>
  Array.isArray(d) ? d : d.tasks;

async function fetchPriorityTasks(): Promise<Task[]> {
  const { data } = await api.get<PriorityTasksResponse>("/tasks/priority");
  return normalize(data);
}

/** ログイン済みのときだけ enabled=true を渡して使う */
export function usePriorityTasks(enabled = true) {
  return useQuery<Task[], Error>({
    queryKey: ["priorityTasks"],
    queryFn: fetchPriorityTasks,
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}