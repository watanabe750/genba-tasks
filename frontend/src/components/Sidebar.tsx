import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside
      className={[
        "fixed left-0 top-14",
        "w-56 lg:w-64",
        "h-[calc(100vh-3.5rem)]",
        "bg-gray-100/80 backdrop-blur-0",
        "border-r shadow-md",          // ← 影を追加
        "overflow-y-auto",
        "p-4",
        "z-40",
      ].join(" ")}
    >
      <nav className="flex flex-col gap-4 text-[15px]">
        <NavLink to="/tasks" className={({isActive}) => isActive ? "font-semibold text-blue-700" : "hover:underline"}>
          タスク
        </NavLink>
        <NavLink to="/account" className={({isActive}) => isActive ? "font-semibold text-blue-700" : "hover:underline"}>
          アカウント
        </NavLink>
        <NavLink to="/help" className={({isActive}) => isActive ? "font-semibold text-blue-700" : "hover:underline"}>
          ヘルプ
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
