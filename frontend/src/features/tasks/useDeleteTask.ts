import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/apiClient";
import type { Task } from "../../types/task";
import { useToast } from "../../components/ToastProvider";

async function deleteTaskApi(id: number): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: deleteTaskApi,
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      await qc.cancelQueries({ queryKey: ["priorityTasks"] });

      const prevTasks = qc.getQueryData<Task[]>(["tasks"]) ?? [];
      qc.setQueryData<Task[]>(["tasks"], prevTasks.filter((t) => t.id !== id));

      return { prevTasks };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prevTasks) {
        qc.setQueryData(["tasks"], ctx.prevTasks);
      }
      push(err instanceof Error ? err.message : "削除に失敗しました", "error");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["priorityTasks"] });
    },
  });
}
