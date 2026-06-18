import type { RouteObject } from "react-router-dom";
import PartnershipListPage from "./pages/PartnershipListPage";
import PartnershipCreatePage from "./pages/PartnershipCreatePage";
import PartnershipSuccessPage from "./pages/PartnershipSuccessPage";
import PartnershipStatusPage from "./pages/PartnershipStatusPage";
import PartnershipDetailPage from "./pages/PartnershipDetailPage";
import PartnershipReviewPage from "./pages/PartnershipReviewPage";

// Routes untuk akses tanpa login (tanpa prefix /umkm/ atau /mitra/)
export const publicPartnershipRoutes: RouteObject[] = [
  {
    path: "partnerships",
    children: [
      {
        index: true,
        element: <PartnershipListPage />,
      },
      {
        path: "create",
        element: <PartnershipCreatePage />,
      },
      {
        path: "success",
        element: <PartnershipSuccessPage />,
      },
      {
        path: "status",
        element: <PartnershipStatusPage />,
      },
      {
        path: ":id",
        element: <PartnershipDetailPage />,
      },
      {
        path: "review/:id",
        element: <PartnershipReviewPage />,
      },
    ],
  },
];

// Routes untuk UMKM (dengan prefix /umkm/)
export const umkmPartnershipRoutes: RouteObject[] = [
  {
    path: "partnerships",
    children: [
      {
        index: true,
        element: <PartnershipListPage />,
      },
      {
        path: "create",
        element: <PartnershipCreatePage />,
      },
      {
        path: "success",
        element: <PartnershipSuccessPage />,
      },
      {
        path: "status",
        element: <PartnershipStatusPage />,
      },
      {
        path: ":id",
        element: <PartnershipDetailPage />,
      },
      {
        path: "review/:id",
        element: <PartnershipReviewPage />,
      },
    ],
  },
];

// Routes untuk MITRA (dengan prefix /mitra/)
export const mitraPartnershipRoutes: RouteObject[] = [
  {
    path: "partnerships",
    children: [
      {
        index: true,
        element: <PartnershipListPage />,
      },
      {
        path: ":id",
        element: <PartnershipDetailPage />,
      },
      {
        path: "review/:id",
        element: <PartnershipReviewPage />,
      },
    ],
  },
];