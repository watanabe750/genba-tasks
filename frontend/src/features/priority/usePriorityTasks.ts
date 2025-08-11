import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { Task } from "../../types/task";

async function getPriorityTasks(): Promise<Task[]> {
  const res = await axios.get<Task[]>("/api/tasks/priority");
  return res.data;
}

export function usePriorityTasks() {
  return useQuery({
    queryKey: ["priorityTasks"],
    queryFn: getPriorityTasks,
    retry: false,
  });
}