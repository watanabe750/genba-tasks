import type { ISODateString, Nullable } from "./shared";
export type { Status as TaskStatus, Task as FlatTask, TaskNode as Task } from "../type";
export type TaskStatus = "not_started" | "in_progress" | "completed";

export type Task = {
  id: number;
  title: string;
  description?: string | null;

  status: TaskStatus;
  progress: number;                 // v1はUI計算/固定、のち自動ロールアップ

  deadline: Nullable<ISODateString>;
  site?: string | null;

  user_id: number;
  parent_id?: number | null;

  // UI補助（nest後やD&D中に使う）
  depth?: number;
  children?: Task[];
};

// D&D用の拡張ノード（必要ならこちらをUI側で使う）
export type TreeNode = Task & {
  children?: TreeNode[];
  depth?: number;
};
