// features/notifications/browserNotification.ts - ブラウザ通知ヘルパー
import type { Notification } from "../../types";

/** ブラウザ通知の許可を取得 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("このブラウザは通知をサポートしていません");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/** ブラウザ通知を送信 */
export function sendBrowserNotification(notification: Notification): void {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const { type, taskTitle, site, deadline, progress } = notification;

  let title = "";
  let body = "";
  let icon = "/icon.svg";

  switch (type) {
    case "deadline_today":
      title = "🔔 期限が今日のタスクがあります";
      body = `${site ? `${site} - ` : ""}${taskTitle}\n進捗: ${progress}%`;
      break;
    case "deadline_tomorrow":
      title = "⚠️ 明日期限のタスクがあります";
      body = `${site ? `${site} - ` : ""}${taskTitle}\n進捗: ${progress}%`;
      break;
    case "deadline_overdue":
      title = "🚨 期限超過のタスクがあります";
      body = `${site ? `${site} - ` : ""}${taskTitle}\n期限: ${deadline}\n進捗: ${progress}%`;
      icon = "/icon-alert.svg";
      break;
  }

  const browserNotification = new Notification(title, {
    body,
    icon,
    badge: "/badge.png",
    tag: `task-${notification.taskId}`,
    requireInteraction: type === "deadline_overdue", // 期限超過は手動で閉じる必要がある
    silent: false,
  });

  browserNotification.onclick = () => {
    window.focus();
    // タスク詳細へ遷移（将来的にはルーティングと連携）
    window.location.hash = `#/tasks?id=${notification.taskId}`;
    browserNotification.close();
  };
}
