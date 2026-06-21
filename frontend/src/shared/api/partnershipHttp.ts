import { createHttpClient } from "./http";

const PARTNERSHIP_API_BASE_URL =
  import.meta.env.VITE_PARTNERSHIP_API_BASE_URL ?? "http://localhost:8082/api/v1";

export const httpPartnerships = createHttpClient(PARTNERSHIP_API_BASE_URL);
