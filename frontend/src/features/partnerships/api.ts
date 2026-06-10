import { http } from "../../shared/api/http";
import type { CreatePartnershipRequest, PartnershipStatus } from "./types";

interface SuccessResponse<T> {
  status: "success";
  message?: string;
  data: T;
}

interface ErrorResponse {
  status: "error";
  error_code?: string;
  message: string;
}

export interface PartnershipStatusResponse {
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

export interface IncomingPartnershipsResponse {
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

const API_BASE = "/api/v1/partnerships";

export const partnershipsApi = {
  // POST /api/v1/partnerships - Submit pengajuan kemitraan
  create: async (data: CreatePartnershipRequest): Promise<SuccessResponse<{ pengajuanID: string }>> => {
    return http.post<SuccessResponse<{ pengajuanID: string }>>(API_BASE, data);
  },

  // GET /api/v1/partnerships/status - Status pengajuan (UMKM)
  getStatus: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<SuccessResponse<PartnershipStatusResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    
    const url = `${API_BASE}/status${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return http.get<SuccessResponse<PartnershipStatusResponse>>(url);
  },

  // GET /api/v1/partnerships/incoming - Daftar pengajuan masuk (Mitra)
  getIncoming: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<SuccessResponse<IncomingPartnershipsResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    
    const url = `${API_BASE}/incoming${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return http.get<SuccessResponse<IncomingPartnershipsResponse>>(url);
  },

  // GET /api/v1/partnerships/{id} - Detail pengajuan kemitraan
  getDetail: async (id: string): Promise<SuccessResponse<any>> => {
    return http.get<SuccessResponse<any>>(`${API_BASE}/${id}`);
  },

  // POST /api/v1/partnerships/{id}/sign - Upload dokumen & tanda tangan
  sign: async (id: string, dokumenKontrak: string, tandaTangan?: string): Promise<SuccessResponse<void>> => {
    return http.post<SuccessResponse<void>>(`${API_BASE}/${id}/sign`, {
      dokumen_kontrak: dokumenKontrak,
      tanda_tangan: tandaTangan,
    });
  },

  // PATCH /api/v1/partnerships/{id}/approve - Setujui kemitraan
  approve: async (id: string, catatan?: string): Promise<SuccessResponse<void>> => {
    return http.patch<SuccessResponse<void>>(`${API_BASE}/${id}/approve`, { 
      catatan: catatan,
    });
  },

  // PATCH /api/v1/partnerships/{id}/reject - Tolak kemitraan
  reject: async (id: string, rejection_reason: string): Promise<SuccessResponse<void>> => {
    return http.patch<SuccessResponse<void>>(`${API_BASE}/${id}/reject`, { 
      rejection_reason: rejection_reason,
    });
  },
};