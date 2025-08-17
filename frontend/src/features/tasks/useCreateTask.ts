// src/features/tasks/useCreateTask.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/apiClient";
import type { Task } from "../../types/task";

export type CreateTaskInput = {
  title: string;
  deadline?: string | null;
  parentId?: number | null;
};

// Rails系 strong_params 想定のネスト形式に統一
type NestedPayload = {
  task: {
    title: string;
    status: "in_progress" | "todo" | "completed";
    progress: number;
    deadline: string | null;
    parent_id: number | null;
  };
};

function buildPayload(input: CreateTaskInput): NestedPayload {
  return {
    task: {
      title: input.title.trim(),
      status: "in_progress",
      progress: 0,
      deadline: input.deadline ?? null,
      parent_id: input.parentId ?? null,
    },
  };
}

async function createTaskApi(input: CreateTaskInput): Promise<Task> {
  const payload = buildPayload(input);
  const { data } = await api.post<Task>("/tasks", payload);
  return data;
}

export function useCreateTask() {
  const qc = useQueryClient();

  return useMutation<Task, Error, CreateTaskInput, { prevTasks: Task[]; tempId: number }>({
    mutationFn: createTaskApi,

    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      await qc.cancelQueries({ queryKey: ["priorityTasks"] });

      const prevTasks = qc.getQueryData<Task[]>(["tasks"]) ?? [];
      const tempId = -Date.now();

      const optimistic: Task = {
        id: tempId,
        title: input.title,
        status: "in_progress",
        progress: 0,
        deadline: input.deadline ?? null,
      } as Task;

      qc.setQueryData<Task[]>(["tasks"], [optimistic, ...prevTasks]);
      return { prevTasks, tempId };
    },

    onError: (_err, _input, ctx) => {
      if (ctx?.prevTasks) qc.setQueryData<Task[]>(["tasks"], ctx.prevTasks);
      alert("作成に失敗しました");
    },

    onSuccess: (created, _input, ctx) => {
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