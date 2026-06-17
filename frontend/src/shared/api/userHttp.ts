import { createHttpClient } from "./http";

const USER_API_BASE_URL =
  import.meta.env.VITE_USER_API_BASE_URL ?? "http://localhost:8081/api/v1";

export const userHttp = createHttpClient(USER_API_BASE_URL);