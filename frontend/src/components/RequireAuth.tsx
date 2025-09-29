import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../providers/useAuth";

const DEMO = import.meta.env.VITE_DEMO_MODE === "true";

export default function RequireAuth() {
  const { authed } = useAuth();
  const loc = useLocation();

  if (DEMO) return <Outlet />;
  if (authed) return <Outlet />;

  try {
    const p = loc.pathname + loc.search + loc.hash;
    if (p.startsWith("/") && !p.startsWith("//") && p !== "/login") {
      sessionStorage.setItem("auth:from", p);
    }
  } catch {}

  return <Navigate to="/login" replace />;
}
