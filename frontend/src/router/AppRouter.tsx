// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import TaskList from "../pages/TaskList";
import Layout from "../components/Layout";
import RequireAuth from "../components/RequireAuth";
import Account from "../pages/Account";
import Help from "../pages/Help";
import Home from "../pages/Home";
import CalendarPage from "../pages/CalendarPage";
import GalleryPage from "../pages/GalleryPage";
import NotificationSettings from "../pages/NotificationSettings";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 非ログイン時も見えるページ */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* 認証ガード配下（レイアウトも保護下に置く） */}
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/account" element={<Account />} />
            <Route path="/notifications" element={<NotificationSettings />} />
            <Route path="/help" element={<Help />} />
            {/* 保護領域内のフォールバックは /tasks */}
            <Route path="*" element={<Navigate to="/tasks" replace />} />
          </Route>
        </Route>

        {/* ガードの外側のフォールバックは /login（未ログイン時の二段リダイレクト回避） */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
