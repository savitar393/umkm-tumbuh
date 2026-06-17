import { createHttpClient } from "./http";

const DOCUMENT_API_BASE_URL =
  import.meta.env.VITE_DOCUMENT_API_BASE_URL ?? "http://localhost:8083/api/v1";

export const documentHttp = createHttpClient(DOCUMENT_API_BASE_URL);
