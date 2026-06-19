import { Navigate, useRoutes, type RouteObject } from "react-router-dom";
import { RequireAuth } from "../shared/auth/RequireAuth";
import { publicRoutes } from "../features/public/routes";
import { authRoutes } from "../features/auth/routes";
import { adminRoutes } from "../features/admin/routes";
import { umkmDashboardRoutes, mitraDashboardRoutes } from "../features/dashboard/routes";
import { userRoutes, mitraUserRoutes } from "../features/users/routes";
import { productRoutes } from "../features/products/routes";
import { salesRoutes } from "../features/sales/routes";
import { publicPartnershipRoutes, umkmPartnershipRoutes, mitraPartnershipRoutes } from "../features/partnerships/routes";
import { documentRoutes } from "../features/documents/routes";
import { trainingRoutes } from "../features/trainings/routes";
import { certificateRoutes } from "../features/certificates/routes";
import { notificationRoutes } from "../features/notifications/routes";
import EditUmkmProfilePage from "../features/umkm/pages/EditUmkmProfilePage";
import UmkmProfilePage from "../features/umkm/pages/UmkmProfilePage";
import EditMitraProfilePage from "../features/mitra/pages/EditMitraProfilePage";
import MitraProfilePage from "../features/mitra/pages/MitraProfilePage";
const routes: RouteObject[] = [
  ...publicRoutes,
  ...authRoutes,
  ...publicPartnershipRoutes,
  {
    path: "/admin",
    element: <RequireAuth allowedRole="ADMIN" />,
    children: adminRoutes,
  },
  {
    path: "/umkm",
    element: <RequireAuth allowedRole="UMKM" />,
    children: [
      ...umkmDashboardRoutes,
      ...userRoutes,
      ...productRoutes,
      ...salesRoutes,
      ...umkmPartnershipRoutes,
      ...documentRoutes,
      ...trainingRoutes,
      ...certificateRoutes,
      ...notificationRoutes,
      { path: "profile", element: <EditUmkmProfilePage /> },
      { path: "profile/view", element: <UmkmProfilePage /> },
    ],
  },
  {
    path: "/mitra",
    element: <RequireAuth allowedRole="MITRA" />,
    children: [
      ...mitraDashboardRoutes,
      ...mitraUserRoutes,
      ...mitraPartnershipRoutes,
      ...documentRoutes,
      ...notificationRoutes,
      { path: "profile", element: <EditMitraProfilePage /> },
      { path: "profile/view", element: <MitraProfilePage /> },
    ],
  },
  {
    path: "/profile/mitra",
    element: <RequireAuth allowedRole="MITRA" />,
    children: [
      { index: true, element: <MitraProfilePage /> },
      { path: "group", element: <MitraProfilePage /> },
      { path: "pic", element: <MitraProfilePage /> },
      { path: "bidang", element: <MitraProfilePage /> },
      { path: "docs", element: <MitraProfilePage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
];
export function AppRouter() {
  return useRoutes(routes);
}