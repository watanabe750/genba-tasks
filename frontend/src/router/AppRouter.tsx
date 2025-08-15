import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import TaskList from "../pages/TaskList";
import Summary from "../pages/Summary";
import Layout from "../components/Layout";
import { AuthProvider } from "../providers/AuthContext";
import RequireAuth from "../components/RequireAuth";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 非ログイン時OK */}
          <Route path="/login" element={<Login />} />

          {/* ここから保護領域 */}
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/tasks" element={<TaskList />} />
              <Route path="/summary" element={<Summary />} />
            </Route>
          </Route>

          {/* デフォルトは /tasks へ */}
          <Route path="*" element={<Login />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};