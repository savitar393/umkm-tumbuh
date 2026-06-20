import { Navigate, useRoutes, type RouteObject } from "react-router-dom";
import { RequireAuth } from "../shared/auth/RequireAuth";


import { publicRoutes } from "../features/public/routes";
import { authRoutes } from "../features/auth/routes";
import { adminRoutes } from "../features/admin/routes";
import { umkmDashboardRoutes, mitraDashboardRoutes } from "../features/dashboard/routes";
import { userRoutes } from "../features/users/routes";
import { productRoutes } from "../features/products/routes";
import { salesRoutes } from "../features/sales/routes";
import { publicPartnershipRoutes, umkmPartnershipRoutes, mitraPartnershipRoutes } from "../features/partnerships/routes";
import { documentRoutes } from "../features/documents/routes";
import { trainingRoutes } from "../features/trainings/routes";
import { certificateRoutes } from "../features/certificates/routes";
import { notificationRoutes } from "../features/notifications/routes";

const routes: RouteObject[] = [
  ...publicRoutes,
  ...authRoutes,

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
    ],
  },

  {
    path: "/mitra",
    element: <RequireAuth allowedRole="MITRA" />,
    children: [
      ...mitraDashboardRoutes,
      ...userRoutes,
      ...mitraPartnershipRoutes,
      ...documentRoutes,
      ...notificationRoutes,
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
