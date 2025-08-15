import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";

export default function RequireAuth() {
  const { authed } = useAuth();
  const loc = useLocation();
  if (!authed) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  return <Outlet />;
}