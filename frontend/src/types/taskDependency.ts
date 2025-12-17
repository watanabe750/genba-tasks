// types/taskDependency.ts - タスク依存関係の型定義

/** タスク依存関係 */
export type TaskDependency = {
  id: number;
  predecessor_id: number; // 先行タスク（このタスクが完了してから）
  successor_id: number;    // 後続タスク（このタスクを開始できる）
};

/** ガントチャート表示用のタスク拡張 */
export type GanttTask = {
  id: number;
  title: string;
  start_date: string | null;
  deadline: string | null;
  status: string;
  progress: number;
  site: string | null;
  // 計算されるフィールド
  duration_days: number; // 期間（日数）
  earliest_start: string | null; // 依存関係を考慮した最早開始日
  earliest_finish: string | null; // 依存関係を考慮した最早完了日
  latest_start: string | null; // 依存関係を考慮した最遅開始日
  latest_finish: string | null; // 依存関係を考慮した最遅完了日
  slack_days: number; // 余裕日数（遅らせても全体に影響しない日数）
  is_critical: boolean; // クリティカルパス上のタスクか
};
