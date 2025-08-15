import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const { authed } = useAuth();
    const loc = useLocation();
    if (!authed) {
        return <Navigate to="/signin" replace state={{ from: loc }} />;
    }
    return <>{children}</>;
}