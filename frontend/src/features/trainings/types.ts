import { z } from "zod";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const TrainingProgramSchema = z.object({
  pelatihan_id: z.string(),
  kode_pelatihan: z.string(),
  judul_pelatihan: z.string(),
  deskripsi_pelatihan: z.string().nullable(),
  mentor_nama: z.string().nullable(),
  durasi_jam: z.number(),
  total_modul: z.number(),
  harga: z.number(),
  akses_seumur_hidup: z.boolean(),
  masa_akses_hari: z.number().nullable(),
  rating_rata_rata: z.number().nullable(),
  jumlah_alumni: z.number(),
  thumbnail_url: z.string().nullable(),
  syarat_ketentuan: z.string().nullable(),
  tanggal_publish: z.string().nullable(),
  jenis_pelatihan: z.string(),
  status_pelatihan: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const TrainingModuleSchema = z.object({
  modul_id: z.string(),
  pelatihan_id: z.string(),
  urutan_modul: z.number(),
  judul_modul: z.string(),
  deskripsi_modul: z.string().nullable(),
  durasi_menit: z.number(),
  materi_url: z.string().nullable(),
  is_preview: z.boolean(),
  status_aktif: z.boolean(),
  judul_pelatihan: z.string(),
});

export const EnrollmentSchema = z.object({
  pendaftaran_pelatihan_id: z.string(),
  umkm_id: z.string(),
  pelatihan_id: z.string(),
  judul_pelatihan: z.string(),
  status_pendaftaran: z.string(),
  tanggal_daftar: z.string(),
  akses_mulai_at: z.string().nullable(),
  akses_berakhir_at: z.string().nullable(),
  terakhir_diakses_at: z.string().nullable(),
  progress_persen: z.number(),
  modul_selesai: z.number(),
  total_modul_snapshot: z.number(),
  tanggal_selesai: z.string().nullable(),
});

export const TrainingDetailSchema = z.object({
  training: TrainingProgramSchema,
  modules: z.array(TrainingModuleSchema),
});

// ─── Response Schemas ─────────────────────────────────────────────────────────

export const GetAllTrainingsResponseSchema = z.object({
  trainings: z.array(TrainingProgramSchema),
});

export const GetUserEnrollmentsResponseSchema = z.object({
  enrollments: z.array(EnrollmentSchema),
});

export const EnrollResponseSchema = z.object({
  message: z.string(),
  enrollment: EnrollmentSchema,
});

export const UpdateProgressResponseSchema = z.object({
  message: z.string(),
});

export const CompleteTrainingResponseSchema = z.object({
  message: z.string(),
});

// ─── Types (inferred from schemas) ────────────────────────────────────────────

export type TrainingProgram = z.infer<typeof TrainingProgramSchema>;
export type TrainingModule = z.infer<typeof TrainingModuleSchema>;
export type Enrollment = z.infer<typeof EnrollmentSchema>;
export type TrainingDetail = z.infer<typeof TrainingDetailSchema>;

export type GetAllTrainingsResponse = z.infer<typeof GetAllTrainingsResponseSchema>;
export type GetUserEnrollmentsResponse = z.infer<typeof GetUserEnrollmentsResponseSchema>;
export type EnrollResponse = z.infer<typeof EnrollResponseSchema>;
export type UpdateProgressResponse = z.infer<typeof UpdateProgressResponseSchema>;
export type CompleteTrainingResponse = z.infer<typeof CompleteTrainingResponseSchema>;

// ─── Request Types ────────────────────────────────────────────────────────────

export interface EnrollRequest {
  umkm_id: string;
  pelatihan_id: string;
}

export interface UpdateProgressRequest {
  pendaftaran_pelatihan_id: string;
  modul_selesai: number;
  total_modul: number;
}

export interface CompleteTrainingRequest {
  pendaftaran_pelatihan_id: string;
  dokumen_evaluasi_id?: string;
}
