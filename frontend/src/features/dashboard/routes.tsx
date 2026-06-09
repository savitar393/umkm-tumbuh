import type { RouteObject } from "react-router-dom";
import UMKMDashboardPage from "./pages/UMKMDashboardPage";
import MitraDashboardPage from "./pages/MitraDashboardPage";

export const umkmDashboardRoutes: RouteObject[] = [
  {
    index: true,
    element: <UMKMDashboardPage />,
  },
];

export const mitraDashboardRoutes: RouteObject[] = [
  {
    index: true,
    element: <MitraDashboardPage />,
  },
];
