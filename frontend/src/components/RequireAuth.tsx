// src/components/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../providers/useAuth";

const DEMO = import.meta.env.VITE_DEMO_MODE === "true";

export default function RequireAuth() {
  const { authed } = useAuth();
  const loc = useLocation();

  // ★ デモモードは未ログインでも通す
  if (DEMO) return <Outlet />;

  if (authed) return <Outlet />;

  // 未ログイン → /login に飛ばす前に戻り先を保存
  try {
    const p = loc.pathname + loc.search + loc.hash;
    if (p.startsWith("/") && !p.startsWith("//") && p !== "/login") {
      sessionStorage.setItem("auth:from", p);
    }
  } catch {
    /* ignore */
  }

  return <Navigate to="/login" replace />;
}
