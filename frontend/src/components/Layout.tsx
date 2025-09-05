// src/components/Layout.tsx
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import TaskDrawer from "../features/drawer/TaskDrawer";

export default function Layout() {
  return (
    <div className="min-h-screen bg-white">
      {/* 固定ヘッダー（Header 側で fixed h-14） */}
      <Header />
      {/* 固定サイドバー（Sidebar 側で fixed left-0 top-14 w-56 lg:w-64） */}
      <Sidebar />

      {/* コンテンツ領域：固定要素ぶんの余白を確保 */}
      <main className="pt-14 pl-56 lg:pl-64 pr-4 pb-8">
        <Outlet />
      </main>

      {/* ドロワーはポータル描画。コンテキスト配下で常時マウント */}
      <TaskDrawer />
    </div>
  );
}
