// types/filter.ts - タスクフィルター関連の型
import type { Status } from "./task";

/** タスクのソート基準 */
export type OrderBy = "deadline" | "progress" | "created_at" | "position";

/** ソート方向 */
export type SortDir = "asc" | "desc";

/** タスク一覧のフィルター条件 */
export type TaskFilters = {
  site?: string; // 現場名でフィルター
  status?: Status[]; // ステータスでフィルター（複数指定可）
  progress_min?: number; // 進捗の最小値（0..100）
  progress_max?: number; // 進捗の最大値（0..100）
  order_by?: OrderBy; // ソート基準
  dir?: SortDir; // ソート方向
  parents_only?: "1"; // 親タスクのみ表示
};
