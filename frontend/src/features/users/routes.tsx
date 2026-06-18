import type { RouteObject } from "react-router-dom";
import ProfilePage from "./pages/ProfilePage";
import MitraProfilePage from "./pages/MitraProfilePage";

export const userRoutes: RouteObject[] = [
  {
    path: "profile",
    element: <ProfilePage />,
  },
];

export const mitraUserRoutes: RouteObject[] = [
  {
    path: "profile",
    element: <MitraProfilePage />,
  },
];
