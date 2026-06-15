import { getAccessToken } from "../auth/currentUser";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

// Service-specific base URLs
const TRAINING_API_URL =
  import.meta.env.VITE_TRAINING_API_URL ?? "http://localhost:8083/api/v1";

const USER_API_URL =
  import.meta.env.VITE_USER_SERVICE_URL ?? "http://localhost:8082/api/v1";

const CERTIFICATE_API_URL =
  import.meta.env.VITE_CERTIFICATE_API_URL ?? "http://localhost:8083/api/v1";

export type RequestOptions = RequestInit & {
  auth?: boolean;
  service?: "default" | "training" | "certificate" | "user";
};

function getBaseURL(service: "default" | "training" | "certificate" | "user" = "default"): string {
  switch (service) {
    case "training":
    case "certificate":
      return TRAINING_API_URL;
    case "user":
      return USER_API_URL;
    default:
      return API_BASE_URL;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, service = "default", headers, ...rest } = options;

  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Content-Type") && rest.body) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const baseURL = getBaseURL(service);
  const response = await fetch(`${baseURL}${path}`, {
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

function httpRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return apiRequest<T>(path, options);
}

export const http = Object.assign(httpRequest, {
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
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },

  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return apiRequest<T>(path, {
      ...options,
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return apiRequest<T>(path, {
      ...options,
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },

  delete<T>(path: string, options?: RequestOptions) {
    return apiRequest<T>(path, {
      ...options,
      method: "DELETE",
    });
  },
});
