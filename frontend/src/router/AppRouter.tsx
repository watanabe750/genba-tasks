// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import TaskList from "../pages/TaskList";
import Layout from "../components/Layout";
import RequireAuth from "../components/RequireAuth";
import Account from "../pages/Account";
import Help from "../pages/Help";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<Navigate to="/login" replace />} />

        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/account" element={<Account />} />
            <Route path="/help" element={<Help />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
