import { describe, it, expect, vi, beforeEach } from "vitest";
import { http } from "../../../shared/api/http";
import {
  getUserCertificateDashboard,
  getUserCertificates,
  getCertificateById,
  requestCertificate,
} from "../api";

vi.mock("../../../shared/api/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockDashboard = {
  umkm_id: "UMK000001",
  nama_umkm: "UMKM Sejahtera",
  pelaku_nama: "Budi Santoso",
  total_pelatihan: 5,
  pelatihan_selesai: 3,
  total_sertifikat: 2,
  sertifikat_terbit: 1,
  pelatihan_terakhir_selesai: "2024-06-01T00:00:00Z",
  sertifikat_terakhir_terbit: "2024-06-15T00:00:00Z",
};

const mockCertificate = {
  sertifikat_id: 1,
  pendaftaran_pelatihan_id: "DFTR001",
  nomor_sertifikat: "SER-2024-001",
  tanggal_pengajuan: "2024-06-15T00:00:00Z",
  tanggal_terbit: "2024-06-20T00:00:00Z",
  status_sertifikat_id: "TERBIT",
  nama_status_sertifikat: "Terbit",
  dokumen_id: "DOC001",
  dokumen_url: "https://example.com/cert.pdf",
  catatan_validasi: null,
  pelatihan_id: "PLT001",
  judul_pelatihan: "Pemasaran Digital",
  jenis_pelatihan: "Online",
  tanggal_selesai_pelatihan: "2024-06-10T00:00:00Z",
  progress_persen: 100,
  umkm_id: "UMK000001",
  nama_umkm: "UMKM Sejahtera",
  pelaku_nama: "Budi Santoso",
};

describe("Certificate API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserCertificateDashboard", () => {
    it("calls GET /certificates/user/{umkmId}/dashboard", async () => {
      vi.mocked(http.get).mockResolvedValue(mockDashboard);
      const result = await getUserCertificateDashboard("UMK000001");
      expect(http.get).toHaveBeenCalledWith(
        "/certificates/user/UMK000001/dashboard",
        { service: "certificate" }
      );
      expect(result.total_pelatihan).toBe(5);
      expect(result.sertifikat_terbit).toBe(1);
    });

    it("throws on invalid response", async () => {
      vi.mocked(http.get).mockResolvedValue({ invalid: true });
      await expect(getUserCertificateDashboard("UMK000001")).rejects.toThrow();
    });
  });

  describe("getUserCertificates", () => {
    it("calls GET /certificates/user/{umkmId}", async () => {
      vi.mocked(http.get).mockResolvedValue({ certificates: [mockCertificate] });
      const result = await getUserCertificates("UMK000001");
      expect(http.get).toHaveBeenCalledWith(
        "/certificates/user/UMK000001",
        { service: "certificate" }
      );
      expect(result).toHaveLength(1);
      expect(result[0].sertifikat_id).toBe(1);
    });

    it("throws on invalid response", async () => {
      vi.mocked(http.get).mockResolvedValue({ invalid: true });
      await expect(getUserCertificates("UMK000001")).rejects.toThrow();
    });
  });

  describe("getCertificateById", () => {
    it("calls GET /certificates/{id}", async () => {
      vi.mocked(http.get).mockResolvedValue(mockCertificate);
      const result = await getCertificateById(1);
      expect(http.get).toHaveBeenCalledWith("/certificates/1", { service: "certificate" });
      expect(result.sertifikat_id).toBe(1);
      expect(result.nomor_sertifikat).toBe("SER-2024-001");
    });

    it("throws on invalid response", async () => {
      vi.mocked(http.get).mockResolvedValue({ invalid: true });
      await expect(getCertificateById(1)).rejects.toThrow();
    });
  });

  describe("requestCertificate", () => {
    it("calls POST /certificates/request with body", async () => {
      const mockResponse = {
        message: "Pengajuan sertifikat berhasil",
        certificate: mockCertificate,
      };
      vi.mocked(http.post).mockResolvedValue(mockResponse);
      const result = await requestCertificate("DFTR001");
      expect(http.post).toHaveBeenCalledWith(
        "/certificates/request",
        { pendaftaran_pelatihan_id: "DFTR001" },
        { service: "certificate" }
      );
      expect(result.message).toBe("Pengajuan sertifikat berhasil");
      expect(result.certificate.sertifikat_id).toBe(1);
    });

    it("throws on invalid response", async () => {
      vi.mocked(http.post).mockResolvedValue({ invalid: true });
      await expect(requestCertificate("DFTR001")).rejects.toThrow();
    });
  });
});
