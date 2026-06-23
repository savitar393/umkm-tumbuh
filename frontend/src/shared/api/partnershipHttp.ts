// frontend/src/shared/api/httpPartnerships.ts

import { getAccessToken } from "../auth/currentUser";

const API_BASE_URL =
  import.meta.env.VITE_PARTNERSHIPS_API_URL ?? "http://localhost:8082/api/v1";

console.log("[HTTP Partnerships] API_BASE_URL:", API_BASE_URL);

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

    const userRole = localStorage.getItem("userRole") || "UMKM";
    requestHeaders.set("X-User-Role", userRole);

    let accessToken: string | null = null;
    if (auth) {
      accessToken = getAccessToken();
      if (accessToken) {
        requestHeaders.set("Authorization", `Bearer ${accessToken}`);
      }
    }

    const fullUrl = path.startsWith("http") ? path : `${baseUrl}${path}`;
    console.log(`[HTTP Partnerships] ${rest.method || "GET"} ${fullUrl}`);

    try {
      const response = await fetch(fullUrl, {
        ...rest,
        headers: requestHeaders,
      });

      const responseText = await response.text();

      if (!response.ok) {
        let message = `HTTP Error ${response.status}`;
        try {
          const errorJson = JSON.parse(responseText);
          message = errorJson?.message || errorJson?.error || message;
        } catch {
          message = responseText || message;
        }
        throw new Error(message);
      }

      if (responseText && responseText.trim()) {
        return JSON.parse(responseText) as T;
      }

      return null as T;
    } catch (error) {
      console.error("[HTTP Partnerships] Request failed:", error);
      throw error;
    }
  }

  function httpRequest<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    return apiRequest<T>(path, options);
  }

  return Object.assign(httpRequest, {
    get<T>(path: string, options?: RequestOptions) {
      return apiRequest<T>(path, { ...options, method: "GET" });
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
      return apiRequest<T>(path, { ...options, method: "DELETE" });
    },
  });
}

export const httpPartnerships = createHttpClient(API_BASE_URL);