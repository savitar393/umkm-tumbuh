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

async function resolveCurrentUmkmId(candidate?: string): Promise<string> {
  try {
    const response = await http.get("/profiles/me", { service: "user" });
    const payload = response as {
      profile?: {
        id?: string;
        umkm_id?: string;
      };
      id?: string;
      umkm_id?: string;
    };

    const profile = payload.profile ?? payload;
    const resolved = profile.umkm_id ?? profile.id ?? "";

    if (resolved && resolved.startsWith("UMK")) {
      return resolved;
    }
  } catch {
    // Fall back to supplied candidate below.
  }

  if (candidate && candidate.startsWith("UMK")) {
    return candidate;
  }

  throw new Error("UMKM ID tidak ditemukan. Silakan lengkapi/aktifkan profil UMKM terlebih dahulu.");
}

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
export async function enrollTraining(
  data: EnrollRequest,
): Promise<{ message: string; enrollment: Enrollment; already_enrolled?: boolean }> {
  const umkmId = await resolveCurrentUmkmId(data.umkm_id);

  const beforeResponse = await http.get(`${ENROLLMENT_BASE}/user/${umkmId}`, { service: "training" });
  const before = GetUserEnrollmentsResponseSchema.parse(beforeResponse).enrollments;
  const alreadyBefore = before.some((e) => e.pelatihan_id === data.pelatihan_id);

  const response = await http.post(
    `${TRAINING_BASE}/enroll`,
    { ...data, umkm_id: umkmId },
    { service: "training" },
  );

  const parsed = EnrollResponseSchema.parse(response);

  return {
    ...parsed,
    already_enrolled: alreadyBefore,
  };
}

// ─── Enrollment API Functions ─────────────────────────────────────────────────

/**
 * Get user enrollments
 * @param umkmId - UMKM ID
 * @returns Promise<Enrollment[]>
 */
export async function getUserEnrollments(umkmId: string): Promise<Enrollment[]> {
  const resolvedUmkmId = await resolveCurrentUmkmId(umkmId);
  const response = await http.get(`${ENROLLMENT_BASE}/user/${resolvedUmkmId}`, { service: "training" });
  const validated = GetUserEnrollmentsResponseSchema.parse(response);

  return [...validated.enrollments].sort((a, b) => {
    const dateA = new Date(a.tanggal_daftar ?? 0).getTime();
    const dateB = new Date(b.tanggal_daftar ?? 0).getTime();
    return dateB - dateA;
  });
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
