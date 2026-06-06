import type { RouteObject } from "react-router-dom";
import HomePage from "./pages/HomePage";

export const publicRoutes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
];
