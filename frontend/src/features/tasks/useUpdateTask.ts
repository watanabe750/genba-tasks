import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/apiClient";
import type { Task, UpdateTaskPayload } from "../../types";

type UpdateInput = {
  id: number;
  data: Partial<Pick<Task, "status" | "progress" | "title" | "deadline" | "parent_id">>;
};

const clamp = (n: number, min = 0, max = 100) =>
  Math.min(Math.max(n, min), max);

function normalize(data: UpdateInput["data"]) {
  let status = (data.status ?? "in_progress") as Task["status"];
  let progress =
    typeof data.progress === "number" ? clamp(data.progress) : undefined;

  if (status === "completed") progress = 100;
  if (progress === 100) status = "completed";

  const out: Partial<Pick<Task, "status" | "progress" | "title" | "deadline" | "parent_id">> =
    {};
    if (data.title !== undefined) out.title = data.title.trim();
    if (data.deadline === null || typeof data.deadline === "string")
      out.deadline = data.deadline ?? null;
    if (status) out.status = status;
    if (typeof progress === "number") out.progress = progress;
    if (data.parent_id !== undefined) out.parent_id = data.parent_id;

  return out;
}

export function useUpdateTask() {
  const qc = useQueryClient();

  return useMutation<
    Task,
    Error,
    UpdateInput,
    {
      prevPriority?: Task[];
      prevTasksEntries?: [unknown, Task[] | undefined][];
    }
  >({
    mutationKey: ["updateTask"],
    retry: false,
    mutationFn: async ({ id, data }) => {
      const n = normalize(data);
      const payload: UpdateTaskPayload = { task: n };
      const res = await api.patch<Task>(`/tasks/${id}`, payload);
      return res.data;
    },

    onMutate: async ({ id, data }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["priorityTasks"] }),
        qc.cancelQueries({ queryKey: ["tasks"] }),
      ]);

      const prevPriority = qc.getQueryData<Task[]>(["priorityTasks"]);
      const prevTasksEntries = qc.getQueriesData<Task[]>({ queryKey: ["tasks"] });
      const n = normalize(data);

      const patch = (arr?: Task[]) =>
        arr?.map((t) => (t.id === id ? { ...t, ...n } : t));

      if (prevPriority)
        qc.setQueryData<Task[]>(["priorityTasks"], patch(prevPriority));

      prevTasksEntries.forEach(([key, arr]) => {
        if (arr) qc.setQueryData<Task[]>(key as any, patch(arr));
      });
      return { prevPriority, prevTasksEntries };
    },

    onError: (_e, _v, ctx) => {
      if (ctx?.prevPriority)
        qc.setQueryData(["priorityTasks"], ctx.prevPriority);
      ctx?.prevTasksEntries?.forEach(([key, data]) => {
        qc.setQueryData(key as any, data);
      });
      alert("更新に失敗しました");
    },

    onSuccess: (fresh) => {
      const sync = (arr?: Task[]) =>
        arr?.map((t) => (t.id === fresh.id ? fresh : t));

      qc.setQueryData<Task[] | undefined>(["priorityTasks"], (old) => sync(old));
      qc.setQueriesData<Task[]>(
        { queryKey: ["tasks"] },
        (old) => sync(old ?? undefined) as any
      );
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["priorityTasks"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
