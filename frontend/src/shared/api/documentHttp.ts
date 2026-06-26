import { createHttpClient } from "./http";

const DOCUMENT_API_BASE_URL =
  import.meta.env.VITE_DOCUMENT_API_BASE_URL ?? "/api/v1";

export const documentHttp = createHttpClient(DOCUMENT_API_BASE_URL);
