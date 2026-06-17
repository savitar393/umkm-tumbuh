import { http } from "../../shared/api/http";
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
