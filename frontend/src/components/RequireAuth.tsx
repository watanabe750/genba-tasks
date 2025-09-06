// src/components/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../providers/useAuth";

export default function RequireAuth() {
  const { authed } = useAuth();
  const loc = useLocation();

  if (!authed) {
    try {
      const p = loc.pathname + loc.search + loc.hash;
      if (p.startsWith("/") && !p.startsWith("//") && p !== "/login") {
        sessionStorage.setItem("auth:from", p);
      }
    } catch { /* ignore */ }
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
