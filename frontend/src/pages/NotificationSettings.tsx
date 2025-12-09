// pages/NotificationSettings.tsx - 通知設定画面
import { Link } from "react-router-dom";
import { useNotifications } from "../features/notifications/useNotifications";

export default function NotificationSettings() {
  const { settings, updateSettings, requestBrowserPermission } = useNotifications();

  const handleBrowserNotificationToggle = async () => {
    if (!settings.browserNotifications) {
      const granted = await requestBrowserPermission();
      if (!granted) {
        alert(
          "ブラウザ通知が許可されていません。ブラウザの設定から通知を許可してください。"
        );
      }
    } else {
      updateSettings({ browserNotifications: false });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-14">
      <div className="max-w-4xl mx-auto p-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link
            to="/tasks"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            タスク一覧に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">通知設定</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            期限が近いタスクや期限超過タスクの通知設定を管理します。
          </p>
        </div>

        {/* 通知全体のON/OFF */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">通知機能</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                タスクの期限通知を有効化します
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => updateSettings({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* ブラウザ通知 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                ブラウザ通知
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                ブラウザのデスクトップ通知を有効化します
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.browserNotifications}
                onChange={handleBrowserNotificationToggle}
                disabled={!settings.enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-slate-600 rounded-full peer peer-disabled:opacity-50 peer-disabled:cursor-not-allowed peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          {settings.browserNotifications && (
            <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded">
              ✓ ブラウザ通知が許可されています
            </div>
          )}
        </div>

        {/* 通知タイミング */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            通知タイミング
          </h2>
          <div className="space-y-4">
            {/* 期限当日 */}
            <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">期限が今日</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">
                  期限が今日のタスクを通知します
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.deadlineToday}
                onChange={(e) => updateSettings({ deadlineToday: e.target.checked })}
                disabled={!settings.enabled}
                className="w-5 h-5 accent-blue-600 disabled:opacity-50"
              />
            </label>

            {/* 期限1日前 */}
            <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">明日が期限</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">
                  明日が期限のタスクを通知します
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.deadlineTomorrow}
                onChange={(e) => updateSettings({ deadlineTomorrow: e.target.checked })}
                disabled={!settings.enabled}
                className="w-5 h-5 accent-blue-600 disabled:opacity-50"
              />
            </label>

            {/* 期限超過 */}
            <label className="flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">期限超過</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">
                  期限を過ぎたタスクを通知します（重要）
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.deadlineOverdue}
                onChange={(e) => updateSettings({ deadlineOverdue: e.target.checked })}
                disabled={!settings.enabled}
                className="w-5 h-5 accent-red-600 disabled:opacity-50"
              />
            </label>
          </div>
        </div>

        {/* 説明 */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            💡 通知について
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• 通知は5分ごとに自動でチェックされます</li>
            <li>• ブラウザを開いている間のみ通知が届きます</li>
            <li>• 同じタスクの重複通知は自動で除外されます</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
