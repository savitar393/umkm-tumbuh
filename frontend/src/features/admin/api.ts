import { http } from "../../shared/api/http";
import type { User, UserStatus } from "../auth/api";

export type RegistrationStatusFilter = UserStatus | "ALL";

export function listRegistrations(status: RegistrationStatusFilter = "PENDING") {
  return http<User[]>(`/admin/registrations?status=${encodeURIComponent(status)}`);
}

export function approveRegistration(userID: string) {
  return http<User>(`/admin/registrations/${userID}/approve`, {
    method: "PATCH",
  });
}

export function rejectRegistration(userID: string, rejectionReason: string) {
  return http<User>(`/admin/registrations/${userID}/reject`, {
    method: "PATCH",
    body: JSON.stringify({
      rejection_reason: rejectionReason,
    }),
  });
}