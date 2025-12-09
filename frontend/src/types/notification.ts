// types/notification.ts - 通知機能の型定義
import type { ISODateString } from "./common";

/** 通知の種類 */
export type NotificationType =
  | "deadline_today" // 期限が今日
  | "deadline_tomorrow" // 期限が明日
  | "deadline_overdue"; // 期限超過

/** 通知データ */
export type Notification = {
  id: string; // UUID
  type: NotificationType;
  taskId: number;
  taskTitle: string;
  site: string | null;
  deadline: ISODateString;
  progress: number; // 0..100
  createdAt: ISODateString;
  read: boolean;
};

/** 通知設定 */
export type NotificationSettings = {
  enabled: boolean; // 通知機能全体のON/OFF
  browserNotifications: boolean; // ブラウザ通知の許可
  deadlineToday: boolean; // 期限当日の通知
  deadlineTomorrow: boolean; // 期限1日前の通知
  deadlineOverdue: boolean; // 期限超過の通知
};

/** デフォルトの通知設定 */
export const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  browserNotifications: false,
  deadlineToday: true,
  deadlineTomorrow: true,
  deadlineOverdue: true,
};
