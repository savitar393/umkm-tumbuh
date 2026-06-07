import { http } from "../../shared/api/http";

export type UmkmProfile = {
  id: string;
  user_id: string;
  business_name: string;
  business_category: string;
  business_description?: string | null;
  owner_name: string;
  nik: string;
  phone_number: string;
  address: string;
  city: string;
  province: string;
  district?: string | null;
  village?: string | null;
  postal_code?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type UmkmProfilePayload = {
  business_name: string;
  business_category: string;
  business_description?: string;
  owner_name: string;
  nik: string;
  phone_number: string;
  address: string;
  city: string;
  province: string;
  district?: string;
  village?: string;
  postal_code?: string;
};

export function getMyProfile() {
  return http<{ profile: UmkmProfile }>("/profiles/me");
}

export function updateMyProfile(payload: UmkmProfilePayload) {
  return http<{ profile: UmkmProfile }>("/profiles/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
