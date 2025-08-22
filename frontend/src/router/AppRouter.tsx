import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import TaskList from "../pages/TaskList";
import Summary from "../pages/Summary";
import Layout from "../components/Layout";
import { AuthProvider } from "../providers/AuthContext";
import RequireAuth from "../components/RequireAuth";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      
        <Routes>
          {/* ログイン画面（テストが参照するのは /login） */}
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<Navigate to="/login" replace />} />

          {/* ここから保護領域 */}
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/tasks" element={<TaskList />} />
              <Route path="/summary" element={<Summary />} />
            </Route>
          </Route>

          {/* デフォルトは /tasks */}
          <Route path="/" element={<Navigate to="/tasks" replace />} />
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
    </BrowserRouter>
  );
};