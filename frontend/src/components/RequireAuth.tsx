import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../providers/useAuth";

export default function RequireAuth() {
  const { authed } = useAuth();
  const location = useLocation();

  if (!authed) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: { pathname: location.pathname } }}
      />
    );
  }
  return <Outlet />;
}