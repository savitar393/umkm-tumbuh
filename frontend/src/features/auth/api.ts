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
  | "PRODUCT_IMAGE"
  | "CERTIFICATE"
  | "PARTNERSHIP_FILE"
  | "GENERAL_DOCUMENT";

export type UploadedDocument = {
  id: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  public_url?: string;
};

export async function uploadRegistrationDocument(file: File, category: string) {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    "";

  const formData = new FormData();
  formData.append("category", category);
  formData.append("file", file);

  const response = await fetch("/api/v1/documents/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // IMPORTANT: do NOT set Content-Type for FormData
    },
    body: formData,
  });

  const text = await response.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Upload gagal dengan status ${response.status}`
    );
  }

  return data;
}
export type UmkmRegistrationDetailsPayload = {
  business_name: string;
  business_category?: string;
  jenis_umkm_id?: string;
  business_description?: string;
  owner_name?: string;
  phone_number?: string;
  nik?: string;
  address?: string;
  city?: string;
  province?: string;
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
  
  address?: string | null;
  city?: string | null;
  province?: string | null;

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