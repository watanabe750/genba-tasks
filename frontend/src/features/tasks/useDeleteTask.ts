import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/apiClient";
import type { Task } from "../../types/task";

async function deleteTaskApi(id: number): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

export function useDeleteTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteTaskApi,
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      await qc.cancelQueries({ queryKey: ["priorityTasks"] });

      const prevTasks = qc.getQueryData<Task[]>(["tasks"]) ?? [];
      qc.setQueryData<Task[]>(["tasks"], prevTasks.filter((t) => t.id !== id));

      return { prevTasks };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prevTasks) {
        qc.setQueryData(["tasks"], ctx.prevTasks);
      }
      alert("削除に失敗しました");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["priorityTasks"] });
    },
  });
}
