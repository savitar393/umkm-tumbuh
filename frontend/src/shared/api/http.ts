export const AUTH_API =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080/api/v1";

export const USER_API =
  import.meta.env.VITE_USER_SERVICE_URL || "http://127.0.0.1:8081/api/v1";

export class ApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

function handleAuthRedirect(errorCode?: string) {
  if (errorCode === "ERR-AUTH-01") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    const returnUrl = window.location.pathname + window.location.search;
    window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  }
}

export async function http<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${AUTH_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errCode = data?.error_code;
    const message = data?.error || data?.message || "Request failed";
    if (errCode === "ERR-AUTH-01") {
      handleAuthRedirect(errCode);
    }
    throw new ApiError(message, errCode);
  }

  return data as T;
}

export async function httpUser<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${USER_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errCode = data?.error_code;
    const message = data?.error || data?.message || "Request failed";
    if (errCode === "ERR-AUTH-01") {
      handleAuthRedirect(errCode);
    }
    throw new ApiError(message, errCode);
  }

  return data as T;
}