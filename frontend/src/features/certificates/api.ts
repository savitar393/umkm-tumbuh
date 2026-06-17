import { http } from "../../shared/api/http";
import { getAccessToken } from "../../shared/auth/currentUser";
import {
  CertificateSchema,
  CertificateDashboardSchema,
  GetCertificatesResponseSchema,
  RequestCertificateResponseSchema,
  type Certificate,
  type CertificateDashboard,
} from "./types";

export async function getUserCertificateDashboard(umkmId: string): Promise<CertificateDashboard> {
  const response = await http.get(`/certificates/user/${umkmId}/dashboard`, { service: "certificate" });
  return CertificateDashboardSchema.parse(response);
}

export async function getUserCertificates(umkmId: string): Promise<Certificate[]> {
  const response = await http.get(`/certificates/user/${umkmId}`, { service: "certificate" });
  const validated = GetCertificatesResponseSchema.parse(response);
  return validated.certificates;
}

export async function getCertificateById(certId: number): Promise<Certificate> {
  const response = await http.get(`/certificates/${certId}`, { service: "certificate" });
  return CertificateSchema.parse(response);
}

export async function requestCertificate(pendaftaranPelatihanId: string): Promise<{ message: string; certificate: Certificate }> {
  const response = await http.post("/certificates/request", { pendaftaran_pelatihan_id: pendaftaranPelatihanId }, { service: "certificate" });
  return RequestCertificateResponseSchema.parse(response);
}

export function getCertificateDownloadUrl(certId: number): string {
  const baseUrl = import.meta.env.VITE_TRAINING_API_URL ?? "http://localhost:8083/api/v1";
  return `${baseUrl}/certificates/${certId}/download`;
}

export async function downloadCertificate(certId: number): Promise<void> {
  const url = getCertificateDownloadUrl(certId);
  const token = getAccessToken();
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error("Gagal mengunduh sertifikat");
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `sertifikat_${certId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
