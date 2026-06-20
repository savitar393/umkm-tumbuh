import { describe, it, expect } from "vitest";
import {
  TrainingProgramSchema,
  TrainingModuleSchema,
  EnrollmentSchema,
  TrainingDetailSchema,
  GetAllTrainingsResponseSchema,
  GetUserEnrollmentsResponseSchema,
  EnrollResponseSchema,
  UpdateProgressResponseSchema,
  CompleteTrainingResponseSchema,
} from "../types";

const validTraining = {
  pelatihan_id: "PLT001",
  kode_pelatihan: "TRN-2024-001",
  judul_pelatihan: "Pemasaran Digital untuk UMKM",
  deskripsi_pelatihan: "Belajar strategi pemasaran digital",
  mentor_nama: "Budi Santoso",
  durasi_jam: 20,
  total_modul: 8,
  harga: 0,
  akses_seumur_hidup: false,
  masa_akses_hari: 90,
  rating_rata_rata: 4.5,
  jumlah_alumni: 150,
  thumbnail_url: "https://example.com/thumb.jpg",
  syarat_ketentuan: "Syarat dan ketentuan berlaku",
  tanggal_publish: "2024-01-15T00:00:00Z",
  jenis_pelatihan: "Online",
  status_pelatihan: "Published",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-15T00:00:00Z",
};

const validModule = {
  modul_id: "MOD001",
  pelatihan_id: "PLT001",
  urutan_modul: 1,
  judul_modul: "Pengenalan Digital Marketing",
  deskripsi_modul: "Modul pengenalan",
  durasi_menit: 45,
  materi_url: "https://example.com/materi.pdf",
  is_preview: true,
  status_aktif: true,
  judul_pelatihan: "Pemasaran Digital untuk UMKM",
};

const validEnrollment = {
  pendaftaran_pelatihan_id: "DFTR001",
  umkm_id: "UMK000001",
  pelatihan_id: "PLT001",
  judul_pelatihan: "Pemasaran Digital untuk UMKM",
  status_pendaftaran: "Terdaftar",
  tanggal_daftar: "2024-06-10T10:30:00Z",
  akses_mulai_at: "2024-06-10T10:30:00Z",
  akses_berakhir_at: "2024-09-08T10:30:00Z",
  terakhir_diakses_at: null,
  progress_persen: 0,
  modul_selesai: 0,
  total_modul_snapshot: 8,
  tanggal_selesai: null,
};

describe("TrainingProgramSchema", () => {
  it("parses valid training data", () => {
    const result = TrainingProgramSchema.parse(validTraining);
    expect(result.pelatihan_id).toBe("PLT001");
    expect(result.judul_pelatihan).toBe("Pemasaran Digital untuk UMKM");
    expect(result.durasi_jam).toBe(20);
    expect(result.total_modul).toBe(8);
    expect(result.harga).toBe(0);
  });

  it("accepts nullable fields as null", () => {
    const input = { ...validTraining, deskripsi_pelatihan: null, mentor_nama: null };
    const result = TrainingProgramSchema.parse(input);
    expect(result.deskripsi_pelatihan).toBeNull();
    expect(result.mentor_nama).toBeNull();
  });

  it("rejects missing required fields", () => {
    const { pelatihan_id, ...incomplete } = validTraining;
    expect(() => TrainingProgramSchema.parse(incomplete)).toThrow();
  });

  it("rejects wrong type for durasi_jam", () => {
    const input = { ...validTraining, durasi_jam: "20" };
    expect(() => TrainingProgramSchema.parse(input)).toThrow();
  });
});

describe("TrainingModuleSchema", () => {
  it("parses valid module data", () => {
    const result = TrainingModuleSchema.parse(validModule);
    expect(result.modul_id).toBe("MOD001");
    expect(result.urutan_modul).toBe(1);
    expect(result.durasi_menit).toBe(45);
    expect(result.is_preview).toBe(true);
  });

  it("rejects invalid urutan_modul type", () => {
    const input = { ...validModule, urutan_modul: "first" };
    expect(() => TrainingModuleSchema.parse(input)).toThrow();
  });
});

describe("EnrollmentSchema", () => {
  it("parses valid enrollment data", () => {
    const result = EnrollmentSchema.parse(validEnrollment);
    expect(result.pendaftaran_pelatihan_id).toBe("DFTR001");
    expect(result.status_pendaftaran).toBe("Terdaftar");
    expect(result.progress_persen).toBe(0);
  });

  it("accepts nullable date fields", () => {
    const input = { ...validEnrollment, akses_mulai_at: null, tanggal_selesai: null };
    const result = EnrollmentSchema.parse(input);
    expect(result.akses_mulai_at).toBeNull();
    expect(result.tanggal_selesai).toBeNull();
  });

  it("accepts progress number (Zod validates type, not range)", () => {
    const input = { ...validEnrollment, progress_persen: -1 };
    const result = EnrollmentSchema.parse(input);
    expect(result.progress_persen).toBe(-1);
  });

  it("accepts progress of 100 (completed)", () => {
    const input = { ...validEnrollment, progress_persen: 100, modul_selesai: 8 };
    const result = EnrollmentSchema.parse(input);
    expect(result.progress_persen).toBe(100);
  });
});

describe("TrainingDetailSchema", () => {
  it("parses valid training detail with modules", () => {
    const input = { training: validTraining, modules: [validModule] };
    const result = TrainingDetailSchema.parse(input);
    expect(result.training.pelatihan_id).toBe("PLT001");
    expect(result.modules).toHaveLength(1);
    expect(result.modules[0].judul_modul).toBe("Pengenalan Digital Marketing");
  });

  it("accepts empty modules array", () => {
    const input = { training: validTraining, modules: [] };
    const result = TrainingDetailSchema.parse(input);
    expect(result.modules).toHaveLength(0);
  });
});

describe("Response Schemas", () => {
  it("GetAllTrainingsResponseSchema parses valid response", () => {
    const input = { trainings: [validTraining] };
    const result = GetAllTrainingsResponseSchema.parse(input);
    expect(result.trainings).toHaveLength(1);
  });

  it("GetUserEnrollmentsResponseSchema parses valid response", () => {
    const input = { enrollments: [validEnrollment] };
    const result = GetUserEnrollmentsResponseSchema.parse(input);
    expect(result.enrollments).toHaveLength(1);
  });

  it("EnrollResponseSchema parses valid response", () => {
    const input = { message: "Berhasil mendaftar pelatihan", enrollment: validEnrollment };
    const result = EnrollResponseSchema.parse(input);
    expect(result.message).toBe("Berhasil mendaftar pelatihan");
  });

  it("UpdateProgressResponseSchema parses valid response", () => {
    const input = { message: "Progress berhasil diperbarui" };
    const result = UpdateProgressResponseSchema.parse(input);
    expect(result.message).toBe("Progress berhasil diperbarui");
  });

  it("CompleteTrainingResponseSchema parses valid response", () => {
    const input = { message: "Pelatihan berhasil diselesaikan" };
    const result = CompleteTrainingResponseSchema.parse(input);
    expect(result.message).toBe("Pelatihan berhasil diselesaikan");
  });
});
