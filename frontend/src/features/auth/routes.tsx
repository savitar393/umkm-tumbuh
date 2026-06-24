import type { RouteObject } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ReactivatePage from "./pages/ReactivatePage";
import RegisterDetailsPage from "./pages/RegisterDetailsPage";
import RegisterReviewPage from "./pages/RegisterReviewPage";
import RegisterPendingPage from "./pages/RegisterPendingPage";
import RegisterRejectedPage from "./pages/RegisterRejectedPage";
import RegisterApprovedPage from "./pages/RegisterApprovedPage";
import RegisterVerifyEmailPage from "./pages/RegisterVerifyEmailPage";

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
    path: "/register/verify-email",
    element: <RegisterVerifyEmailPage />,
  },
  {
    path: "/reactivate",
    element: <ReactivatePage />,
  },
  {
    path: "/register/:role/details",
    element: <RegisterDetailsPage />,
  },
  {
    path: "/register/:role/review",
    element: <RegisterReviewPage />,
  },
  {
    path: "/register/pending",
    element: <RegisterPendingPage />,
  },
  {
    path: "/register/rejected",
    element: <RegisterRejectedPage />,
  },
  {
    path: "/register/approved",
    element: <RegisterApprovedPage />,
  },
];
