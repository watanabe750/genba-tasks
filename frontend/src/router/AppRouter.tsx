// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import TaskList from "../pages/TaskList";
import Summary from "../pages/Summary";
import Layout from "../components/Layout";
import RequireAuth from "../components/RequireAuth";
import RedirectIfAuthed from "../components/RedirectIfAuthed";

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      {/* 非ログインOK */}
      <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
      <Route path="/signin" element={<Navigate to="/login" replace />} />

      {/* 認証必須 */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/tasks" element={<TaskList />} />
          <Route path="/summary" element={<Summary />} />
        </Route>
      </Route>

      {/* フォールバック */}
      <Route path="/" element={<Navigate to="/tasks" replace />} />
      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  </BrowserRouter>
);
