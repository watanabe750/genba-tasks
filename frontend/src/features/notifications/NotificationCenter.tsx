// features/notifications/NotificationCenter.tsx - 通知センターUI
import { useEffect, useRef } from "react";
import type { Notification } from "../../types";
import { useNotifications } from "./useNotifications";

type NotificationCenterProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const panelRef = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 max-h-[600px] bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden z-50"
    >
      {/* ヘッダー */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 text-white flex items-center justify-between">
        <h3 className="font-semibold text-sm">通知 ({unreadCount})</h3>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
            >
              すべて既読
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (confirm("すべての通知を削除しますか？")) {
                  clearAll();
                }
              }}
              className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
            >
              すべて削除
            </button>
          )}
        </div>
      </div>

      {/* 通知リスト */}
      <div className="max-h-[520px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-slate-400">
            <svg
              className="w-16 h-16 mx-auto mb-3 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="text-sm">通知はありません</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={() => markAsRead(notification.id)}
              onDelete={() => deleteNotification(notification.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

type NotificationItemProps = {
  notification: Notification;
  onRead: () => void;
  onDelete: () => void;
};

function NotificationItem({ notification, onRead, onDelete }: NotificationItemProps) {
  const { type, taskTitle, site, deadline, progress, read } = notification;

  const typeConfig = {
    deadline_today: {
      icon: "🔔",
      label: "期限が今日",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    deadline_tomorrow: {
      icon: "⚠️",
      label: "明日が期限",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
    },
    deadline_overdue: {
      icon: "🚨",
      label: "期限超過",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={`px-4 py-3 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${
        !read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""
      }`}
      onClick={() => {
        if (!read) onRead();
        // タスク詳細へ遷移（将来的にはルーティングと連携）
        window.location.hash = `#/tasks?id=${notification.taskId}`;
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`text-2xl ${config.bgColor} rounded-full p-2 leading-none`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
            {!read && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {taskTitle}
          </h4>
          {site && (
            <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">{site}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-slate-400">
            <span>期限: {deadline.split("T")[0]}</span>
            <span>進捗: {progress}%</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          aria-label="削除"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
