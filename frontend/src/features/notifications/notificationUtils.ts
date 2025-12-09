// features/notifications/notificationUtils.ts - 期限チェックロジック
import type { Task, Notification, NotificationType } from "../../types";

/** 日付を YYYY-MM-DD 形式に変換 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** タスクの期限から通知タイプを判定 */
export function getNotificationType(
  task: Task
): NotificationType | null {
  if (!task.deadline || task.status === "completed") {
    return null;
  }

  const today = formatDate(new Date());
  const tomorrow = formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const deadline = task.deadline.split("T")[0];

  if (deadline < today) {
    return "deadline_overdue";
  }
  if (deadline === today) {
    return "deadline_today";
  }
  if (deadline === tomorrow) {
    return "deadline_tomorrow";
  }

  return null;
}

/** タスクから通知を生成 */
export function createNotification(task: Task): Notification | null {
  const type = getNotificationType(task);
  if (!type) {
    return null;
  }

  return {
    id: `${type}-${task.id}-${Date.now()}`,
    type,
    taskId: task.id,
    taskTitle: task.title,
    site: task.site,
    deadline: task.deadline!,
    progress: task.progress,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

/** タスクリストから通知を生成 */
export function generateNotifications(tasks: Task[]): Notification[] {
  const notifications: Notification[] = [];

  for (const task of tasks) {
    const notification = createNotification(task);
    if (notification) {
      notifications.push(notification);
    }
  }

  return notifications;
}

/** 通知の重複をチェック（同じタスクで同じタイプの通知は1つのみ） */
export function deduplicateNotifications(
  notifications: Notification[]
): Notification[] {
  const seen = new Set<string>();
  const unique: Notification[] = [];

  for (const notif of notifications) {
    const key = `${notif.type}-${notif.taskId}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(notif);
    }
  }

  return unique;
}
