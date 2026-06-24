export type UserRole = "UMKM" | "MITRA" | "ADMIN";

export type UserStatus =
  | "MENUNGGU"
  | "DISETUJUI"
  | "DITOLAK"
  | "AKTIF"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type CurrentUser = {
  id: string;
  full_name: string;
  email: string;
  email_verified_at?: string | null;
  role: UserRole;
  status: UserStatus;

  phone_number?: string | null;
  nik?: string | null;
  is_active?: boolean;
  rejection_reason?: string | null;
  catatan_validasi?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at?: string;
  updated_at?: string;
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

export function setCurrentUser(user: CurrentUser) {
  localStorage.setItem("current_user", JSON.stringify(user));
}

export function isEmailVerified(user: CurrentUser) {
  return user.role === "ADMIN" || Boolean(user.email_verified_at);
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

export function isApprovedStatus(status?: UserStatus | string | null) {
  return status === "DISETUJUI" || status === "APPROVED" || status === "AKTIF";
}

export function isRejectedStatus(status?: UserStatus | string | null) {
  return status === "DITOLAK" || status === "REJECTED";
}

export function getRegistrationStatusRoute(user: CurrentUser) {
  if (!isEmailVerified(user)) {
    return `/register/verify-email?email=${encodeURIComponent(user.email)}&role=${user.role.toLowerCase()}`;
  }

  if (isApprovedStatus(user.status)) {
    return getDefaultRouteByRole(user.role);
  }

  if (isRejectedStatus(user.status)) {
    return "/register/rejected";
  }

  return "/register/pending";
}

export function getPostLoginRoute(user: CurrentUser) {
  if (user.role === "ADMIN") {
    return "/admin";
  }

  if (isApprovedStatus(user.status)) {
    return getDefaultRouteByRole(user.role);
  }

  return getRegistrationStatusRoute(user);
}