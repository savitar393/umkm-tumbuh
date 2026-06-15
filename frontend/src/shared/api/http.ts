import { getAccessToken } from "../auth/currentUser";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

export type RequestOptions = RequestInit & {
  auth?: boolean;
  skipJsonContentType?: boolean;
};

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
  async function apiRequest<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const {
      auth = true,
      headers,
      skipJsonContentType = false,
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

  function httpRequest<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    return apiRequest<T>(path, options);
  }

  return Object.assign(httpRequest, {
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
  });
}

export const http = createHttpClient(API_BASE_URL);