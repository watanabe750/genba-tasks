// features/gantt/useTaskDependencies.ts - タスク依存関係の取得・操作フック
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/apiClient";
import type { TaskDependency } from "../../types";

// 依存関係一覧を取得
export function useTaskDependencies() {
  return useQuery({
    queryKey: ["task_dependencies"],
    queryFn: async () => {
      const response = await api.get<TaskDependency[]>("/api/task_dependencies");
      return response.data;
    },
  });
}

// 依存関係を作成
export function useCreateTaskDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { predecessor_id: number; successor_id: number }) => {
      const response = await api.post<TaskDependency>("/api/task_dependencies", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_dependencies"] });
    },
  });
}

// 依存関係を削除
export function useDeleteTaskDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/task_dependencies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_dependencies"] });
    },
  });
}
