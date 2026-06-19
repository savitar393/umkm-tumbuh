import { http } from "../../shared/api/http";
import type { User, UserStatus } from "../auth/api";
import type { Certificate } from "../certificates/types";

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

// ─── Certificate API ─────────────────────────────────────────────────────

export interface CertificateStats {
  diajukan: number;
  terbit: number;
  ditolak: number;
}

export interface ListCertificatesResponse {
  certificates: Certificate[];
  total: number;
  page: number;
  limit: number;
}

export function getCertificateStats() {
  return http<CertificateStats>(`/certificates/stats`, { service: "certificate" });
}

export function listCertificates(status = "", page = 1, limit = 20, search = "", sortBy = "tanggal_pengajuan", sortOrder = "desc") {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("limit", String(limit));
  params.set("sort_by", sortBy);
  params.set("sort_order", sortOrder);
  return http<ListCertificatesResponse>(`/certificates/list?${params.toString()}`, { service: "certificate" });
}

export function approveCertificate(sertifikatId: number) {
  return http<{ message: string; certificate: Certificate }>(`/certificates/${sertifikatId}/approve`, {
    method: "POST",
    service: "certificate",
  });
}

export function rejectCertificate(sertifikatId: number, catatanValidasi: string) {
  return http<{ message: string; certificate: Certificate }>(`/certificates/${sertifikatId}/reject`, {
    method: "POST",
    service: "certificate",
    body: JSON.stringify({ catatan_validasi: catatanValidasi }),
  });
}