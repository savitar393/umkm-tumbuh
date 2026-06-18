import { userHttp as http } from "../../shared/api/userHttp";

export type UmkmProfile = {
  id: string;
  user_id: string;
  business_name: string;
  business_category: string;
  business_description?: string | null;
  established_year?: number | null;
  business_email?: string | null;
  operating_hours?: string | null;
  social_media_marketplace?: string | null;
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
  established_year?: number;
  business_email?: string;
  operating_hours?: string;
  social_media_marketplace?: string;
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

export type MitraProfile = {
  id: string;
  user_id: string;
  organization_name: string;
  organization_type: string;
  legal_name?: string | null;
  nib?: string | null;
  npwp?: string | null;
  description?: string | null;
  contact_person: string;
  contact_person_title?: string | null;
  phone_number: string;
  email?: string | null;
  address: string;
  city: string;
  province: string;
  district?: string | null;
  village?: string | null;
  postal_code?: string | null;
  operational_area?: string | null;
  cooperation_scale?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type MitraProfilePayload = {
  organization_name: string;
  organization_type: string;
  legal_name?: string;
  nib?: string;
  npwp?: string;
  description?: string;
  contact_person: string;
  contact_person_title?: string;
  phone_number: string;
  address: string;
  city: string;
  province: string;
  district?: string;
  village?: string;
  postal_code?: string;
  operational_area?: string;
  cooperation_scale?: string;
};

export function getMyProfile() {
  return http<{ profile: UmkmProfile | MitraProfile }>("/profiles/me");
}

export function updateMyProfile(payload: UmkmProfilePayload | MitraProfilePayload) {
  return http<{ profile: UmkmProfile | MitraProfile }>("/profiles/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
