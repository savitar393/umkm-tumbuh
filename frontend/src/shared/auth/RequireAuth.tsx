import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken, getCurrentUser, getDefaultRouteByRole, type UserRole } from "./currentUser";

type RequireAuthProps = {
  allowedRole?: UserRole;
};

export function RequireAuth({ allowedRole }: RequireAuthProps) {
  const token = getAccessToken();
  const user = getCurrentUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
  }

  return <Outlet />;
}
