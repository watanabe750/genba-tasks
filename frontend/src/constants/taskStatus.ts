/**
 * タスクステータスの定義と関連ユーティリティ
 */

import type { Task } from '../types';

/**
 * タスクステータスのラベル定義
 */
export const TASK_STATUS_LABELS = {
  not_started: '未着手',
  in_progress: '進行中',
  completed: '完了',
} as const;

/**
 * タスクステータスの型
 */
export type TaskStatus = Task['status'];

/**
 * ステータス値から表示ラベルを取得します
 * @param status - タスクのステータス
 * @returns ステータスに対応する日本語ラベル
 */
export function getStatusLabel(status: TaskStatus): string {
  return TASK_STATUS_LABELS[status];
}
