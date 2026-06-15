export type PartnershipStatus = 
  | "DRAFT"
  | "SUBMITTED"
  | "REVIEWED"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "WAITING_DOCUMENT";

export type UserRole = "UMKM" | "MITRA";

// Request types
export interface CreatePartnershipRequest {
  receiver_id: string;
  proposal_title: string;
  proposal_description: string;
  attachment_files?: string[];
}

// Response types for status endpoint (UMKM)
export interface PartnershipStatusData {
  pengajuan: Array<{
    pengajuanID: string;
    statusPengajuan: PartnershipStatus;
    tanggalPengajuan: string;
    mitraUmkmTujuan: string;
    proposalTitle?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Response types for incoming endpoint (Mitra)
export interface IncomingPartnershipsData {
  pengajuan_masuk: Array<{
    pengajuanID: string;
    pengirim: string;
    proposal_title: string;
    tanggalPengajuan: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Partner candidate for UI (daftar mitra/UMKM)
export interface PartnerCandidate {
  id: string;
  name: string;
  type: UserRole;
  category: string;
  description: string;
  location: string;
  rating: number;
  totalPortofolio?: number;
  jangkauanPasar?: string;
  tingkatKeberhasilan?: number;
  statusPendaftaran?: "Dibuka" | "Tutup" | "Penuh";
  batasAkhir?: string;
}

// Detail calon mitra/UMKM
export interface PartnerDetail {
  id: string;
  name: string;
  badge: string;
  jenisUsaha: string;
  lokasi: string;
  totalPortofolio: number;
  jangkauan: string;
  tingkatKeberhasilan: number;
  deskripsi: string;
  keuntungan: string[];
  statusPendaftaran: "Dibuka" | "Tutup" | "Penuh";
  batasAkhir?: string;
  email: string;
  telepon: string;
}


export interface PartnershipRequest {
  id: string;
  request_code?: string;
  requester_id?: string;
  receiver_id: string;
  requester_role?: UserRole;
  receiver_role?: UserRole;
  category?: string;
  proposal_title: string;
  proposal_description: string;
  business_name?: string;
  contact_person?: string;
  product_description?: string;
  reason_for_partnership?: string;
  nib_ktp_file?: string;
  proposal_file?: string;
  status: PartnershipStatus;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
  requester_name?: string;
  receiver_name?: string;
  [key: string]: unknown;
}

export interface UpdatePartnershipStatus {
  status: PartnershipStatus;
  catatan?: string;
  rejection_reason?: string;
}

export interface SignPartnershipRequest {
  dokumen_kontrak: string;
  tanda_tangan?: string;
}

// Success response
export interface SuccessResponse {
  status: "success";
  message?: string;
  data?: any;
}

// Error response
export interface ErrorResponse {
  status: "error";
  error_code?: string;
  message: string;
}