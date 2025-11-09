// src/features/tasks/useUpdateTask.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/apiClient";
import type { Task, UpdateTaskPayload } from "../../types";
import { sortFlatForUI } from "../tasks/nest";

type UpdateInput = {
  id: number;
  data: Partial<
    Pick<Task, "status" | "progress" | "title" | "deadline" | "parent_id">
  > & {
    after_id?: number | null;
  };
};

const clamp = (n: number, min = 0, max = 100) => Math.min(Math.max(n, min), max);

// ★ 渡されたフィールドだけを送る（after_id はトップレベルで送る）
function normalize(data: UpdateInput["data"]) {
  const out: Partial<
    Pick<Task, "status" | "progress" | "title" | "deadline" | "parent_id">
  > = {};

  if (typeof data.title === "string") out.title = data.title.trim();

  if (data.deadline === null || typeof data.deadline === "string") {
    out.deadline = data.deadline ?? null;
  }

  if (data.status) {
    out.status = data.status;
    // progress未指定なら status に合わせて 100/0 を補完
    if (typeof data.progress !== "number") {
      out.progress = data.status === "completed" ? 100 : 0;
    }
  }

  if (typeof data.progress === "number") {
    out.progress = clamp(data.progress);
    if (out.progress === 100 && !out.status) out.status = "completed";
  }

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
      if ("after_id" in data) {
        const res = await api.patch<Task>(`/tasks/${id}`, {
          after_id: data.after_id ?? null,
        });
        return res.data;
      } else {
        const n = normalize(data);
        const payload: UpdateTaskPayload = { task: n };
        const res = await api.patch<Task>(`/tasks/${id}`, payload);
        return res.data;
      }
    },

    onMutate: async ({ id, data }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["priorityTasks"] }),
        qc.cancelQueries({ queryKey: ["tasks"] }),
      ]);

      const prevPriority = qc.getQueryData<Task[]>(["priorityTasks"]);
      const prevTasksEntries = qc.getQueriesData<Task[]>({ queryKey: ["tasks"] });

      // 並び替え（after_id）のときは楽観更新しない（サーバ順をソースオブトゥルースに）
      if ("after_id" in data) {
        return { prevPriority, prevTasksEntries };
      }

      const n = normalize(data);
      const patch = (arr?: Task[]) => arr?.map((t) => (t.id === id ? { ...t, ...n } : t));

      // 優先タスク（右パネル）：完了は即時除外＋UI順に並べ替え
      if (prevPriority) {
        const next = patch(prevPriority) ?? prevPriority;
        const filtered = next.filter((t) => t.status !== "completed");
        qc.setQueryData<Task[]>(["priorityTasks"], sortFlatForUI(filtered));
      }

      // 一覧（クエリごとに order_by/dir が違う可能性がある）
      prevTasksEntries.forEach(([key, arr]) => {
        if (!arr) return;
        const next = patch(arr) ?? arr;
        const k = key as readonly unknown[];
        const params = (k?.[1] ?? {}) as { order_by?: string; dir?: "asc" | "desc" };
        const order_by = params.order_by ?? "deadline";
        const dir = (params.dir as "asc" | "desc") ?? "asc";
        qc.setQueryData<Task[]>(key, sortFlatForUI(next, order_by, dir));
      });

      return { prevPriority, prevTasksEntries };
    },

    onError: (_e, _v, ctx) => {
      if (ctx?.prevPriority) qc.setQueryData(["priorityTasks"], ctx.prevPriority);
      ctx?.prevTasksEntries?.forEach(([key, data]) => {
        if (Array.isArray(key)) {
          qc.setQueryData(key, data);
        }
      });
      alert("更新に失敗しました");
    },

    onSuccess: (fresh) => {
      // フィールド更新はローカルも同期、並び替えはinvalidateで再取得に任せる
      const sync = (arr?: Task[]) => arr?.map((t) => (t.id === fresh.id ? fresh : t));
      qc.setQueryData<Task[] | undefined>(["priorityTasks"], (old) => sync(old));
      qc.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) => sync(old ?? undefined));
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["priorityTasks"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
