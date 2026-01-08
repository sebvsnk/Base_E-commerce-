import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import type { Role } from "../features/auth/auth-types";

export default function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { isAuthed, role } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (!role || !roles.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
