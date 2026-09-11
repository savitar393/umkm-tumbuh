import type { RouteObject } from "react-router-dom";
import RoleDashboardPage from "./pages/RoleDashboardPage";
import MitraDashboardPage from "./pages/MitraDashboardPage";

export const umkmDashboardRoutes: RouteObject[] = [
  {
    index: true,
    element: <RoleDashboardPage />,
  },
];

export const mitraDashboardRoutes: RouteObject[] = [
  {
    index: true,
    element: <MitraDashboardPage />,
  },
];
