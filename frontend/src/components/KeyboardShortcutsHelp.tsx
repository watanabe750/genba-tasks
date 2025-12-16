// components/KeyboardShortcutsHelp.tsx - キーボードショートカット一覧モーダル
import type { Shortcut } from "../hooks/useKeyboardShortcuts";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type ShortcutCategory = {
  title: string;
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
};

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: "基本操作",
    shortcuts: [
      { keys: "F, /", description: "検索ボックスにフォーカス" },
      { keys: "Esc", description: "モーダル/ドロワーを閉じる" },
      { keys: "?", description: "このヘルプを表示" },
      { keys: "N", description: "新規タスクを作成" },
    ],
  },
  {
    title: "ナビゲーション",
    shortcuts: [
      { keys: "G → T", description: "タスク一覧へ移動" },
      { keys: "G → C", description: "カレンダーへ移動" },
      { keys: "G → G", description: "ギャラリーへ移動" },
      { keys: "G → A", description: "アカウント設定へ移動" },
    ],
  },
  {
    title: "フィルター操作",
    shortcuts: [
      { keys: "1", description: "未着手のみ表示" },
      { keys: "2", description: "進行中のみ表示" },
      { keys: "3", description: "完了のみ表示" },
      { keys: "0", description: "フィルターをすべて解除" },
    ],
  },
];

function ShortcutItem({ keys, description }: { keys: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
      <span className="text-sm text-gray-700 dark:text-gray-300">{description}</span>
      <div className="flex gap-1">
        {keys.split(",").map((key, i) => (
          <kbd
            key={i}
            className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm"
          >
            {key.trim()}
          </kbd>
        ))}
      </div>
    </div>
  );
}

export default function KeyboardShortcutsHelp({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            キーボードショートカット
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="閉じる"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            キーボードショートカットを使用して、より効率的に作業できます。
          </p>

          <div className="space-y-6">
            {SHORTCUT_CATEGORIES.map((category) => (
              <div key={category.title}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
                  {category.title}
                </h3>
                <div className="space-y-1">
                  {category.shortcuts.map((shortcut, i) => (
                    <ShortcutItem key={i} {...shortcut} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> キーまたは背景をクリックして閉じる
          </p>
        </div>
      </div>
    </div>
  );
}
