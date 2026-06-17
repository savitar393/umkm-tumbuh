import { http } from "../../shared/api/http";

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
  tgl_terkini: string;
  total_omzet_hari_ini: number;
  total_omzet_kemarin: number;
  persen_vs_kemarin: number;
  omzet_bulan_ini: number;
  omzet_bulan_lalu: number;
  persen_vs_bulan_lalu: number;
  total_item_terjual: number;
  rata_rata_per_item: number;
  laba_harian: LabaHarianItem[];
  tren_mingguan: TrenMingguan[];
  total_hari: number;
  filter_bulan: string;
  filter_tahun: number;
  date_from: string;
  date_to: string;
  trend_days: number;
};

// ─── Mitra Dashboard Types ─────────────────────────────────────────────────

export type UMKMMitraItem = {
  umkm_id: string;
  nama_umkm: string;
};

export type UMKMDashboardForMitra = {
  umkm_id: string;
  nama_umkm: string;
  kategori_usaha: string;
  tgl_terkini: string;
  total_omzet_hari_ini: number;
  total_omzet_kemarin: number;
  persen_vs_kemarin: number;
  omzet_bulan_ini: number;
  omzet_bulan_lalu: number;
  persen_vs_bulan_lalu: number;
  total_item_terjual: number;
  rata_rata_per_item: number;
  laba_harian: LabaHarianItem[];
  tren_mingguan: TrenMingguan[];
  total_hari: number;
  date_from: string;
  date_to: string;
  trend_days: number;
};

export type MitraDashboardData = {
  nama_mitra: string;
  umkm_list: UMKMMitraItem[];
  dashboard: UMKMDashboardForMitra | null;
};

// ─── API Calls ─────────────────────────────────────────────────────────────

export function getUMKMDashboard(dateFrom: string, dateTo: string): Promise<UMKMDashboardData> {
  const params = new URLSearchParams();
  params.set("date_from", dateFrom);
  params.set("date_to", dateTo);
  return http<UMKMDashboardData>(`/dashboard/umkm?${params.toString()}`, { auth: true, useUserApi: true });
}

export function checkProfileExists(): Promise<boolean> {
  return http<unknown>("/profiles/me", { auth: true, useUserApi: true })
    .then(() => true)
    .catch(() => false);
}

export function getMitraDashboard(umkmId?: string, dateFrom?: string, dateTo?: string): Promise<MitraDashboardData> {
  const params = new URLSearchParams();
  if (umkmId) params.set("umkm_id", umkmId);
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return http<MitraDashboardData>(`/dashboard/mitra${qs}`, { auth: true, useUserApi: true });
}
