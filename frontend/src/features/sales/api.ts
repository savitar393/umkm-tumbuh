import { userHttp as http } from "../../shared/api/userHttp";

export type SaleSummary = {
  id: string;
  umkm_id: string;
  transaction_number: string;
  transaction_date: string;
  total_omzet: number;
  total_profit: number;
  total_item: number;
  note?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type SaleItem = {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
};

export type SaleDetail = SaleSummary & {
  items: SaleItem[];
};

export type CreateSalePayload = {
  transaction_date: string;
  total_profit: number;
  note?: string;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
};

export function getSales(params?: { from?: string; to?: string }) {
  const search = new URLSearchParams();

  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);

  const suffix = search.toString() ? `?${search.toString()}` : "";

  return http<{ sales: SaleSummary[] }>(`/sales${suffix}`);
}

export function getSale(id: string) {
  return http<{ sale: SaleDetail }>(`/sales/${id}`);
}

export function createSale(payload: CreateSalePayload) {
  return http<{ sale: SaleDetail }>("/sales", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
