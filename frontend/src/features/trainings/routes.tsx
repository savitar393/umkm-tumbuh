import TrainingDashboardPage from "./pages/TrainingDashboardPage";
import type { RouteObject } from "react-router-dom";

export const trainingRoutes: RouteObject[] = [
  {
    path: "trainings",
    element: <TrainingDashboardPage />,
  },
];