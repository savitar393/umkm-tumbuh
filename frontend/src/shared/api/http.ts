import { getAccessToken } from "../auth/currentUser";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

const USER_API_BASE_URL =
  import.meta.env.VITE_USER_API_BASE_URL ?? "http://localhost:8081/api/v1";

export type RequestOptions = RequestInit & {
  auth?: boolean;
  useUserApi?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, useUserApi = false, headers, ...rest } = options;

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

  const base = useUserApi ? USER_API_BASE_URL : API_BASE_URL;
  const response = await fetch(`${base}${path}`, {
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