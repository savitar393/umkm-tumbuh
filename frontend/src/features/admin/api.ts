import { http } from "../../shared/api/http";
import type { UserStatus } from "../auth/api";

export type UserListItem = {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role: string;
  status: UserStatus;
  is_active: boolean;
  submitted_at?: string;
  created_at: string;
};

export type UserListResponse = {
  status: string;
  data: {
    users: UserListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
};

export type UserDetailData = {
  user: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    nik?: string;
    role: string;
    status: UserStatus;
    rejection_reason?: string;
    catatan_validasi?: string;
    is_active: boolean;
    submitted_at?: string;
    reviewed_at?: string;
    created_at: string;
    updated_at: string;
  };
  profile?: any;
  documents?: any[];
  checklist?: { label: string; uploaded: boolean; doc_id?: string }[];
};

export type UserDetailResponse = {
  status: string;
  data: UserDetailData;
};

export type MessageResponse = {
  status: string;
  message: string;
};

export type StatsData = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
};

export type StatsResponse = {
  status: string;
  data: StatsData;
};

export function listUsers(params: {
  status?: string;
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.role) query.set("role", params.role);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return http<UserListResponse>(`/users${qs ? `?${qs}` : ""}`);
}

export function getUserDetail(userID: string) {
  return http<UserDetailResponse>(`/users/${userID}`);
}

export function approveUser(userID: string, catatanValidasi?: string) {
  return http<MessageResponse>(`/users/${userID}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ catatan_validasi: catatanValidasi || "" }),
  });
}

export function rejectUser(userID: string, rejectionReason: string, catatanValidasi?: string) {
  return http<MessageResponse>(`/users/${userID}/reject`, {
    method: "PATCH",
    body: JSON.stringify({
      rejection_reason: rejectionReason,
      catatan_validasi: catatanValidasi || rejectionReason,
    }),
  });
}

export function deactivateUser(userID: string) {
  return http<MessageResponse>(`/users/${userID}/deactivate`, {
    method: "PATCH",
  });
}

export function getStats() {
  return http<StatsResponse>("/users/stats");
}
