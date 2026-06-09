import type { RouteObject } from "react-router-dom";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminRegistrationsPage from "./pages/AdminRegistrationsPage";
import AdminUsersPage from "./pages/AdminUsersPage";

export const adminRoutes: RouteObject[] = [
  {
    index: true,
    element: <AdminDashboardPage />,
  },
  {
    path: "registrations",
    element: <AdminRegistrationsPage />,
  },
  {
    path: "users",
    element: <AdminUsersPage />,
  },
];
