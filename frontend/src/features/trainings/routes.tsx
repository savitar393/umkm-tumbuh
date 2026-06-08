import type { RouteObject } from "react-router-dom";
import TrainingDashboardPage from "./pages/TrainingDashboardPage";
import TrainingListPage from "./pages/TrainingListPage";

export const trainingRoutes: RouteObject[] = [
  {
    path: "trainings",
    element: <TrainingDashboardPage />,
  },
  {
    path: "trainings/list",
    element: <TrainingListPage />,
  },
  // Future routes:
  // { path: "trainings/:id", element: <TrainingDetailPage /> },
];