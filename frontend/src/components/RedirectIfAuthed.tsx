import type React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../providers/useAuth";

type RouteState = { from?: { pathname?: string } };

export default function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { authed } = useAuth();
  const loc = useLocation();
  if (authed) {
    const state = (loc.state ?? null) as RouteState | null;
    const to = state?.from?.pathname ?? "/tasks";
    return <Navigate to={to} replace />;
  }
  return <>{children}</>;
}
