import { httpUser } from "../../shared/api/http";

export type UmkmProfile = {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  description: string | null;
  person: string | null;
  phone_number: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  omzet: number | null;
  created_at: string;
  updated_at: string;
};

export type UmkmProfilePayload = {
  business_name: string;
  business_category?: string;
  business_description?: string;
  owner_name?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  province?: string;
  omzet?: number;
};

export function getProfile() {
  return httpUser<{ profile: UmkmProfile }>("/profiles/me");
}

export function updateProfile(payload: UmkmProfilePayload) {
  return httpUser<{ profile: UmkmProfile }>("/profiles/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export type Product = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  stock: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
};

export type ProductPayload = {
  name: string;
  description?: string;
  category?: string;
  price: number;
  stock: number;
  image_url?: string;
};

export function getProducts() {
  return httpUser<{ products: Product[] }>("/products");
}

export function createProduct(payload: ProductPayload) {
  return httpUser<{ message: string; id: string }>("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProduct(id: string, payload: ProductPayload) {
  return httpUser<{ message: string }>("/products/" + id, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteProduct(id: string) {
  return httpUser<{ message: string }>("/products/" + id, {
    method: "DELETE",
  });
}
