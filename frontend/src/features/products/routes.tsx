import type { RouteObject } from "react-router-dom";
import ProductListPage from "./pages/ProductListPage";

export const productRoutes: RouteObject[] = [
  {
    path: "products",
    element: <ProductListPage />,
  },
];
