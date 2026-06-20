import { describe, it, expect, vi, beforeEach } from "vitest";
import { http } from "../../../shared/api/http";
import {
  getAllTrainings,
  getTrainingById,
  getTrainingDetail,
  enrollTraining,
  getUserEnrollments,
  updateProgress,
  completeTraining,
} from "../api";

vi.mock("../../../shared/api/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockTraining = {
  pelatihan_id: "PLT001",
  kode_pelatihan: "TRN-2024-001",
  judul_pelatihan: "Pemasaran Digital",
  deskripsi_pelatihan: "Deskripsi",
  mentor_nama: "Budi",
  durasi_jam: 20,
  total_modul: 8,
  harga: 0,
  akses_seumur_hidup: false,
  masa_akses_hari: 90,
  rating_rata_rata: 4.5,
  jumlah_alumni: 150,
  thumbnail_url: "https://example.com/thumb.jpg",
  syarat_ketentuan: "Syarat",
  tanggal_publish: "2024-01-15T00:00:00Z",
  jenis_pelatihan: "Online",
  status_pelatihan: "Published",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-15T00:00:00Z",
};

const mockEnrollment = {
  pendaftaran_pelatihan_id: "DFTR001",
  umkm_id: "UMK000001",
  pelatihan_id: "PLT001",
  judul_pelatihan: "Pemasaran Digital",
  status_pendaftaran: "Terdaftar",
  tanggal_daftar: "2024-06-10T10:30:00Z",
  akses_mulai_at: "2024-06-10T10:30:00Z",
  akses_berakhir_at: "2024-09-08T10:30:00Z",
  terakhir_diakses_at: null,
  progress_persen: 50,
  modul_selesai: 4,
  total_modul_snapshot: 8,
  tanggal_selesai: null,
};

describe("Training API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllTrainings", () => {
    it("calls GET /trainings with training service", async () => {
      vi.mocked(http.get).mockResolvedValue({ trainings: [mockTraining] });
      const result = await getAllTrainings();
      expect(http.get).toHaveBeenCalledWith("/trainings", { service: "training" });
      expect(result).toHaveLength(1);
      expect(result[0].judul_pelatihan).toBe("Pemasaran Digital");
    });

    it("throws on invalid response", async () => {
      vi.mocked(http.get).mockResolvedValue({ invalid: true });
      await expect(getAllTrainings()).rejects.toThrow();
    });
  });

  describe("getTrainingById", () => {
    it("calls GET /trainings/{id}", async () => {
      vi.mocked(http.get).mockResolvedValue(mockTraining);
      const result = await getTrainingById("PLT001");
      expect(http.get).toHaveBeenCalledWith("/trainings/PLT001", { service: "training" });
      expect(result.pelatihan_id).toBe("PLT001");
    });

    it("throws on invalid response", async () => {
      vi.mocked(http.get).mockResolvedValue({ invalid: true });
      await expect(getTrainingById("PLT001")).rejects.toThrow();
    });
  });

  describe("getTrainingDetail", () => {
    it("calls GET /trainings/{id}/detail", async () => {
      const mockDetail = { training: mockTraining, modules: [] };
      vi.mocked(http.get).mockResolvedValue(mockDetail);
      const result = await getTrainingDetail("PLT001");
      expect(http.get).toHaveBeenCalledWith("/trainings/PLT001/detail", { service: "training" });
      expect(result.training.pelatihan_id).toBe("PLT001");
    });

    it("throws on invalid response", async () => {
      vi.mocked(http.get).mockResolvedValue({ invalid: true });
      await expect(getTrainingDetail("PLT001")).rejects.toThrow();
    });
  });

  describe("enrollTraining", () => {
    it("calls POST /trainings/enroll with body", async () => {
      const enrollData = { umkm_id: "UMK000001", pelatihan_id: "PLT001" };
      const mockResponse = { message: "Berhasil mendaftar pelatihan", enrollment: mockEnrollment };
      vi.mocked(http.post).mockResolvedValue(mockResponse);
      const result = await enrollTraining(enrollData);
      expect(http.post).toHaveBeenCalledWith("/trainings/enroll", enrollData, { service: "training" });
      expect(result.message).toBe("Berhasil mendaftar pelatihan");
    });

    it("throws on invalid response", async () => {
      vi.mocked(http.post).mockResolvedValue({ invalid: true });
      await expect(enrollTraining({ umkm_id: "UMK000001", pelatihan_id: "PLT001" })).rejects.toThrow();
    });
  });

  describe("getUserEnrollments", () => {
    it("calls GET /enrollments/user/{umkmId}", async () => {
      vi.mocked(http.get).mockResolvedValue({ enrollments: [mockEnrollment] });
      const result = await getUserEnrollments("UMK000001");
      expect(http.get).toHaveBeenCalledWith("/enrollments/user/UMK000001", { service: "training" });
      expect(result).toHaveLength(1);
    });

    it("throws on invalid response", async () => {
      vi.mocked(http.get).mockResolvedValue({ invalid: true });
      await expect(getUserEnrollments("UMK000001")).rejects.toThrow();
    });
  });

  describe("updateProgress", () => {
    it("calls PATCH /enrollments/progress with body", async () => {
      const progressData = { pendaftaran_pelatihan_id: "DFTR001", modul_selesai: 4, total_modul: 8 };
      vi.mocked(http.patch).mockResolvedValue({ message: "Progress berhasil diperbarui" });
      const result = await updateProgress(progressData);
      expect(http.patch).toHaveBeenCalledWith("/enrollments/progress", progressData, { service: "training" });
      expect(result.message).toBe("Progress berhasil diperbarui");
    });

    it("throws on invalid response", async () => {
      vi.mocked(http.patch).mockResolvedValue({ invalid: true });
      await expect(updateProgress({ pendaftaran_pelatihan_id: "DFTR001", modul_selesai: 4, total_modul: 8 })).rejects.toThrow();
    });
  });

  describe("completeTraining", () => {
    it("calls PATCH /enrollments/complete with body", async () => {
      const completeData = { pendaftaran_pelatihan_id: "DFTR001" };
      vi.mocked(http.patch).mockResolvedValue({ message: "Pelatihan berhasil diselesaikan" });
      const result = await completeTraining(completeData);
      expect(http.patch).toHaveBeenCalledWith("/enrollments/complete", completeData, { service: "training" });
      expect(result.message).toBe("Pelatihan berhasil diselesaikan");
    });

    it("throws on invalid response", async () => {
      vi.mocked(http.patch).mockResolvedValue({ invalid: true });
      await expect(completeTraining({ pendaftaran_pelatihan_id: "DFTR001" })).rejects.toThrow();
    });
  });
});
