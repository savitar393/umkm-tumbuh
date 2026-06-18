import { userHttp } from "../../shared/api/userHttp";

export type DashboardPeriod = {
  from: string;
  to: string;
  range: string;
};

export type DashboardMetrics = {
  total_omzet: number;
  total_profit: number;
  total_item: number;
  transaction_count: number;
  average_order: number;
  active_products: number;
  total_stock: number;
  low_stock_count: number;
};

export type DashboardRecentSale = {
  id: string;
  transaction_number: string;
  transaction_date: string;
  total_omzet: number;
  total_profit: number;
  total_item: number;
  status: string;
};

export type DashboardTopProduct = {
  product_id: string;
  product_name: string;
  total_sold: number;
  total_revenue: number;
};

export type DashboardDailySale = {
  date: string;
  total_omzet: number;
  total_profit: number;
  total_item: number;
};

export type DashboardLowStockProduct = {
  product_id: string;
  product_name: string;
  stock: number;
  status: string;
};

export type UMKMDashboardSummary = {
  period: DashboardPeriod;
  metrics: DashboardMetrics;
  recent_sales: DashboardRecentSale[];
  top_products: DashboardTopProduct[];
  daily_sales: DashboardDailySale[];
  low_stock_products: DashboardLowStockProduct[];
};

export function getUMKMDashboardSummary(params?: {
  range?: "today" | "7d" | "30d" | "month";
  from?: string;
  to?: string;
}) {
  const search = new URLSearchParams();

  if (params?.range) search.set("range", params.range);
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);

  const suffix = search.toString() ? `?${search.toString()}` : "";

  return userHttp<{ summary: UMKMDashboardSummary }>(
    `/dashboard/umkm/summary${suffix}`,
  );
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
  return userHttp<UMKMDashboardData>(`/dashboard/umkm?${params.toString()}`);
}

export function checkProfileExists(): Promise<boolean> {
  return userHttp<unknown>("/profiles/me")
    .then(() => true)
    .catch(() => false);
}

export function getMitraDashboard(umkmId?: string): Promise<MitraDashboardData> {
  const params = new URLSearchParams();
  if (umkmId) params.set("umkm_id", umkmId);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return userHttp<MitraDashboardData>(`/dashboard/mitra${qs}`);
}
