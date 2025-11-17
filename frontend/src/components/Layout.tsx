// src/components/Layout.tsx
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import TaskDrawer from "../features/drawer/TaskDrawer";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      {/* fixed ヘッダー分の余白を上に、fixed サイドバー分を左に */}
      <div className="flex flex-1 pt-14">
        <Sidebar />
        <main className="flex-1 p-3 md:p-6 md:pl-52 lg:pl-64">
          <Outlet />
        </main>
      </div>
      <TaskDrawer />
    </div>
  );
};

export default Layout;
