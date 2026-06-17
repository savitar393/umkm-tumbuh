import type { RouteObject } from "react-router-dom";
import TrainingDashboardPage from "./pages/TrainingDashboardPage";
import TrainingListPage from "./pages/TrainingListPage";
import TrainingDetailPage from "./pages/TrainingDetailPage";
import TrainingSuccessPage from "./pages/TrainingSuccessPage";
import TrainingLessonPage from "./pages/TrainingLessonPage";
import TrainingEvaluationPage from "./pages/TrainingEvaluationPage";
import TrainingAfterSuccessPage from "./pages/TrainingAfterSuccessPage";

export const trainingRoutes: RouteObject[] = [
  {
    path: "trainings",
    element: <TrainingDashboardPage />,
  },
  {
    path: "trainings/list",
    element: <TrainingListPage />,
  },
  {
    path: "trainings/:id",
    element: <TrainingDetailPage />,
  },
  {
    path: "trainings/:id/success",
    element: <TrainingSuccessPage />,
  },
  {
    path: "trainings/:id/lesson/:lessonId",
    element: <TrainingLessonPage />,
  },
  {
    path: "trainings/:id/evaluation",
    element: <TrainingEvaluationPage />,
  },
  {
    path: "trainings/:id/verification",
    element: <TrainingAfterSuccessPage />,
  },
];