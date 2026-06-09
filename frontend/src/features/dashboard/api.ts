import { http } from "../../shared/api/http";

const USER_API = import.meta.env.VITE_USER_API_BASE_URL ?? "http://localhost:8081/api/v1";

function userHttp<T>(path: string): Promise<T> {
  return http<T>(path, { auth: true } as Parameters<typeof http>[1] & { _base?: string });
}

// Panggil user-service langsung (port 8081)
async function userServiceGet<T>(path: string): Promise<T> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${USER_API}${path}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Terjadi kesalahan");
  return data as T;
}

// ─── UMKM Dashboard Types ──────────────────────────────────────────────────

export type LabaHarianItem = {
  tanggal: string;
  nama_hari: string;
  laba_bersih: number;
  jumlah_produk: number;
};

export type TrenMingguan = {
  hari: string;
  total_laba: number;
};

export type UMKMDashboardData = {
  nama_umkm: string;
  total_omzet_hari_ini: number;
  total_omzet_kemarin: number;
  persen_vs_kemarin: number;
  total_item_terjual: number;
  rata_rata_per_item: number;
  laba_harian: LabaHarianItem[];
  tren_mingguan: TrenMingguan[];
  total_hari: number;
  filter_bulan: string;
  filter_tahun: number;
};

// ─── Mitra Dashboard Types ─────────────────────────────────────────────────

export type UMKMMitraItem = {
  umkm_id: string;
  nama_umkm: string;
};

export type UMKMDashboardForMitra = {
  umkm_id: string;
  nama_umkm: string;
  total_omzet_hari_ini: number;
  total_omzet_kemarin: number;
  persen_vs_kemarin: number;
  total_item_terjual: number;
  rata_rata_per_item: number;
  laba_harian: LabaHarianItem[];
  tren_mingguan: TrenMingguan[];
  total_hari: number;
};

export type MitraDashboardData = {
  nama_mitra: string;
  umkm_list: UMKMMitraItem[];
  dashboard: UMKMDashboardForMitra | null;
};

// ─── API Calls ─────────────────────────────────────────────────────────────

export function getUMKMDashboard(dateFrom?: string, dateTo?: string): Promise<UMKMDashboardData> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return userServiceGet<UMKMDashboardData>(`/dashboard/umkm${qs}`);
}

export function getMitraDashboard(umkmId?: string): Promise<MitraDashboardData> {
  const params = new URLSearchParams();
  if (umkmId) params.set("umkm_id", umkmId);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return userServiceGet<MitraDashboardData>(`/dashboard/mitra${qs}`);
}

// Supaya tidak error TS — export kosong untuk userHttp juga
export { userHttp };
