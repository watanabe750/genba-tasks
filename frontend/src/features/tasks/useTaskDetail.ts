// src/features/tasks/useTaskDetail.ts
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/apiClient";
import type { TaskDetail } from "../../types";

export function useTaskDetail(taskId?: number | null) {
  return useQuery<TaskDetail, unknown>({
    queryKey: ["task", taskId],
    enabled: !!taskId,
    retry: false, // 404・5xxで連続リトライしてトースト連打を防ぐ
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${taskId}`);
      return data as TaskDetail;
    },
  });
}
