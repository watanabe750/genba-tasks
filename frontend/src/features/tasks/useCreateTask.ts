import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/apiClient";
import type { Task } from "../../types/task";

type CreateTaskInput = {
  title: string;
  deadline?: string | null;
  parentId?: number | null;
};

async function createTaskApi(input: CreateTaskInput): Promise<Task> {
  const payload = {
    task: {
      title: input.title,
      status: "in_progress" as const,
      progress: 0,
      deadline: input.deadline ?? null,
      parent_id: input.parentId ?? null,
    },
  };
  const { data } = await api.post<Task>("/tasks", payload);
  return data;
}

export function useCreateTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createTaskApi,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]) ?? [];

      const tempId = -Date.now();
      const optimistic: Task = {
        id: tempId,
        title: input.title,
        status: "in_progress",
        progress: 0,
        deadline: input.deadline ?? null,
        parent_id: input.parentId ?? null,
        // children/depth は nest で付くので不要
      };

      qc.setQueryData<Task[]>(["tasks"], [optimistic, ...prev]);
      return { prev, tempId };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
      alert("作成に失敗しました");
    },
    onSuccess: (created, _vars, ctx) => {
      if (ctx?.tempId != null) {
        qc.setQueryData<Task[]>(["tasks"], (cur) =>
          (cur ?? []).map((t) => (t.id === ctx.tempId ? created : t))
        );
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["priorityTasks"] });
    },
  });
}
