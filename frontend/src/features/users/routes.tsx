import type { RouteObject } from "react-router-dom";
import ProfilePage from "./pages/ProfilePage";

export const userRoutes: RouteObject[] = [
  {
    path: "profile",
    element: <ProfilePage />,
  },
];
