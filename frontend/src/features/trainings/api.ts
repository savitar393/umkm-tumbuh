import { http } from "../../shared/api/http";
import { documentHttp } from "../../shared/api/documentHttp";
import {
  TrainingProgramSchema,
  TrainingDetailSchema,
  GetAllTrainingsResponseSchema,
  GetUserEnrollmentsResponseSchema,
  EnrollResponseSchema,
  UpdateProgressResponseSchema,
  CompleteTrainingResponseSchema,
  type TrainingProgram,
  type TrainingDetail,
  type Enrollment,
  type EnrollRequest,
  type UpdateProgressRequest,
  type CompleteTrainingRequest,
} from "./types";

// ─── Base URL ─────────────────────────────────────────────────────────────────
// Training service menggunakan port yang berbeda atau path yang sama
// Sesuaikan dengan konfigurasi backend Anda
const TRAINING_BASE = "/trainings";
const ENROLLMENT_BASE = "/enrollments";

// ─── Training API Functions ───────────────────────────────────────────────────

/**
 * Get all trainings
 * @returns Promise<TrainingProgram[]>
 */
export async function getAllTrainings(): Promise<TrainingProgram[]> {
  const response = await http.get(TRAINING_BASE, { service: "training" });
  const validated = GetAllTrainingsResponseSchema.parse(response);
  return validated.trainings;
}

/**
 * Get training by ID (basic info only)
 * @param trainingId - ID pelatihan
 * @returns Promise<TrainingProgram>
 */
export async function getTrainingById(trainingId: string): Promise<TrainingProgram> {
  const response = await http.get(`${TRAINING_BASE}/${trainingId}`, { service: "training" });
  return TrainingProgramSchema.parse(response);
}

/**
 * Get training detail with modules
 * @param trainingId - ID pelatihan
 * @returns Promise<TrainingDetail>
 */
export async function getTrainingDetail(trainingId: string): Promise<TrainingDetail> {
  const response = await http.get(`${TRAINING_BASE}/${trainingId}/detail`, { service: "training" });
  return TrainingDetailSchema.parse(response);
}

/**
 * Enroll user to training
 * @param data - Enrollment request data
 * @returns Promise<{ message: string; enrollment: Enrollment }>
 */
export async function enrollTraining(data: EnrollRequest): Promise<{ message: string; enrollment: Enrollment }> {
  const isDemo =
    import.meta.env.VITE_DEMO_VERIFY_BYPASS === "true" ||
    window.location.hostname === "app.umkmtumbuh.xyz";

  if (isDemo) {
    return EnrollResponseSchema.parse({
      message: "Mode demo: pendaftaran pelatihan berhasil.",
      enrollment: {
        pendaftaran_pelatihan_id: `DEMO-${Date.now()}`,
        umkm_id: data.umkm_id,
        pelatihan_id: data.pelatihan_id,
        judul_pelatihan: "Pelatihan Demo",
        status_pendaftaran: "TERDAFTAR",
        tanggal_daftar: new Date().toISOString(),
        akses_mulai_at: new Date().toISOString(),
        akses_berakhir_at: null,
        terakhir_diakses_at: null,
        progress_persen: 0,
        modul_selesai: 0,
        total_modul_snapshot: 1,
        tanggal_selesai: null,
      },
    });
  }

  const response = await http.post(`${TRAINING_BASE}/enroll`, data, { service: "training" });
  return EnrollResponseSchema.parse(response);
}

// ─── Enrollment API Functions ─────────────────────────────────────────────────

/**
 * Get user enrollments
 * @param umkmId - UMKM ID
 * @returns Promise<Enrollment[]>
 */
export async function getUserEnrollments(umkmId: string): Promise<Enrollment[]> {
  const response = await http.get(`${ENROLLMENT_BASE}/user/${umkmId}`, { service: "training" });
  const validated = GetUserEnrollmentsResponseSchema.parse(response);
  return validated.enrollments;
}

/**
 * Update progress modul
 * @param data - Update progress request data
 * @returns Promise<{ message: string }>
 */
export async function updateProgress(data: UpdateProgressRequest): Promise<{ message: string }> {
  const response = await http.patch(`${ENROLLMENT_BASE}/progress`, data, { service: "training" });
  return UpdateProgressResponseSchema.parse(response);
}

/**
 * Complete training
 * @param data - Complete training request data
 * @returns Promise<{ message: string }>
 */
export async function completeTraining(data: CompleteTrainingRequest): Promise<{ message: string }> {
  const response = await http.patch(`${ENROLLMENT_BASE}/complete`, data, { service: "training" });
  return CompleteTrainingResponseSchema.parse(response);
}

export async function uploadEvaluationDocument(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("category", "GENERAL_DOCUMENT");
  formData.append("file", file);

  const response = await documentHttp<{ message: string; document: { id: string } }>(
    "/documents/upload",
    {
      method: "POST",
      body: formData,
      skipJsonContentType: true,
    },
  );

  return response.document.id;
}
