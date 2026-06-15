import { z } from "zod";

export const CertificateSchema = z.object({
  sertifikat_id: z.number(),
  pendaftaran_pelatihan_id: z.string(),
  nomor_sertifikat: z.string().nullable(),
  tanggal_pengajuan: z.string().nullable(),
  tanggal_terbit: z.string().nullable(),
  status_sertifikat_id: z.string(),
  nama_status_sertifikat: z.string(),
  dokumen_id: z.string().nullable(),
  dokumen_url: z.string().nullable(),
  catatan_validasi: z.string().nullable(),
  pelatihan_id: z.string(),
  judul_pelatihan: z.string(),
  jenis_pelatihan: z.string(),
  tanggal_selesai_pelatihan: z.string().nullable(),
  progress_persen: z.number(),
  umkm_id: z.string(),
  nama_umkm: z.string(),
  pelaku_nama: z.string(),
});

export const CertificateDashboardSchema = z.object({
  umkm_id: z.string(),
  nama_umkm: z.string(),
  pelaku_nama: z.string(),
  total_pelatihan: z.number(),
  pelatihan_selesai: z.number(),
  total_sertifikat: z.number(),
  sertifikat_terbit: z.number(),
  pelatihan_terakhir_selesai: z.string().nullable(),
  sertifikat_terakhir_terbit: z.string().nullable(),
});

export const GetCertificatesResponseSchema = z.object({
  certificates: z.array(CertificateSchema),
});

export const RequestCertificateResponseSchema = z.object({
  message: z.string(),
  certificate: CertificateSchema,
});

export type Certificate = z.infer<typeof CertificateSchema>;
export type CertificateDashboard = z.infer<typeof CertificateDashboardSchema>;
