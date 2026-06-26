import { http } from "../../shared/api/http";
import type { User, UserStatus } from "../auth/api";
import type { Certificate } from "../certificates/types";

export type { Certificate };

export type RegistrationStatusFilter = UserStatus | "ALL";

export function listRegistrations(status: RegistrationStatusFilter = "PENDING") {
  return http<User[]>(`/admin/registrations?status=${encodeURIComponent(status)}`, { service: "admin" });
}

export function approveRegistration(userID: string) {
  return http<User>(`/admin/registrations/${userID}/approve`, {
    method: "PATCH",
    service: "admin",
  });
}

export function rejectRegistration(userID: string, rejectionReason: string) {
  return http<User>(`/admin/registrations/${userID}/reject`, {
    method: "PATCH",
    body: JSON.stringify({
      rejection_reason: rejectionReason,
    }),
    service: "admin",
  });
}

// ─── New User Management API ────────────────────────────────────────────────

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
  return http<UserListResponse>(`/admin/registrations${qs ? `?${qs}` : ""}`, { service: "admin" });
}

export function getUserDetail(userID: string) {
  return http<UserDetailResponse>(`/admin/registrations/${userID}`, { service: "admin" });
}

export function approveUser(userID: string, catatanValidasi?: string) {
  return http<MessageResponse>(`/admin/registrations/${userID}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ catatan_validasi: catatanValidasi || "" }),
    service: "admin",
  });
}

export function rejectUser(userID: string, rejectionReason: string, catatanValidasi?: string) {
  return http<MessageResponse>(`/admin/registrations/${userID}/reject`, {
    method: "PATCH",
    body: JSON.stringify({
      rejection_reason: rejectionReason,
      catatan_validasi: catatanValidasi || rejectionReason,
    }),
    service: "admin",
  });
}

export function deactivateUser(userID: string, reason?: string) {
  const body: Record<string, string> = {};
  if (reason) body.deactivation_reason = reason;
  return http<MessageResponse>(`/admin/registrations/${userID}/deactivate`, {
    method: "PATCH",
    body: JSON.stringify(body),
    service: "admin",
  });
}

export function getStats() {
  return http<StatsResponse>("/admin/stats", { service: "admin" });
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
  return http<DashboardData>(path, { service: "admin" });
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

// ─── Training Evaluation API ──────────────────────────────────────────────────

export type TrainingListItem = {
  pelatihan_id: string;
  kode_pelatihan: string;
  judul_pelatihan: string;
  jenis_pelatihan: string;
  status_pelatihan: string;
  total_modul: number;
  jumlah_peserta: number;
  mentor_nama: string | null;
};

export type EvaluationSummary = {
  total_peserta: number;
  selesai_evaluasi: number;
  rata_rata_nilai: number;
  persentase_kelulusan: number;
};

export type ScoreDistributionItem = {
  rentang_nilai: string;
  jumlah: number;
};

export type ModuleScoreItem = {
  urutan_modul: number;
  judul_modul: string;
  rata_rata_nilai: number;
};

export type ParticipantEvaluation = {
  pendaftaran_pelatihan_id: string;
  nama: string;
  email: string;
  nilai_akhir: number;
  status_kelulusan: "LULUS" | "TIDAK_LULUS" | "BELUM_SELESAI";
  tanggal_selesai: string | null;
  umkm_id: string;
};

export type EvaluationData = {
  training: TrainingListItem;
  summary: EvaluationSummary;
  score_distribution: ScoreDistributionItem[];
  module_scores: ModuleScoreItem[];
  participants: ParticipantEvaluation[];
};

export type EvaluationListResponse = {
  status: string;
  data: EvaluationData;
};

export type TrainingListResponse = {
  status: string;
  data: {
    trainings: TrainingListItem[];
  };
};

export async function getTrainingList() {
  const res = await http<AdminTrainingListResponse>("/admin/training?page=1&limit=100", {
    service: "training",
  });

  return {
    status: "success",
    data: {
      trainings: (res.trainings ?? []).map((training) => ({
        pelatihan_id: training.pelatihan_id,
        kode_pelatihan: training.kode_pelatihan,
        judul_pelatihan: training.judul_pelatihan,
        jenis_pelatihan: training.jenis_pelatihan,
        status_pelatihan: training.status_pelatihan,
        total_modul: training.total_modul ?? 0,
        jumlah_peserta: training.jumlah_peserta ?? training.jumlah_alumni ?? 0,
        mentor_nama: training.mentor_nama ?? null,
      })),
    },
  } satisfies TrainingListResponse;
}

export function getEvaluationData(trainingId: string) {
  return http<EvaluationListResponse>(`/admin/training/${trainingId}/evaluation`, { service: "training" });
}

export function exportEvaluationCSV(trainingId: string) {
  return http<Blob>(`/admin/training/${trainingId}/evaluation/export`, {
    service: "training",
    skipJsonContentType: true,
  });
}

export function verifyCertificatesBulk(trainingId: string, participantIds: string[]) {
  return http<{ message: string; verified: number }>(`/admin/training/${trainingId}/certificates/verify-bulk`, {
    method: "PATCH",
    service: "training",
    body: JSON.stringify({ participant_ids: participantIds }),
  });
}


// ─── Admin Training Management API ──────────────────────────────────────────────

export type TrainingModuleItem = {
  id?: string;
  modul_id?: string;
  urutan_modul: number;
  judul_modul: string;
  deskripsi_modul?: string;
  durasi_menit: number;
  is_preview: boolean;
};

export type TrainingAssignmentItem = {
  id?: string;
  assignment_id?: string;
  judul_assignment: string;
  deskripsi_tugas: string;
};

export type AdminTrainingItem = {
  pelatihan_id: string;
  kode_pelatihan: string;
  judul_pelatihan: string;
  deskripsi_pelatihan?: string;
  mentor_nama?: string;
  durasi_jam: number;
  total_modul: number;
  harga: number;

  jenis_pelatihan_id?: string;
  jenis_pelatihan: string;

  status_pelatihan_id: string;
  status_pelatihan: string;

  akses_seumur_hidup?: boolean;
  masa_akses_hari?: number;
  thumbnail_url?: string;
  syarat_ketentuan?: string;

  modules?: TrainingModuleItem[];
  assignments?: TrainingAssignmentItem[];

  jumlah_alumni: number;
  jumlah_peserta?: number;
  created_at: string;
  updated_at: string;
};

export type AdminTrainingListResponse = {
  trainings: AdminTrainingItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export type TrainingStatsResponse = {
  total_trainings: number;
  published_count: number;
  draft_count: number;
  archived_count: number;
  total_enrollments: number;
  total_completions: number;
};

export type CreateTrainingPayload = {
  dibuat_oleh_admin_id: string;
  jenis_pelatihan_id: string;
  judul_pelatihan: string;
  deskripsi_pelatihan?: string;
  mentor_nama?: string;
  durasi_jam: number;
  total_modul: number;
  harga: number;
  akses_seumur_hidup: boolean;
  masa_akses_hari?: number;
  thumbnail_url?: string;
  syarat_ketentuan?: string;
};

export type UpdateTrainingPayload = {
  jenis_pelatihan_id: string;
  judul_pelatihan: string;
  deskripsi_pelatihan?: string;
  mentor_nama?: string;
  durasi_jam: number;
  total_modul: number;
  harga: number;
  akses_seumur_hidup: boolean;
  masa_akses_hari?: number;
  thumbnail_url?: string;
  syarat_ketentuan?: string;
};

export function getAdminTrainings(params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: string;
} = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_order) query.set("sort_order", params.sort_order);

  const qs = query.toString();
  return http<AdminTrainingListResponse>(`/admin/training${qs ? `?${qs}` : ""}`, { service: "training" });
}

export function getTrainingStats() {
  return http<TrainingStatsResponse>("/admin/training/stats", { service: "training" });
}

export function createTraining(payload: CreateTrainingPayload) {
  return http<{ message: string; training: AdminTrainingItem }>("/admin/training", {
    method: "POST",
    service: "training",
    body: JSON.stringify(payload),
  });
}

export function updateTraining(id: string, payload: UpdateTrainingPayload) {
  return http<{ message: string; training: AdminTrainingItem }>(`/admin/training/${id}`, {
    method: "PUT",
    service: "training",
    body: JSON.stringify(payload),
  });
}

export function deleteTraining(id: string) {
  return http<{ message: string }>(`/admin/training/${id}`, {
    method: "DELETE",
    service: "training",
  });
}

export function updateTrainingStatus(id: string, status: string) {
  return http<{ message: string }>(`/admin/training/${id}/status`, {
    method: "PATCH",
    service: "training",
    body: JSON.stringify({ status }),
  });
}

export function getAdminTrainingDetail(id: string) {
  return http<AdminTrainingItem>(`/admin/training/${id}`, { service: "training" });
}
