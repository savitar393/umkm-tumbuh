import type { RouteObject } from "react-router-dom";
import ProfilePage from "./pages/ProfilePage";
import ProfileEditPage from "./pages/ProfileEditPage";
import SettingsPage from "./pages/SettingsPage";

export const userRoutes: RouteObject[] = [
  {
    path: "profile",
    element: <ProfilePage />,
  },
  {
    path: "profile/edit",
    element: <ProfileEditPage />,
  },
  {
    path: "settings",
    element: <SettingsPage />,
  },
];

export const mitraUserRoutes: RouteObject[] = [];
