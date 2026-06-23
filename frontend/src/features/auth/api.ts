import { http } from "../../shared/api/http";

export type UserRole = "UMKM" | "MITRA" | "ADMIN";

export type UserStatus =
  | "MENUNGGU"
  | "DISETUJUI"
  | "DITOLAK"
  | "AKTIF"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type User = {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  nik?: string | null;
  role: UserRole;
  status: UserStatus;
  rejection_reason?: string;
  catatan_validasi?: string;
  is_active: boolean;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
};

export type RegisterPayload = {
  full_name: string;
  email: string;
  phone_number?: string;
  nik?: string;
  password: string;
  role: "UMKM" | "MITRA";
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export function register(payload: RegisterPayload) {
  return http<{ message: string; user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
    service: "auth",
  });
}

export function login(payload: LoginPayload) {
  return http<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
    service: "auth",
  });
}

export type ReactivatePayload = {
  email: string;
  password: string;
};

export type ReactivateResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export function reactivate(payload: ReactivatePayload) {
  return http<ReactivateResponse>("/auth/reactivate", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
    service: "auth",
  });
}

export function getMe() {
  return http<User>("/auth/me", {
    service: "auth",
  });
}
