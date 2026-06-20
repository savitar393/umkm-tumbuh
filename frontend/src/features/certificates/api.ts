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

function getCertificateBaseUrl(): string {
  return import.meta.env.VITE_CERTIFICATE_API_BASE_URL ?? import.meta.env.VITE_TRAINING_API_BASE_URL ?? "http://localhost:8084/api/v1";
}

export function getCertificateDownloadUrl(certId: number): string {
  return `${getCertificateBaseUrl()}/certificates/${certId}/download`;
}

export async function downloadCertificate(certId: number): Promise<void> {
  const url = getCertificateDownloadUrl(certId);
  const token = getAccessToken();
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Gagal mengunduh sertifikat (${response.status})${text ? `: ${text}` : ""}`);
  }
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  const disposition = response.headers.get("Content-Disposition");
  let fileName = `sertifikat_${certId}.pdf`;
  if (disposition) {
    const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"'\n;]+)["']?/i);
    if (match) fileName = decodeURIComponent(match[1]);
  }

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }, 100);
}
