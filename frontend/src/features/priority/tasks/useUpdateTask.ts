import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/apiClient";
import type { Task } from "../../../types/task";

type UpdateInput = { id: number; data: Partial<Pick<Task, "status" | "progress">> };

export function useUpdateTask() {
    const qc = useQueryClient();

    return useMutation<Task, Error, UpdateInput, {
        prevPriority?: Task[];
        prevTasks?: Task[];
      }>({
        mutationKey: ["updateTask"],
        mutationFn: async ({ id, data }) => {
          const res = await api.patch<Task>(`/tasks/${id}`, { task: data });
          return res.data; // Task
        },

        // 押した瞬間に両方のキャッシュを先更新
    onMutate: async (vars) => {
        await Promise.all([
          qc.cancelQueries({ queryKey: ["priorityTasks"] }),
          qc.cancelQueries({ queryKey: ["tasks"] }),
        ]);
  
        const prevPriority = qc.getQueryData<Task[]>(["priorityTasks"]);
        const prevTasks    = qc.getQueryData<Task[]>(["tasks"]);
  
        const patch = (arr?: Task[]) =>
          arr?.map((t) => (t.id === vars.id ? { ...t, ...vars.data } : t));
  
        if (prevPriority) qc.setQueryData<Task[]>(["priorityTasks"], patch(prevPriority));
        if (prevTasks)    qc.setQueryData<Task[]>(["tasks"], patch(prevTasks));
  
        return { prevPriority, prevTasks };
      },
  
      // 失敗したらロールバック
      onError: (_err, _vars, ctx) => {
        if (ctx?.prevPriority) qc.setQueryData(["priorityTasks"], ctx.prevPriority);
        if (ctx?.prevTasks)    qc.setQueryData(["tasks"], ctx.prevTasks);
      },
  
      // 成功したらサーバ値で両方を同期
      onSuccess: (fresh) => {
        const sync = (arr?: Task[]) =>
          arr?.map((t) => (t.id === fresh.id ? fresh : t));
  
        qc.setQueryData<Task[] | undefined>(["priorityTasks"], (old) => sync(old));
        qc.setQueryData<Task[] | undefined>(["tasks"],         (old) => sync(old));
      },
  
      // 念のため再取得
      onSettled: () => {
        qc.invalidateQueries({ queryKey: ["priorityTasks"] });
        qc.invalidateQueries({ queryKey: ["tasks"] });
      },
    });
  }