import type { RouteObject } from "react-router-dom";
import SalesListPage from "./pages/SalesListPage";

export const salesRoutes: RouteObject[] = [
  {
    path: "sales",
    element: <SalesListPage />,
  },
];
