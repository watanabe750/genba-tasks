// src/components/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../providers/useAuth";

const DEMO_BUILD = import.meta.env.VITE_DEMO_MODE === "true";

function isDemoSession() {
  try {
    return sessionStorage.getItem("auth:demo") === "1";
  } catch {
    return false;
  }
}

export default function RequireAuth() {
  const { authed } = useAuth();
  const loc = useLocation();

  // ① ビルド時に DEMO モード  ② セッションに demo フラグ のどちらかで許可
  const allow = authed || DEMO_BUILD || isDemoSession();

  if (!allow) {
    const p = loc.pathname + loc.search;
    if (p.startsWith("/") && !p.startsWith("//") && p !== "/login") {
      try {
        sessionStorage.setItem("auth:from", p);
      } catch {}
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
