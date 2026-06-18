import { httpUser } from "../../shared/api/http";

export type MitraProfile = {
  id: string;
  user_id: string;
  name: string;           // organization_name
  category: string | null; // organization_type
  description: string | null; // jenis_dukungan
  person: string | null;  // contact_person
  phone_number: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  created_at: string;
  updated_at: string;
};

export type MitraProfilePayload = {
  organization_name: string;
  organization_type?: string;
  description?: string;
  contact_person?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  province?: string;
};

export function getProfile() {
  return httpUser<{ profile: MitraProfile }>("/profiles/me");
}

export function updateProfile(payload: MitraProfilePayload) {
  return httpUser<{ profile: MitraProfile }>("/profiles/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
