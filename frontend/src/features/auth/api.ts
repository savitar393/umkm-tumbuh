import { http } from "../../shared/api/http";

export type UserRole = "UMKM" | "MITRA" | "ADMIN";
export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

export type User = {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  nik?: string;
  role: UserRole;
  status: UserStatus;
  rejection_reason?: string;
  catatan_validasi?: string;
  is_active: boolean;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  last_login_at?: string;
  reactivation_requested_at?: string;
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
  });
}

export function login(payload: LoginPayload) {
  return http<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function requestReactivation(payload: LoginPayload) {
  return http<{ status: string; message: string }>("/auth/request-reactivation", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe() {
  return http<{ user: User }>("/auth/me");
}