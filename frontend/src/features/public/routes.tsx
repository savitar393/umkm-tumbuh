import type { RouteObject } from "react-router-dom";
import LandingPage from "./pages/LandingPage";

export const publicRoutes: RouteObject[] = [
  {
    path: "/",
    element: <LandingPage />,
  },
];
