// src/components/RequireAuth.tsx
import useAuth from "../providers/useAuth";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function RequireAuth() {
  const { authed } = useAuth();
  const loc = useLocation();
  const isDemo = (() => {
    try { return sessionStorage.getItem("auth:demo") === "1" || import.meta.env.VITE_DEMO_LOCAL === "1"; }
    catch { return false; }
  })();

  if (!authed && !isDemo) {
    // 未ログインかつデモでもない → /login
    if (loc.pathname.startsWith("/") && !loc.pathname.startsWith("//") && loc.pathname !== "/login") {
      sessionStorage.setItem("auth:from", loc.pathname);
    }
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
