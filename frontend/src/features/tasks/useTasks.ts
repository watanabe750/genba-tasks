import { useQuery } from "@tanstack/react-query";
import api from "../../lib/apiClient";
import type { Task, TaskFilters } from "../../types";

function cleanParams(p: TaskFilters) {
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

export function useFilteredTasks(filters: TaskFilters, enabled = true) {
  return useQuery<Task[]>({
    queryKey: ["tasks", filters],
    enabled,
    queryFn: async () => {
      const params = cleanParams(filters);
      const { data } = await api.get<Task[]>("/tasks", {
        params,
        paramsSerializer: { indexes: false }, // status[]= を indices なしで
      });
      return data;
    },
    staleTime: 30_000,
  });
}
