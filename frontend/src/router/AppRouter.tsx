// src/router/AppRouter.tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import RequireAuth from "../components/RequireAuth";
import { LoadingFallback } from "../components/LoadingFallback";

// Code splitting: 遅延ロードするページコンポーネント
const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const TaskList = lazy(() => import("../pages/TaskList"));
const CalendarPage = lazy(() => import("../pages/CalendarPage"));
const GalleryPage = lazy(() => import("../pages/GalleryPage"));
const GanttPage = lazy(() => import("../pages/GanttPage"));
const Account = lazy(() => import("../pages/Account"));
const NotificationSettings = lazy(() => import("../pages/NotificationSettings"));
const Help = lazy(() => import("../pages/Help"));

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
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
              <Route path="/gantt" element={<GanttPage />} />
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
      </Suspense>
    </BrowserRouter>
  );
};
