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

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export type DashboardSummary = {
  total_umkm: number;
  total_umkm_aktif: number;
  total_umkm_berkembang: number;
  total_umkm_tidak_aktif: number;
  total_laba: number;
  total_mitra: number;
  total_program_pelatihan: number;
  total_pengajuan_kemitraan: number;
  generated_at: string;
};

export type MapDataItem = {
  provinsi: string;
  kabupaten_kota: string;
  total_umkm: number;
  total_umkm_aktif: number;
  total_laba: number;
  latitude_avg: number;
  longitude_avg: number;
};

export type RegistrationTrendItem = {
  tanggal: string;
  total_pendaftaran: number;
};

export type StatusDistributionItem = {
  status_id: string;
  nama_status: string;
  total: number;
  persentase: number;
};

export type LabaTimeseriesItem = {
  tanggal: string;
  total_laba: number;
  rata_rata_laba: number;
  total_umkm_tercatat: number;
};

export type TopWilayahItem = {
  provinsi: string;
  kabupaten_kota: string;
  total_laba: number;
  total_umkm: number;
  peringkat_nasional: number;
};

export type KategoriPerformaItem = {
  kategori_usaha_id: string;
  nama_kategori: string;
  total_umkm: number;
  total_laba: number;
  rata_rata_laba_harian: number;
};

export type AtensiData = {
  total_umkm_perlu_atensi: number;
  total_umkm_berisiko: number;
  total_provinsi_terdampak: number;
  generated_at: string;
};

export type DashboardData = {
  summary: DashboardSummary;
  map_data: MapDataItem[];
  registration_trend: RegistrationTrendItem[];
  status_distribution: StatusDistributionItem[];
  laba_trend: LabaTimeseriesItem[];
  top_wilayah: TopWilayahItem[];
  kategori_performa: KategoriPerformaItem[];
  atensi: AtensiData;
};

export function getDashboard(queryString?: string) {
  const path = queryString ? `/admin/dashboard${queryString}` : "/admin/dashboard";
  return http<DashboardData>(path);
}