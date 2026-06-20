import { describe, it, expect } from "vitest";
import {
  CertificateSchema,
  CertificateDashboardSchema,
  GetCertificatesResponseSchema,
  RequestCertificateResponseSchema,
} from "../types";

const validCertificate = {
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

const validDashboard = {
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

describe("CertificateSchema", () => {
  it("parses valid certificate data", () => {
    const result = CertificateSchema.parse(validCertificate);
    expect(result.sertifikat_id).toBe(1);
    expect(result.nomor_sertifikat).toBe("SER-2024-001");
    expect(result.progress_persen).toBe(100);
  });

  it("accepts nullable fields as null", () => {
    const input = { ...validCertificate, nomor_sertifikat: null, dokumen_url: null, catatan_validasi: null };
    const result = CertificateSchema.parse(input);
    expect(result.nomor_sertifikat).toBeNull();
    expect(result.dokumen_url).toBeNull();
    expect(result.catatan_validasi).toBeNull();
  });

  it("rejects missing required fields", () => {
    const { sertifikat_id, ...incomplete } = validCertificate;
    expect(() => CertificateSchema.parse(incomplete)).toThrow();
  });

  it("rejects wrong type for sertifikat_id", () => {
    const input = { ...validCertificate, sertifikat_id: "1" };
    expect(() => CertificateSchema.parse(input)).toThrow();
  });
});

describe("CertificateDashboardSchema", () => {
  it("parses valid dashboard data", () => {
    const result = CertificateDashboardSchema.parse(validDashboard);
    expect(result.umkm_id).toBe("UMK000001");
    expect(result.total_pelatihan).toBe(5);
    expect(result.sertifikat_terbit).toBe(1);
  });

  it("accepts nullable date fields", () => {
    const input = { ...validDashboard, pelatihan_terakhir_selesai: null, sertifikat_terakhir_terbit: null };
    const result = CertificateDashboardSchema.parse(input);
    expect(result.pelatihan_terakhir_selesai).toBeNull();
    expect(result.sertifikat_terakhir_terbit).toBeNull();
  });

  it("rejects missing required fields", () => {
    const { umkm_id, ...incomplete } = validDashboard;
    expect(() => CertificateDashboardSchema.parse(incomplete)).toThrow();
  });
});

describe("GetCertificatesResponseSchema", () => {
  it("parses valid response with certificate array", () => {
    const input = { certificates: [validCertificate] };
    const result = GetCertificatesResponseSchema.parse(input);
    expect(result.certificates).toHaveLength(1);
    expect(result.certificates[0].sertifikat_id).toBe(1);
  });

  it("accepts empty certificates array", () => {
    const input = { certificates: [] };
    const result = GetCertificatesResponseSchema.parse(input);
    expect(result.certificates).toHaveLength(0);
  });
});

describe("RequestCertificateResponseSchema", () => {
  it("parses valid response with message and certificate", () => {
    const input = { message: "Pengajuan sertifikat berhasil", certificate: validCertificate };
    const result = RequestCertificateResponseSchema.parse(input);
    expect(result.message).toBe("Pengajuan sertifikat berhasil");
    expect(result.certificate.sertifikat_id).toBe(1);
  });
});
