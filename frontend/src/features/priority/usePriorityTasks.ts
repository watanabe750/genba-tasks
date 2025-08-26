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
    staleTime: 30_000,
  });
}
