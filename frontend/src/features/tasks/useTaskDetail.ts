// src/features/tasks/useTaskDetail.ts
import { useQuery } from "@tanstack/react-query";
import { getTaskDetail } from "./api";
import type { TaskDetail } from "../../type";

export function useTaskDetail(id: number | null) {
  return useQuery<TaskDetail, unknown>({
    queryKey: ["task", id],
    queryFn: () => getTaskDetail(id as number),
    enabled: !!id,                 // ★ 遅延fetch（open時のみ）
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
