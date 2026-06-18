import { userHttp as http } from "../../shared/api/userHttp";

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

  return http<{ summary: UMKMDashboardSummary }>(
    `/dashboard/umkm/summary${suffix}`,
  );
}
