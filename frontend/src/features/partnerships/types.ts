// frontend/src/features/partnerships/types.ts

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

// Partner candidate for UI
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

// Export semua type yang dibutuhkan
export type { CreatePartnershipRequest as CreatePartnershipRequestType };