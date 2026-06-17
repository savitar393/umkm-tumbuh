import { getAccessToken } from "../auth/currentUser";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

const USER_API_BASE_URL =
  import.meta.env.VITE_USER_API_BASE_URL ??
  import.meta.env.VITE_USER_SERVICE_URL ??
  "http://localhost:8081/api/v1";

const PARTNERSHIP_API_BASE_URL =
  import.meta.env.VITE_PARTNERSHIP_API_BASE_URL ??
  "http://localhost:8082/api/v1";

const DOCUMENT_API_BASE_URL =
  import.meta.env.VITE_DOCUMENT_API_BASE_URL ??
  "http://localhost:8083/api/v1";

const TRAINING_API_BASE_URL =
  import.meta.env.VITE_TRAINING_API_BASE_URL ??
  import.meta.env.VITE_TRAINING_API_URL ??
  "http://localhost:8084/api/v1";

const CERTIFICATE_API_BASE_URL =
  import.meta.env.VITE_CERTIFICATE_API_BASE_URL ??
  import.meta.env.VITE_CERTIFICATE_API_URL ??
  TRAINING_API_BASE_URL;

export type ServiceName =
  | "default"
  | "auth"
  | "user"
  | "partnership"
  | "document"
  | "training"
  | "certificate";

export type RequestOptions = RequestInit & {
  auth?: boolean;
  service?: ServiceName;
  skipJsonContentType?: boolean;
};

function getBaseURL(service: ServiceName = "default"): string {
  switch (service) {
    case "auth":
    case "default":
      return API_BASE_URL;
    case "user":
      return USER_API_BASE_URL;
    case "partnership":
      return PARTNERSHIP_API_BASE_URL;
    case "document":
      return DOCUMENT_API_BASE_URL;
    case "training":
      return TRAINING_API_BASE_URL;
    case "certificate":
      return CERTIFICATE_API_BASE_URL;
    default:
      return API_BASE_URL;
  }
}

function shouldUseJsonContentType(
  body: BodyInit | null | undefined,
  skipJsonContentType: boolean,
) {
  if (!body) return false;
  if (skipJsonContentType) return false;
  if (body instanceof FormData) return false;
  return true;
}

function serializeBody(body: unknown): BodyInit | null | undefined {
  if (body === undefined || body === null) return undefined;

  if (
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams ||
    typeof body === "string"
  ) {
    return body;
  }

  return JSON.stringify(body);
}

export function createHttpClient(baseUrl: string) {
  async function clientRequest<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    return requestWithBaseURL<T>(baseUrl, path, options);
  }

  function httpRequest<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    return clientRequest<T>(path, options);
  }

  return Object.assign(httpRequest, {
    get<T>(path: string, options?: RequestOptions) {
      return clientRequest<T>(path, {
        ...options,
        method: "GET",
      });
    },

    post<T>(path: string, body?: unknown, options?: RequestOptions) {
      return clientRequest<T>(path, {
        ...options,
        method: "POST",
        body: serializeBody(body),
      });
    },

    put<T>(path: string, body?: unknown, options?: RequestOptions) {
      return clientRequest<T>(path, {
        ...options,
        method: "PUT",
        body: serializeBody(body),
      });
    },

    patch<T>(path: string, body?: unknown, options?: RequestOptions) {
      return clientRequest<T>(path, {
        ...options,
        method: "PATCH",
        body: serializeBody(body),
      });
    },

    delete<T>(path: string, options?: RequestOptions) {
      return clientRequest<T>(path, {
        ...options,
        method: "DELETE",
      });
    },
  });
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { service = "default", ...rest } = options;
  return requestWithBaseURL<T>(getBaseURL(service), path, rest);
}

async function requestWithBaseURL<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    auth = true,
    headers,
    skipJsonContentType = false,
    service: _service,
    ...rest
  } = options;

  const requestHeaders = new Headers(headers);
  const body = rest.body;

  if (
    !requestHeaders.has("Content-Type") &&
    shouldUseJsonContentType(body, skipJsonContentType)
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: requestHeaders,
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");

  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      "Terjadi kesalahan pada server.";

    throw new Error(message);
  }

  return payload as T;
}

export const http = Object.assign(
  function httpRequest<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    return apiRequest<T>(path, options);
  },
  {
    get<T>(path: string, options?: RequestOptions) {
      return apiRequest<T>(path, {
        ...options,
        method: "GET",
      });
    },

    post<T>(path: string, body?: unknown, options?: RequestOptions) {
      return apiRequest<T>(path, {
        ...options,
        method: "POST",
        body: serializeBody(body),
      });
    },

    put<T>(path: string, body?: unknown, options?: RequestOptions) {
      return apiRequest<T>(path, {
        ...options,
        method: "PUT",
        body: serializeBody(body),
      });
    },

    patch<T>(path: string, body?: unknown, options?: RequestOptions) {
      return apiRequest<T>(path, {
        ...options,
        method: "PATCH",
        body: serializeBody(body),
      });
    },

    delete<T>(path: string, options?: RequestOptions) {
      return apiRequest<T>(path, {
        ...options,
        method: "DELETE",
      });
    },
  },
);
