import { http } from "../../shared/api/http";

export type MitraProfile = {
  id?: string;
  user_id?: string;

  organization_name?: string | null;
  organization_type?: string | null;
  legal_name?: string | null;
  nib?: string | null;
  npwp?: string | null;
  description?: string | null;

  contact_person?: string | null;
  contact_person_title?: string | null;
  phone_number?: string | null;
  email?: string | null;

  address?: string | null;
  city?: string | null;
  province?: string | null;
  district?: string | null;
  village?: string | null;
  postal_code?: string | null;

  operational_area?: string | null;
  cooperation_scale?: string | null;
  status?: string | null;

  created_at?: string;
  updated_at?: string;

  // Legacy/compat fields from older mitra profile implementation
  name?: string | null;
  category?: string | null;
  person?: string | null;
};

export type MitraProfilePayload = {
  organization_name: string;
  organization_type?: string | null;
  legal_name?: string | null;
  nib?: string | null;
  npwp?: string | null;
  description?: string | null;

  contact_person?: string | null;
  contact_person_title?: string | null;
  phone_number?: string | null;

  address?: string | null;
  city?: string | null;
  province?: string | null;
  district?: string | null;
  village?: string | null;
  postal_code?: string | null;

  operational_area?: string | null;
  cooperation_scale?: string | null;
};

export function getProfile() {
  return http<{ profile: MitraProfile }>("/profiles/me", { service: "user" });
}

export function updateProfile(payload: MitraProfilePayload) {
  return http<{ profile: MitraProfile }>("/profiles/me", {
    method: "PUT",
    body: JSON.stringify(payload),
    service: "user",
  });
}
