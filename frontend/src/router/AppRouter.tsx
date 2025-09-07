// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import TaskList from "../pages/TaskList";
import Layout from "../components/Layout";
import RequireAuth from "../components/RequireAuth";
import Account from "../pages/Account";
import Help from "../pages/Help";
import Home from "../pages/Home"; // ★ 追加

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 非ログイン時も見えるページ */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<Navigate to="/login" replace />} />

        {/* 認証ガード配下 */}
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/account" element={<Account />} />
            <Route path="/help" element={<Help />} />
          </Route>
        </Route>

        {/* その他は tasks へ */}
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
