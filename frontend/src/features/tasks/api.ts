// src/features/tasks/api.ts
import api from "../../lib/apiClient";
import type { TaskDetail } from "../../type";

/** 同一親内の並び替えをサーバ永続化 */
export async function reorderWithinParentApi(taskId: number, afterId: number | null) {
  await api.patch(`/tasks/${taskId}`, { after_id: afterId ?? null });
}

/** 親タスクの詳細を取得（ドロワー用） */
export async function getTaskDetail(id: number): Promise<TaskDetail> {
  const { data } = await api.get<TaskDetail>(`/tasks/${id}`);
  return data;
}
