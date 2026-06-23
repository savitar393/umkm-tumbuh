import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminRegistrationsPage from "./pages/AdminRegistrationsPage";
import AdminRegistrationDetailPage from "./pages/AdminRegistrationDetailPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminCertificatesPage from "./pages/AdminCertificatesPage";
import ComingSoon from "./components/ComingSoon";

export const adminRoutes: RouteObject[] = [
  {
    index: true,
    element: <AdminDashboardPage />,
  },
  {
    path: "registrations",
    children: [
      { index: true, element: <AdminRegistrationsPage /> },
      { path: ":userId", element: <AdminRegistrationDetailPage /> },
    ],
  },
  {
    path: "users",
    children: [
      { index: true, element: <AdminUsersPage /> },
      { path: ":userId", element: <ComingSoon title="Detail Akun Pengguna" /> },
    ],
  },
  {
    path: "training",
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <ComingSoon title="Dashboard Pelatihan" /> },
      { path: "certificates", element: <AdminCertificatesPage /> },
      { path: "list", element: <ComingSoon title="Daftar Pelatihan" /> },
    ],
  },
];
