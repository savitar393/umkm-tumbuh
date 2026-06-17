import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserCertificateDashboard,
  getUserCertificates,
  getCertificateById,
  requestCertificate,
  getCertificateDownloadUrl,
  downloadCertificate,
} from "./api";

export const certificateKeys = {
  all: ["certificates"] as const,
  dashboard: (umkmId: string) => [...certificateKeys.all, "dashboard", umkmId] as const,
  list: (umkmId: string) => [...certificateKeys.all, "list", umkmId] as const,
  detail: (id: number) => [...certificateKeys.all, "detail", id] as const,
};

export function useCertificateDashboard(umkmId: string) {
  return useQuery({
    queryKey: certificateKeys.dashboard(umkmId),
    queryFn: () => getUserCertificateDashboard(umkmId),
    enabled: !!umkmId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUserCertificates(umkmId: string) {
  return useQuery({
    queryKey: certificateKeys.list(umkmId),
    queryFn: () => getUserCertificates(umkmId),
    enabled: !!umkmId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCertificateDetail(certId: number) {
  return useQuery({
    queryKey: certificateKeys.detail(certId),
    queryFn: () => getCertificateById(certId),
    enabled: certId > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRequestCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pendaftaranPelatihanId: string) => requestCertificate(pendaftaranPelatihanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.all });
    },
  });
}
