import type { RouteObject } from "react-router-dom";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminRegistrationsPage from "./pages/AdminRegistrationsPage";
import AdminRegistrationDetailPage from "./pages/AdminRegistrationDetailPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminCertificatesPage from "./pages/AdminCertificatesPage";
import AdminTrainingEvaluationPage from "./pages/AdminTrainingEvaluationPage";
import AdminTrainingManagePage from "./pages/AdminTrainingManagePage";
import AdminTrainingFormPage from "./pages/AdminTrainingFormPage";
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
      { index: true, element: <AdminTrainingManagePage /> },
      { path: "new", element: <AdminTrainingFormPage /> },
      { path: ":id/edit", element: <AdminTrainingFormPage /> },
      { path: "evaluation", element: <AdminTrainingEvaluationPage /> },
      { path: "certificates", element: <AdminCertificatesPage /> },
    ],
  },
];
