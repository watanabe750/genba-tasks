import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/apiClient";
import type { Task } from "../../../types/task";

type UpdateInput = { id: number; data: Partial<Pick<Task, "status" | "progress">> };

export function useUpdateTask() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: UpdateInput) => {
            const res = await api.patch(`/api/tasks/${id}`, { task: data });
            return res.data as Task;
        },

        // 楽観的更新:押した瞬間にUIを先に更新
        onMutate: async (vars) => {
            await qc.cancelQueries({ queryKey: ["priorityTasks"] });
            const prev = qc.getQueryData<Task[]>(["priorityTasks"]);
            if (prev) {
                qc.setQueryData<Task[]>(["priorityTasks"],
                    prev.map(t => t.id === vars.id ? { ...t, ...vars.data } as Task : t)
                );
            }
            return { prev };
        },
        // 失敗時はロールバック
        onError: (_err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData(["priorityTasks"], ctx.prev);
        },
        // 成功/失敗に関わらずサーバ値で調合
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["priorityTasks"] });
            qc.invalidateQueries({ queryKey: ["tasks"] });
        },
    });
}