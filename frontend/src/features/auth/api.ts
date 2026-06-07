import { http } from "../../shared/api/http";

export type UserRole = "UMKM" | "MITRA" | "ADMIN";

export type UserStatus =
  | "MENUNGGU"
  | "DISETUJUI"
  | "DITOLAK"
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
  is_active: boolean;
  created_at: string;
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
  });
}

export function login(payload: LoginPayload) {
  return http<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });
}

export function getMe() {
  return http<User>("/auth/me");
}
