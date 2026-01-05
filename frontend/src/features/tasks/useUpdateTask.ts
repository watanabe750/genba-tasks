// src/features/tasks/useUpdateTask.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/apiClient";
import type { Task, UpdateTaskPayload } from "../../types";
import { sortFlatForUI } from "../tasks/nest";
import { useToast } from "../../components/ToastProvider";

type UpdateInput = {
  id: number;
  data: Partial<
    Pick<Task, "status" | "progress" | "title" | "deadline" | "parent_id" | "site">
  > & {
    after_id?: number | null;
  };
};

const clamp = (n: number, min = 0, max = 100) => Math.min(Math.max(n, min), max);

/**
 * クエリキーから order_by と dir パラメータを安全に抽出します
 */
function extractQueryParams(key: unknown): { order_by?: string; dir?: "asc" | "desc" } {
  if (!Array.isArray(key) || key.length < 2) {
    return {};
  }
  const params = key[1];
  if (!params || typeof params !== 'object') {
    return {};
  }
  const obj = params as Record<string, unknown>;
  const order_by = typeof obj.order_by === 'string' ? obj.order_by : undefined;
  const dir = obj.dir === 'asc' || obj.dir === 'desc' ? obj.dir : undefined;
  return { order_by, dir };
}

// ★ 渡されたフィールドだけを送る（after_id はトップレベルで送る）
function normalize(data: UpdateInput["data"]) {
  const out: Partial<
    Pick<Task, "status" | "progress" | "title" | "deadline" | "parent_id" | "site">
  > = {};

  if (typeof data.title === "string") out.title = data.title.trim();

  if (data.deadline === null || typeof data.deadline === "string") {
    out.deadline = data.deadline ?? null;
  }

  if (data.site === null || typeof data.site === "string") {
    out.site = data.site ?? null;
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
  const { push } = useToast();

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
        const params = extractQueryParams(key);
        const order_by = params.order_by ?? "deadline";
        const dir = params.dir ?? "asc";
        qc.setQueryData<Task[]>(key, sortFlatForUI(next, order_by, dir));
      });

      return { prevPriority, prevTasksEntries };
    },

    onError: (err, _v, ctx) => {
      if (ctx?.prevPriority) qc.setQueryData(["priorityTasks"], ctx.prevPriority);
      ctx?.prevTasksEntries?.forEach(([key, data]) => {
        if (Array.isArray(key)) {
          qc.setQueryData(key, data);
        }
      });
      push(err instanceof Error ? err.message : "更新に失敗しました", "error");
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
