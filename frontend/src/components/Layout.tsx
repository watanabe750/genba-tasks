// src/components/Layout.tsx
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

// ★ 追加: ドロワー本体をグローバルにマウント
import TaskDrawer from "../features/drawer/TaskDrawer";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="p-6 flex-1">
          <Outlet />
        </main>
      </div>

      {/* ドロワーはポータルで body に描画されるが、コンテキスト配下で
         常時マウントしておく必要がある */}
      <TaskDrawer />
    </div>
  );
};

export default Layout;
