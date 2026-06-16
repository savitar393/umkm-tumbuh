import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useCertificateDashboard,
  useUserCertificates,
  useCertificateDetail,
  useRequestCertificate,
  certificateKeys,
} from "../hooks";
import * as api from "../api";

vi.mock("../api", () => ({
  getUserCertificateDashboard: vi.fn(),
  getUserCertificates: vi.fn(),
  getCertificateById: vi.fn(),
  requestCertificate: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

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

describe("Certificate Hooks - Query Keys", () => {
  it("certificateKeys.all is ['certificates']", () => {
    expect(certificateKeys.all).toEqual(["certificates"]);
  });

  it("certificateKeys.dashboard(id) returns nested keys", () => {
    expect(certificateKeys.dashboard("UMK000001")).toEqual([
      "certificates", "dashboard", "UMK000001",
    ]);
  });

  it("certificateKeys.list(id) returns list key", () => {
    expect(certificateKeys.list("UMK000001")).toEqual([
      "certificates", "list", "UMK000001",
    ]);
  });

  it("certificateKeys.detail(id) returns detail key", () => {
    expect(certificateKeys.detail(1)).toEqual(["certificates", "detail", 1]);
  });
});

describe("useCertificateDashboard", () => {
  it("fetches certificate dashboard", async () => {
    vi.mocked(api.getUserCertificateDashboard).mockResolvedValue(mockDashboard);
    const { result } = renderHook(() => useCertificateDashboard("UMK000001"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total_pelatihan).toBe(5);
    expect(result.current.data?.sertifikat_terbit).toBe(1);
  });

  it("does not fetch when umkmId is empty", () => {
    const { result } = renderHook(() => useCertificateDashboard(""), {
      wrapper: createWrapper(),
    });
    expect(result.current.isFetching).toBe(false);
  });

  it("returns error on API failure", async () => {
    vi.mocked(api.getUserCertificateDashboard).mockRejectedValue(new Error("Gagal load dashboard"));
    const { result } = renderHook(() => useCertificateDashboard("UMK000001"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useUserCertificates", () => {
  it("fetches user certificates list", async () => {
    vi.mocked(api.getUserCertificates).mockResolvedValue([mockCertificate]);
    const { result } = renderHook(() => useUserCertificates("UMK000001"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].sertifikat_id).toBe(1);
  });

  it("returns error on API failure", async () => {
    vi.mocked(api.getUserCertificates).mockRejectedValue(new Error("Gagal load certificates"));
    const { result } = renderHook(() => useUserCertificates("UMK000001"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCertificateDetail", () => {
  it("fetches certificate by id", async () => {
    vi.mocked(api.getCertificateById).mockResolvedValue(mockCertificate);
    const { result } = renderHook(() => useCertificateDetail(1), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.sertifikat_id).toBe(1);
    expect(result.current.data?.nomor_sertifikat).toBe("SER-2024-001");
  });

  it("does not fetch when id is 0 or negative", () => {
    const { result } = renderHook(() => useCertificateDetail(0), {
      wrapper: createWrapper(),
    });
    expect(result.current.isFetching).toBe(false);
  });

  it("returns error on API failure", async () => {
    vi.mocked(api.getCertificateById).mockRejectedValue(new Error("Certificate not found"));
    const { result } = renderHook(() => useCertificateDetail(999), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useRequestCertificate", () => {
  it("calls requestCertificate mutation", async () => {
    const mockResponse = {
      message: "Pengajuan sertifikat berhasil",
      certificate: mockCertificate,
    };
    vi.mocked(api.requestCertificate).mockResolvedValue(mockResponse);
    const { result } = renderHook(() => useRequestCertificate(), {
      wrapper: createWrapper(),
    });
    result.current.mutate("DFTR001");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.requestCertificate).toHaveBeenCalledWith("DFTR001");
    expect(result.current.data?.message).toBe("Pengajuan sertifikat berhasil");
  });
});
