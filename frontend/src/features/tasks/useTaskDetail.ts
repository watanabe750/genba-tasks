// src/features/tasks/useTaskDetail.ts
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/apiClient";
import type { TaskDetail } from "../../types";

export function useTaskDetail(taskId?: number | null) {
  return useQuery<TaskDetail, unknown>({
    queryKey: ["taskDetail", taskId],   // ← 統一
    enabled: !!taskId,
    retry: false,
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${taskId}`);
      return data as TaskDetail;
    },
  });
}
