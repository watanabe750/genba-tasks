// src/components/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../providers/useAuth";

export default function RequireAuth() {
  const { authed } = useAuth();
  const loc = useLocation();

  if (!authed) {
    // 復帰用の from をセッションに保存（AuthProvider 側でも保存するが念のため）
    try {
      const p = loc.pathname + loc.search + loc.hash;
      if (p.startsWith("/") && !p.startsWith("//")) {
        sessionStorage.setItem("auth:from", p);
      }
    } catch {
      /* ignore */
    }
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
