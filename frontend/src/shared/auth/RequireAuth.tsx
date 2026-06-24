import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { http } from "../api/http";
import {
  clearAuthStorage,
  getAccessToken,
  getCurrentUser,
  getDefaultRouteByRole,
  getRegistrationStatusRoute,
  isApprovedStatus,
  setCurrentUser,
  type CurrentUser,
  type UserRole,
} from "./currentUser";

type RequireAuthProps = {
  allowedRole?: UserRole;
};

export function RequireAuth({ allowedRole }: RequireAuthProps) {
  const token = getAccessToken();
  const storedUser = getCurrentUser();

  const [user, setUser] = useState<CurrentUser | null>(storedUser);
  const [checking, setChecking] = useState(Boolean(token && storedUser));

  useEffect(() => {
    let cancelled = false;

    async function refreshUser() {
      if (!token || !storedUser) {
        setChecking(false);
        return;
      }

      try {
        const freshUser = await http<CurrentUser>("/auth/me", {
          service: "auth",
        });

        if (cancelled) return;

        setCurrentUser(freshUser);
        setUser(freshUser);
      } catch {
        if (cancelled) return;

        clearAuthStorage();
        setUser(null);
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    refreshUser();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (checking) {
    return (
      <main className="register-detail-page">
        <section className="register-detail-shell">
          <div className="register-detail-card">
            <div className="form-alert success">Memeriksa sesi pengguna...</div>
          </div>
        </section>
      </main>
    );
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
  }

  if (
    allowedRole &&
    (allowedRole === "UMKM" || allowedRole === "MITRA") &&
    !isApprovedStatus(user.status)
  ) {
    return <Navigate to={getRegistrationStatusRoute(user)} replace />;
  }

  return <Outlet />;
}