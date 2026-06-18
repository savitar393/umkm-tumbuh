import { userHttp as http } from "../../shared/api/userHttp";
import { documentHttp } from "../../shared/api/documentHttp";

export type Product = {
  id: string;
  umkm_id: string;
  category_id: string;
  category_name: string;
  category?: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  status: string;
  legalitas?: string | null;
  legality?: string | null;
  thumbnail_url?: string | null;
  thumbnail_object_key?: string | null;
  thumbnail_content_type?: string | null;
  thumbnail_size_bytes?: number | null;
  thumbnail_updated_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductPayload = {
  name: string;
  category_name: string;
  description?: string;
  price: number;
  initial_stock?: number;
  status?: string;
  legalitas?: string;
};

export type UpdateProductPayload = {
  name: string;
  category_name: string;
  description?: string;
  price: number;
  status?: string;
  legalitas?: string;
};

export type UpdateStockPayload = {
  type: "RESTOCK" | "ADJUSTMENT";
  quantity: number;
  note?: string;
};

export type DocumentUploadResponse = {
  message: string;
  document: {
    id: string;
    uploader_akun_id: string;
    uploader_role: string;
    kategori_dokumen: string;
    bucket_name: string;
    object_key: string;
    original_filename: string;
    content_type: string;
    size_bytes: number;
    public_url?: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  };
};

export function getProducts(params?: { q?: string; status?: string }) {
  const search = new URLSearchParams();

  if (params?.q) search.set("q", params.q);
  if (params?.status) search.set("status", params.status);

  const suffix = search.toString() ? `?${search.toString()}` : "";

  return http<{ products: Product[] }>(`/products${suffix}`);
}

export function createProduct(payload: ProductPayload) {
  return http<{ product: Product }>("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getProduct(id: string) {
  return http<{ product: Product }>(`/products/${id}`);
}

export function updateProduct(id: string, payload: UpdateProductPayload) {
  return http<{ product: Product }>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function updateProductStock(id: string, payload: UpdateStockPayload) {
  return http<{ product: Product }>(`/products/${id}/stock`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteProduct(id: string) {
  return http<{ message: string }>(`/products/${id}`, {
    method: "DELETE",
  });
}

export async function uploadProductThumbnail(id: string, file: File) {
  const formData = new FormData();
  formData.append("category", "PRODUCT_IMAGE");
  formData.append("file", file);

  const uploadResponse = await documentHttp<DocumentUploadResponse>(
    "/documents/upload",
    {
      method: "POST",
      body: formData,
      skipJsonContentType: true,
    },
  );

  return http<{ message: string; product: Product }>(`/products/${id}/thumbnail`, {
    method: "PATCH",
    body: JSON.stringify({
      document_id: uploadResponse.document.id,
      object_key: uploadResponse.document.object_key,
      public_url: uploadResponse.document.public_url,
      content_type: uploadResponse.document.content_type,
      size_bytes: uploadResponse.document.size_bytes,
    }),
  });
}
