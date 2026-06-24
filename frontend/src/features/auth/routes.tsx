import type { RouteObject } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ReactivatePage from "./pages/ReactivatePage";
import RegisterDetailsPage from "./pages/RegisterDetailsPage";

export const authRoutes: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/reactivate",
    element: <ReactivatePage />,
  },
  {
    path: "/register/:role/details",
    element: <RegisterDetailsPage />,
  },
];
