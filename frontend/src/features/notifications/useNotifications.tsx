// features/notifications/useNotifications.tsx - 通知コンテキストとフック
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  Notification,
  NotificationSettings,
  Task,
} from "../../types";
import { defaultNotificationSettings } from "../../types";
import api from "../../lib/apiClient";
import { generateNotifications, deduplicateNotifications } from "./notificationUtils";
import { sendBrowserNotification, requestNotificationPermission } from "./browserNotification";

const STORAGE_KEY_NOTIFICATIONS = "genba_tasks_notifications";
const STORAGE_KEY_SETTINGS = "genba_tasks_notification_settings";
const CHECK_INTERVAL = 5 * 60 * 1000; // 5分ごとにチェック

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  requestBrowserPermission: () => Promise<boolean>;
  checkForNewNotifications: () => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);

  // 通知用にフィルタなしで全タスクを取得
  const { data: tasksData } = useQuery<Task[]>({
    queryKey: ["tasks-for-notifications"],
    queryFn: async () => {
      const { data } = await api.get<Task[]>("/tasks");
      return data;
    },
    enabled: settings.enabled,
    refetchInterval: CHECK_INTERVAL,
    staleTime: CHECK_INTERVAL,
  });

  // localStorageから通知を読み込み
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("通知の読み込みに失敗しました:", error);
      }
    }
  }, []);

  // localStorageから設定を読み込み
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        setSettings({ ...defaultNotificationSettings, ...JSON.parse(stored) });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("通知設定の読み込みに失敗しました:", error);
      }
    }
  }, []);

  // localStorageに通知を保存
  useEffect(() => {
    try {
      // 最新20件のみ保存
      const toSave = notifications.slice(0, 20);
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(toSave));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("通知の保存に失敗しました:", error);
      }
    }
  }, [notifications]);

  // 新しい通知をチェック
  const checkForNewNotifications = useCallback(() => {
    if (!settings.enabled || !tasksData) {
      return;
    }

    const tasks: Task[] = tasksData || [];
    const newNotifications = generateNotifications(tasks);

    // 設定に基づいてフィルタリング
    const filtered = newNotifications.filter((notif) => {
      switch (notif.type) {
        case "deadline_today":
          return settings.deadlineToday;
        case "deadline_tomorrow":
          return settings.deadlineTomorrow;
        case "deadline_overdue":
          return settings.deadlineOverdue;
        default:
          return false;
      }
    });

    // 既存の通知と重複しないものだけ追加
    setNotifications((prev) => {
      const existingKeys = new Set(
        prev.map((n) => `${n.type}-${n.taskId}`)
      );
      const toAdd = filtered.filter(
        (n) => !existingKeys.has(`${n.type}-${n.taskId}`)
      );

      if (toAdd.length === 0) {
        return prev;
      }

      // ブラウザ通知を送信
      if (settings.browserNotifications) {
        toAdd.forEach((notif) => {
          sendBrowserNotification(notif);
        });
      }

      return deduplicateNotifications([...toAdd, ...prev]);
    });
  }, [settings, tasksData]);

  // 定期的にチェック
  useEffect(() => {
    if (!settings.enabled) {
      return;
    }

    checkForNewNotifications();
    const intervalId = setInterval(checkForNewNotifications, CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [settings.enabled, checkForNewNotifications]);

  // 未読数を計算
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const updateSettings = useCallback(
    (newSettings: Partial<NotificationSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        try {
          localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error("通知設定の保存に失敗しました:", error);
          }
        }
        return updated;
      });
    },
    []
  );

  const requestBrowserPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      updateSettings({ browserNotifications: true });
    }
    return granted;
  }, [updateSettings]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    settings,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updateSettings,
    requestBrowserPermission,
    checkForNewNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
}
