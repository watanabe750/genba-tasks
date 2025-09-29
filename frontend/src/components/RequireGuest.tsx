import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../providers/useAuth";

export default function RequireGuest() {
  const { authed } = useAuth();
  if (authed) return <Navigate to="/tasks" replace />;
  return <Outlet />;
}
