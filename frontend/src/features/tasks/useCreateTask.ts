import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/apiClient";
import type { Task } from "../../types/task";
import { pushSiteHistory } from "../../lib/siteHistory";

export type CreateTaskInput = {
  title: string;
  deadline?: string | null;
  parentId?: number | null;
  site?: string | null;  // 親タスクでは必須
};

async function createTaskApi(input: CreateTaskInput): Promise<Task> {
  const title = input.title.trim();
  if (!title) throw new Error("タイトルは必須です");

  const isParent = input.parentId == null;
  if (isParent && !input.site?.trim()) {
    throw new Error("親タスクには現場名が必須です");
  }

  const payloadNested = {
    task: {
      title,
      status: "in_progress" as const,
      progress: 0,
      deadline: input.deadline ?? null,
      parent_id: input.parentId ?? null,
      ...(isParent ? { site: (input.site ?? "").trim() } : {}),
    },
  };

  const { data } = await api.post<Task>("/tasks", payloadNested);
  return data;
}

export function useCreateTask() {
  const qc = useQueryClient();

  return useMutation<Task, Error, CreateTaskInput, { prevTasks?: Task[]; tempId?: number }>({
    mutationKey: ["createTask"],
    mutationFn: createTaskApi,

    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      await qc.cancelQueries({ queryKey: ["priorityTasks"] });

      const prevTasks = qc.getQueryData<Task[]>(["tasks"]) ?? [];
      const tempId = -Date.now();
      const isParent = input.parentId == null;

      qc.setQueryData<Task[]>(["tasks"], [
        {
          id: tempId,
          title: input.title.trim(),
          status: "in_progress",
          progress: 0,
          deadline: input.deadline ?? null,
          site: isParent ? (input.site ?? null) : null,
          parent_id: input.parentId ?? null,
          depth: isParent ? 1 : undefined,
          children: [],
        } as Task,
        ...prevTasks,
      ]);

      return { prevTasks, tempId };
    },

    onError: (err, _vars, ctx) => {
      if (ctx?.prevTasks) qc.setQueryData(["tasks"], ctx.prevTasks);
      alert(err instanceof Error ? err.message : "作成に失敗しました");
    },

    onSuccess: (created, vars, ctx) => {
      if (vars.parentId == null && created.site) pushSiteHistory(created.site);
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
