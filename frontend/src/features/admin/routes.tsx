import type { RouteObject } from "react-router-dom";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminRegistrationsPage from "./pages/AdminRegistrationsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminCertificatesPage from "./pages/AdminCertificatesPage";
import AdminTrainingEvaluationPage from "./pages/AdminTrainingEvaluationPage";
import AdminTrainingManagePage from "./pages/AdminTrainingManagePage";
import ComingSoon from "./components/ComingSoon";

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
  {
    path: "training",
    children: [
      { index: true, element: <AdminTrainingManagePage /> },
      { path: "evaluation", element: <AdminTrainingEvaluationPage /> },
      { path: "certificates", element: <AdminCertificatesPage /> },
    ],
  },
];
