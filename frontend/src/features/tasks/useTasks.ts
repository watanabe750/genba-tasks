import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/apiClient";
import type { Task } from "../../types/task";

// APIの揺れを型で吸収
type TasksResponse = Task[] | { tasks: Task[] };

function normalizeTasks(data: TasksResponse): Task[] {
  return Array.isArray(data) ? data : data.tasks;
}

async function fetchTasks(): Promise<Task[]> {
  const { data } = await api.get<TasksResponse>("/tasks");
  return normalizeTasks(data);
}

export function useTasks(enabled: boolean) {
  return useQuery<Task[], Error>({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    enabled,
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always", 
    retry: false,
  });
}
