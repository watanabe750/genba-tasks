// 必要に応じてファイル冒頭に
import api from "../../lib/apiClient";

// 同一親内 並べ替え API
export async function reorderWithinParentApi(
  movingId: number,
  afterId: number | null
) {
  // Rails 側は { after_id } を素で受け取る
  await api.patch(`/tasks/${movingId}/reorder`, { after_id: afterId });
}
