// src/components/Sidebar.tsx
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside
      className={[
        "fixed left-0 top-14",
        // ↓ 幅を細く（旧: w-56 lg:w-64）
        "w-44 md:w-48 lg:w-52",
        "h-[calc(100vh-3.5rem)]",
        "bg-gray-100/80 backdrop-blur-0",
        "border-r shadow-md",
        "overflow-y-auto",
        // ↓ 余白も少しだけ詰める
        "p-3 md:p-3.5",
        "z-40",
      ].join(" ")}
    >
      <nav className="flex flex-col gap-3 text-[14px] md:text-[15px]">
        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            isActive ? "font-semibold text-blue-700" : "hover:underline"
          }
        >
          タスク
        </NavLink>
        <NavLink
          to="/account"
          className={({ isActive }) =>
            isActive ? "font-semibold text-blue-700" : "hover:underline"
          }
        >
          アカウント
        </NavLink>
        <NavLink
          to="/help"
          className={({ isActive }) =>
            isActive ? "font-semibold text-blue-700" : "hover:underline"
          }
        >
          ヘルプ
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
