// types/task.ts - タスクドメイン型
import type { ISODateString } from "./common";

/** タスクのステータス */
export type Status = "not_started" | "in_progress" | "completed";

/** API から返されるタスク（フラット構造） */
export type Task = {
  id: number;
  title: string;
  description?: string | null;
  status: Status;
  progress: number; // 0..100
  deadline: ISODateString | null;
  site: string | null; // 子タスクでは null が許容される
  parent_id: number | null; // 親タスクの場合は null
};

/** UI 用のタスクツリーノード */
export type TaskNode = Task & {
  depth?: number; // UI 計算用の深さ
  children?: TaskNode[]; // 子タスクのツリー
};

/** 直下の子タスクのプレビュー情報（0〜4件想定） */
export type ChildPreview = {
  id: number;
  title: string;
  status: Status;
  progress_percent: number; // 0..100（ロールアップまたは子の進捗）
  deadline: ISODateString | null;
};

/** タスク詳細情報（ドロワー表示用） */
export type TaskDetail = {
  id: number;
  title: string;
  description?: string | null;
  status: Status;
  site: string | null;
  deadline: ISODateString | null;

  // 親視点のロールアップ進捗（0..100）
  progress_percent: number;

  // 直下の子タスクのサマリ
  children_count: number;
  children_done_count: number;

  // 孫タスクは件数のみ（名前は表示しない）
  grandchildren_count?: number;

  // 直下の子タスクのプレビュー（最大4件）
  children_preview?: ChildPreview[];

  // 親タスクのみ1枚の画像（署名付きURL or null）
  image_url?: string | null;
  image_thumb_url?: string | null;

  // 監査情報
  created_by_name: string;
  created_at: ISODateString;
  updated_at: ISODateString;
};
