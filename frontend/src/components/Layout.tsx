// src/components/Layout.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import TaskDrawer from "../features/drawer/TaskDrawer";
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useTaskDrawer } from "../features/drawer/useTaskDrawer";

const Layout = () => {
  const navigate = useNavigate();
  const { close: closeDrawer } = useTaskDrawer();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // グローバルショートカット
  useKeyboardShortcuts([
    // ヘルプモーダル
    {
      key: "?",
      description: "キーボードショートカット一覧を表示",
      action: () => setShowShortcutsHelp(true),
    },
    // ナビゲーション（G → X）
    {
      key: "t",
      sequence: ["g", "t"],
      description: "タスク一覧へ移動",
      action: () => navigate("/tasks"),
    },
    {
      key: "c",
      sequence: ["g", "c"],
      description: "カレンダーへ移動",
      action: () => navigate("/calendar"),
    },
    {
      key: "g",
      sequence: ["g", "g"],
      description: "ギャラリーへ移動",
      action: () => navigate("/gallery"),
    },
    {
      key: "a",
      sequence: ["g", "a"],
      description: "アカウント設定へ移動",
      action: () => navigate("/account"),
    },
    // Escでドロワーを閉じる
    {
      key: "Escape",
      description: "ドロワーを閉じる",
      action: () => closeDrawer(),
    },
  ]);

  // Escでヘルプモーダルを閉じる
  useKeyboardShortcuts([
    {
      key: "Escape",
      description: "ヘルプモーダルを閉じる",
      action: () => setShowShortcutsHelp(false),
    },
  ], showShortcutsHelp);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      {/* fixed ヘッダー分の余白を上に、fixed サイドバー分を左に */}
      <div className="flex flex-1 pt-14">
        <Sidebar />
        <main className="flex-1 p-3 md:p-6 md:pl-52 lg:pl-64">
          <Outlet />
        </main>
      </div>
      <TaskDrawer />
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  );
};

export default Layout;
