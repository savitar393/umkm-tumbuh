import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useTrainings,
  useTraining,
  useTrainingDetail,
  useUserEnrollments,
  useEnrollTraining,
  useUpdateProgress,
  useCompleteTraining,
  trainingKeys,
} from "../hooks";
import * as api from "../api";

vi.mock("../api", () => ({
  getAllTrainings: vi.fn(),
  getTrainingById: vi.fn(),
  getTrainingDetail: vi.fn(),
  enrollTraining: vi.fn(),
  getUserEnrollments: vi.fn(),
  updateProgress: vi.fn(),
  completeTraining: vi.fn(),
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

describe("Training Hooks - Query Keys", () => {
  it("trainingKeys.all is ['trainings']", () => {
    expect(trainingKeys.all).toEqual(["trainings"]);
  });

  it("trainingKeys.list() returns nested keys", () => {
    expect(trainingKeys.list()).toEqual(["trainings", "list"]);
  });

  it("trainingKeys.detail(id) returns id in keys", () => {
    expect(trainingKeys.detail("PLT001")).toEqual(["trainings", "detail", "PLT001"]);
  });

  it("trainingKeys.userEnrollments(id) returns umkmId in keys", () => {
    expect(trainingKeys.userEnrollments("UMK000001")).toEqual(["enrollments", "user", "UMK000001"]);
  });
});

describe("useTrainings", () => {
  it("fetches all trainings on mount", async () => {
    vi.mocked(api.getAllTrainings).mockResolvedValue([mockTraining]);
    const { result } = renderHook(() => useTrainings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].judul_pelatihan).toBe("Pemasaran Digital");
  });

  it("returns error state on API failure", async () => {
    vi.mocked(api.getAllTrainings).mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useTrainings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it("starts in loading state", () => {
    vi.mocked(api.getAllTrainings).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTrainings(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });
});

describe("useTraining", () => {
  it("fetches training by ID", async () => {
    vi.mocked(api.getTrainingById).mockResolvedValue(mockTraining);
    const { result } = renderHook(() => useTraining("PLT001"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pelatihan_id).toBe("PLT001");
  });

  it("does not fetch when id is empty", () => {
    const { result } = renderHook(() => useTraining(""), { wrapper: createWrapper() });
    expect(result.current.isFetching).toBe(false);
  });

  it("returns error on API failure", async () => {
    vi.mocked(api.getTrainingById).mockRejectedValue(new Error("Not found"));
    const { result } = renderHook(() => useTraining("INVALID"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("starts in loading state", () => {
    vi.mocked(api.getTrainingById).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTraining("PLT001"), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });
});

describe("useTrainingDetail", () => {
  it("fetches training detail with modules", async () => {
    const mockDetail = { training: mockTraining, modules: [] };
    vi.mocked(api.getTrainingDetail).mockResolvedValue(mockDetail);
    const { result } = renderHook(() => useTrainingDetail("PLT001"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.training.pelatihan_id).toBe("PLT001");
  });
});

describe("useUserEnrollments", () => {
  it("fetches user enrollments", async () => {
    vi.mocked(api.getUserEnrollments).mockResolvedValue([mockEnrollment]);
    const { result } = renderHook(() => useUserEnrollments("UMK000001"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].status_pendaftaran).toBe("Terdaftar");
  });
});

describe("useEnrollTraining", () => {
  it("calls enrollTraining mutation", async () => {
    const mockResponse = { message: "Berhasil mendaftar pelatihan", enrollment: mockEnrollment };
    vi.mocked(api.enrollTraining).mockResolvedValue(mockResponse);
    const { result } = renderHook(() => useEnrollTraining(), { wrapper: createWrapper() });
    result.current.mutate({ umkm_id: "UMK000001", pelatihan_id: "PLT001" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.enrollTraining).toHaveBeenCalledWith({ umkm_id: "UMK000001", pelatihan_id: "PLT001" });
  });
});

describe("useUpdateProgress", () => {
  it("calls updateProgress mutation", async () => {
    vi.mocked(api.updateProgress).mockResolvedValue({ message: "Progress berhasil diperbarui" });
    const { result } = renderHook(() => useUpdateProgress(), { wrapper: createWrapper() });
    result.current.mutate({ pendaftaran_pelatihan_id: "DFTR001", modul_selesai: 4, total_modul: 8 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.updateProgress).toHaveBeenCalledWith({ pendaftaran_pelatihan_id: "DFTR001", modul_selesai: 4, total_modul: 8 });
  });
});

describe("useCompleteTraining", () => {
  it("calls completeTraining mutation", async () => {
    vi.mocked(api.completeTraining).mockResolvedValue({ message: "Pelatihan berhasil diselesaikan" });
    const { result } = renderHook(() => useCompleteTraining(), { wrapper: createWrapper() });
    result.current.mutate({ pendaftaran_pelatihan_id: "DFTR001" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.completeTraining).toHaveBeenCalledWith({ pendaftaran_pelatihan_id: "DFTR001" });
  });
});
