// src/features/tasks/api.ts
import api from "../../lib/apiClient";

/** 同一親内の並び替えをサーバ永続化 */
export async function reorderWithinParentApi(taskId: number, afterId: number | null) {
  await api.patch(`/tasks/${taskId}/reorder`, {}, { params: { after_id: afterId } });
}
