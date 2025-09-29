import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import RequireGuest from "./components/RequireGuest";
import Login from "./pages/Login";
import TasksPage from "./pages/TasksPage";

export default function App() {
  return (
    <Routes>
      {/* ゲスト専用（ログイン済なら /tasks へ） */}
      <Route element={<RequireGuest />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* 要ログイン */}
      <Route element={<RequireAuth />}>
        <Route path="/tasks" element={<TasksPage />} />
      </Route>

      {/* ルート直打ちは /tasks に寄せる */}
      <Route path="/" element={<Navigate to="/tasks" replace />} />

      {/* それ以外はログインへ */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
