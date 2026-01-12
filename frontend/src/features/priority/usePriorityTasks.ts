// src/features/priority/usePriorityTasks.ts
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/apiClient";
import type { Task } from "../../types/task";

async function fetchPriorityTasks(limit: number): Promise<Task[]> {
  const { data } = await api.get<Task[]>("/tasks/priority", {
    params: { limit },
  });
  return data;
}

export function usePriorityTasks(limit: number, enabled = true) {
  return useQuery({
    queryKey: ["priorityTasks", limit],
    queryFn: () => fetchPriorityTasks(limit),
    enabled,
    staleTime: 0,
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });
}
