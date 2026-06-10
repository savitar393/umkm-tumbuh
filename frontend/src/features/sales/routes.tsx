import type { RouteObject } from "react-router-dom";
import SalesListPage from "./pages/SalesListPage";
import SalesCreatePage from "./pages/SalesCreatePage";
import SalesDetailPage from "./pages/SalesDetailPage";

export const salesRoutes: RouteObject[] = [
  {
    path: "sales",
    element: <SalesListPage />,
  },
  {
    path: "sales/new",
    element: <SalesCreatePage />,
  },
  {
    path: "sales/:id",
    element: <SalesDetailPage />,
  },
];
