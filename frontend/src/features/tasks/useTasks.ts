// src/features/tasks/useTasks.ts
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/apiClient";
import type { Task } from "../../types/task";

// helpers
const toNum = (v: string | null) =>
  v != null && v !== "" ? Number(v) : undefined;
const clean = (o: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(o).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  );

// URL クエリ同期で /api/tasks を叩くフック
export function useTasksFromUrl(enabled: boolean = true) {
  const [sp] = useSearchParams();

  // status は複数指定（?status=a&status=b）。重複排除＋ソートで順序を安定化
  const statusRaw = sp.getAll("status");
  const status =
    statusRaw.length ? Array.from(new Set(statusRaw)).sort() : undefined;

  const searchValue = sp.get("search");

  // useMemo で params を安定化させて、React Query が確実に変更を検知するようにする
  const params = useMemo(() => clean({
    status,
    progress_min: toNum(sp.get("progress_min")),
    progress_max: toNum(sp.get("progress_max")),
    order_by: sp.get("order_by") ?? undefined,
    dir: sp.get("dir") ?? undefined,
    parents_only: sp.get("parents_only") === "1" ? "1" : undefined,
    search: searchValue && searchValue.trim() !== "" ? searchValue : undefined,
  }), [status, sp, searchValue]);

  return useQuery<Task[]>({
    queryKey: ["tasks", params],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<Task[]>("/tasks", {
        params,
        paramsSerializer: { indexes: false }, // status[]= の index 付与なし
      });
      return data;
    },
    staleTime: 0,
    refetchOnMount: "always",
    // placeholderData を削除 - フィルター変更時に古いデータを表示し続けないため
  });
}