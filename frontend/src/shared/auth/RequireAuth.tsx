import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { http, ApiError } from "../api/http";
import {
  clearAuthStorage,
  getAccessToken,
  getCurrentUser,
  getDefaultRouteByRole,
  getRefreshToken,
  getRegistrationStatusRoute,
  isApprovedStatus,
  setAccessToken,
  setCurrentUser,
  setRefreshToken,
  type CurrentUser,
  type UserRole,
} from "./currentUser";

type RequireAuthProps = {
  allowedRole?: UserRole;
};

export function RequireAuth({ allowedRole }: RequireAuthProps) {
  const token = getAccessToken();
  const refreshToken = getRefreshToken();
  const storedUser = getCurrentUser();

  const [user, setUser] = useState<CurrentUser | null>(storedUser);
  const [checking, setChecking] = useState(Boolean((token || refreshToken) && storedUser));

  useEffect(() => {
    let cancelled = false;

    async function refreshSession() {
      if (!refreshToken) {
        clearAuthStorage();
        setUser(null);
        return null;
      }

      const refreshed = await http<{
        access_token: string;
        token_type: string;
        refresh_token?: string;
        user: CurrentUser;
      }>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
        auth: false,
        service: "auth",
      });

      if (cancelled) return null;

      setAccessToken(refreshed.access_token);

      if (refreshed.refresh_token) {
        setRefreshToken(refreshed.refresh_token);
      }

      setCurrentUser(refreshed.user);
      setUser(refreshed.user);

      return refreshed.user;
    }

    async function refreshUser() {
      if (!storedUser) {
        setChecking(false);
        return;
      }

      try {
        if (!token) {
          await refreshSession();
          return;
        }

        const freshUser = await http<CurrentUser>("/auth/me", {
          service: "auth",
        });

        if (cancelled) return;

        setCurrentUser(freshUser);
        setUser(freshUser);
      } catch (err) {
        if (cancelled) return;

        if (err instanceof ApiError && err.status === 401 && refreshToken) {
          try {
            await refreshSession();
            return;
          } catch {
            // fall through to clear auth
          }
        }

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
  }, [token, refreshToken]);

  if (!token && !refreshToken) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
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