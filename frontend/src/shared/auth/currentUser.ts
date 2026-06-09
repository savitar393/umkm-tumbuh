export type UserRole = "UMKM" | "MITRA" | "ADMIN";
export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

export type CurrentUser = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

export function getCurrentUser(): CurrentUser | null {
  const rawUser = localStorage.getItem("current_user");

  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as CurrentUser;
  } catch {
    return null;
  }
}

export function clearAuthStorage() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("current_user");
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function getDefaultRouteByRole(role: UserRole): string {
  if (role === "ADMIN") return "/admin";
  if (role === "UMKM") return "/umkm";
  if (role === "MITRA") return "/mitra";

  return "/";
}
