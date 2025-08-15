import { useQuery } from "@tanstack/react-query";
import type { Task } from "../../../types/task";
import { api } from "../../../lib/apiClient"

async function getPriorityTasks(): Promise<Task[]> {
    const { data } = await api.get<Task[]>("/tasks/priority");
    return data;
}

export function usePriorityTasks() {
  return useQuery({
    queryKey: ["priorityTasks"],
    queryFn: getPriorityTasks,
    retry: false,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}