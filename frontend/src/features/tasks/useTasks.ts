// src/features/tasks/useTasks.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/apiClient";
import type { Task } from "../../types/task";

type Filters = {
  site?: string;
  status?: string[];          // ["not_started", ...]
  progress_min?: number;
  progress_max?: number;
  order_by?: "deadline" | "progress" | "created_at";
  dir?: "asc" | "desc";
  parents_only?: "1";
};

function cleanParams(p: Filters) {
  const q: Record<string, any> = {};
  if (p.site) q.site = p.site;
  if (p.status && p.status.length > 0) q.status = p.status;
  if (typeof p.progress_min === "number") q.progress_min = p.progress_min;
  if (typeof p.progress_max === "number") q.progress_max = p.progress_max;
  if (p.order_by) q.order_by = p.order_by;
  if (p.dir) q.dir = p.dir;
  if (p.parents_only === "1") q.parents_only = "1";
  return q;
}

export function useFilteredTasks(filters: Filters, enabled = true) {
  return useQuery<Task[]>({
    queryKey: ["tasks", filters],
    enabled,
    queryFn: async () => {
      const params = cleanParams(filters);
      const { data } = await api.get<Task[]>("/tasks", {
        params,
        // status[]=... を indices なしで出す
        paramsSerializer: { indexes: false },
      });
      return data;
    },
    staleTime: 30_000,
  });
}

export function useSites(enabled = true) {
  return useQuery<string[]>({
    queryKey: ["taskSites"],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<string[]>("/tasks/sites");
      return data;
    },
    staleTime: 5 * 60_000,
  });
}
