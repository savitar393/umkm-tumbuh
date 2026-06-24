import { http } from "../../shared/api/http";

export type UserRole = "UMKM" | "MITRA" | "ADMIN";

export type UserStatus =
  | "MENUNGGU"
  | "DISETUJUI"
  | "DITOLAK"
  | "AKTIF"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type User = {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  nik?: string | null;
  role: UserRole;
  status: UserStatus;
  rejection_reason?: string;
  catatan_validasi?: string;
  is_active: boolean;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
};

export type RegisterPayload = {
  full_name: string;
  email: string;
  phone_number?: string;
  nik?: string;
  password: string;
  role: "UMKM" | "MITRA";
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export function register(payload: RegisterPayload) {
  return http<{ message: string; access_token?: string; token_type?: string; user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
    service: "auth",
  });
}

export function login(payload: LoginPayload) {
  return http<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
    service: "auth",
  });
}

export type ReactivatePayload = {
  email: string;
  password: string;
};

export type ReactivateResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export function reactivate(payload: ReactivatePayload) {
  return http<ReactivateResponse>("/auth/reactivate", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
    service: "auth",
  });
}

export function getMe() {
  return http<User>("/auth/me", {
    service: "auth",
  });
}

export type RegistrationDocumentCategory =
  | "PARTNERSHIP_FILE"
  | "PROFILE_FILE"
  | "REGISTRATION_FILE";

export type UploadedDocument = {
  id: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  public_url?: string;
};

export function uploadRegistrationDocument(
  file: File,
  category: RegistrationDocumentCategory = "PARTNERSHIP_FILE",
) {
  const formData = new FormData();
  formData.append("category", category);
  formData.append("file", file);

  return http<{ document: UploadedDocument; message: string }>("/documents/upload", {
    method: "POST",
    body: formData,
    service: "document",
  });
}

export type UmkmRegistrationDetailsPayload = {
  business_name: string;
  business_category?: string;
  business_description?: string;
  owner_name?: string;
  phone_number?: string;
  nik?: string;
  address?: string;
  products?: string;
  photo_document_id?: string | null;
  legal_document_id?: string | null;
};

export type MitraRegistrationDetailsPayload = {
  organization_name: string;
  organization_type?: string | null;
  legal_name?: string | null;
  nib?: string | null;
  npwp?: string | null;
  description?: string | null;

  contact_person?: string | null;
  contact_person_title?: string | null;
  phone_number?: string | null;
  email?: string | null;

  operational_area?: string | null;
  cooperation_scale?: string | null;
  partnership_field?: string | null;
  support_type?: string | null;

  legal_document_id?: string | null;
  commitment_document_id?: string | null;
  company_profile_document_id?: string | null;
};

export function saveUmkmRegistrationDetails(payload: UmkmRegistrationDetailsPayload) {
  return http<{ profile: unknown; message?: string }>("/profiles/me", {
    method: "PUT",
    body: JSON.stringify(payload),
    service: "user",
  });
}

export function saveMitraRegistrationDetails(payload: MitraRegistrationDetailsPayload) {
  return http<{ profile: unknown; message?: string }>("/profiles/me", {
    method: "PUT",
    body: JSON.stringify(payload),
    service: "user",
  });
}