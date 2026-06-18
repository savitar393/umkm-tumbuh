import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import AdminRegistrationsPage from "./features/admin/pages/AdminRegistrationsPage";
import RegistrationDetailPage from "./features/admin/pages/RegistrationDetailPage";
import EditMitraProfilePage from "./features/mitra/pages/EditMitraProfilePage";
import MitraProfilePage from "./features/mitra/pages/MitraProfilePage";
import EditUmkmProfilePage from "./features/umkm/pages/EditUmkmProfilePage";
import UmkmProfilePage from "./features/umkm/pages/UmkmProfilePage";
import UmkmEditPage from "./features/umkm/pages/UmkmEditPage";
import UmkmProductsPage from "./features/umkm/pages/UmkmProductsPage";
import "./App.css";

type CurrentUser = {
  id: string;
  full_name: string;
  email: string;
  role: "UMKM" | "MITRA" | "ADMIN";
  status: "PENDING" | "APPROVED" | "REJECTED";
};

function getCurrentUser(): CurrentUser | null {
  const rawUser = localStorage.getItem("current_user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as CurrentUser;
  } catch {
    return null;
  }
}

function HomePage() {
  return (
    <main className="home-page">
      <section className="hero-card">
        <h1>UMKM Tumbuh</h1>
        <p>
          Platform pengembangan UMKM berbasis pelatihan, kemitraan, dan
          monitoring usaha.
        </p>

        <div className="button-row">
          <Link className="button" to="/login">
            Login
          </Link>
          <Link className="button secondary" to="/register">
            Daftar
          </Link>
        </div>
      </section>
    </main>
  );
}

function RequireAuth({
  children,
  allowedRole,
}: {
  children: ReactNode;
  allowedRole?: CurrentUser["role"];
}) {
  const token = localStorage.getItem("access_token");
  const user = getCurrentUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
    if (user.role === "UMKM") return <Navigate to="/umkm" replace />;
    if (user.role === "MITRA") return <Navigate to="/mitra" replace />;
  }

  return <>{children}</>;
}

function DashboardPage({ title }: { title: string }) {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    navigate("/login");
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <h1>{title}</h1>
        <p>Login sebagai: {user.full_name}</p>
        <p>Role: {user.role}</p>
        <p>Status: {user.status}</p>

        {user.role === "ADMIN" && (
          <Link className="button" to="/admin/registrations">
            Review Pendaftaran
          </Link>
        )}

        {user.role === "MITRA" && (
          <>
            <Link className="button" to="/profile/mitra">
              Profil Mitra
            </Link>
            <Link className="button" to="/mitra/profile">
              Edit Profil (Legacy)
            </Link>
          </>
        )}

        {user.role === "UMKM" && (
          <>
            <Link className="button" to="/profile/umkm">
              Profil UMKM
            </Link>
            <Link className="button" to="/umkm/profile">
              Edit Profil (Legacy)
            </Link>
          </>
        )}

        <button onClick={logout}>Logout</button>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/admin"
        element={
          <RequireAuth allowedRole="ADMIN">
            <DashboardPage title="Dashboard Admin" />
          </RequireAuth>
        }
      />

      <Route
        path="/admin/users/:id"
        element={
          <RequireAuth allowedRole="ADMIN">
            <RegistrationDetailPage />
          </RequireAuth>
        }
      />

      <Route
        path="/admin/registrations/:id"
        element={
          <RequireAuth allowedRole="ADMIN">
            <RegistrationDetailPage />
          </RequireAuth>
        }
      />

      <Route
        path="/admin/registrations"
        element={
          <RequireAuth allowedRole="ADMIN">
            <AdminRegistrationsPage />
          </RequireAuth>
        }
      />

      <Route
        path="/profile/umkm/edit"
        element={
          <RequireAuth allowedRole="UMKM">
            <UmkmEditPage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/umkm"
        element={
          <RequireAuth allowedRole="UMKM">
            <UmkmProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/umkm/products"
        element={
          <RequireAuth allowedRole="UMKM">
            <UmkmProductsPage />
          </RequireAuth>
        }
      />

      <Route
        path="/umkm/profile"
        element={
          <RequireAuth allowedRole="UMKM">
            <EditUmkmProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/umkm"
        element={
          <RequireAuth allowedRole="UMKM">
            <DashboardPage title="Dashboard UMKM" />
          </RequireAuth>
        }
      />

      <Route
        path="/profile/mitra/group"
        element={<RequireAuth allowedRole="MITRA"><MitraProfilePage /></RequireAuth>}
      />
      <Route
        path="/profile/mitra/pic"
        element={<RequireAuth allowedRole="MITRA"><MitraProfilePage /></RequireAuth>}
      />
      <Route
        path="/profile/mitra/bidang"
        element={<RequireAuth allowedRole="MITRA"><MitraProfilePage /></RequireAuth>}
      />
      <Route
        path="/profile/mitra/docs"
        element={<RequireAuth allowedRole="MITRA"><MitraProfilePage /></RequireAuth>}
      />
      <Route
        path="/profile/mitra"
        element={<RequireAuth allowedRole="MITRA"><MitraProfilePage /></RequireAuth>}
      />

      <Route
        path="/mitra/profile"
        element={
          <RequireAuth allowedRole="MITRA">
            <EditMitraProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/mitra"
        element={
          <RequireAuth allowedRole="MITRA">
            <DashboardPage title="Dashboard Mitra" />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
