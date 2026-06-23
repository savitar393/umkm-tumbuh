import type { RouteObject } from "react-router-dom";
import ProfilePage from "./pages/ProfilePage";
import MitraProfilePage from "./pages/MitraProfilePage";
import SettingsPage from "./pages/SettingsPage";

export const userRoutes: RouteObject[] = [
  {
    path: "profile",
    element: <ProfilePage />,
  },
  {
    path: "settings",
    element: <SettingsPage />,
  },
];

export const mitraUserRoutes: RouteObject[] = [
  {
    path: "profile",
    element: <MitraProfilePage />,
  },
];
