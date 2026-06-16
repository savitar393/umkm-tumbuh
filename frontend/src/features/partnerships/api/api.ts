import { http } from "../../../shared/api/http";
import type { CreatePartnershipRequest, PartnershipStatus } from "../types";

interface SuccessResponse<T> {
  status: "success";
  message?: string;
  data: T;
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

export interface PartnerListItem {
  id: string;
  name: string;
  type: string;
  city: string;
  province: string;
  description: string | null;
  operational_area?: string | null;
}

export interface PartnerListResponse {
  mitra?: PartnerListItem[];
  umkm?: PartnerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const API_BASE = "/partnerships";

export const partnershipsApi = {
  create: async (data: CreatePartnershipRequest): Promise<SuccessResponse<{ pengajuanID: string }>> => {
    return http.post<SuccessResponse<{ pengajuanID: string }>>(API_BASE, data);
  },

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

  getDetail: async (id: string): Promise<SuccessResponse<any>> => {
    return http.get<SuccessResponse<any>>(`${API_BASE}/${id}`);
  },

  sign: async (id: string, dokumenKontrak: string, tandaTangan?: string): Promise<SuccessResponse<void>> => {
    return http.post<SuccessResponse<void>>(`${API_BASE}/${id}/sign`, {
      dokumen_kontrak: dokumenKontrak,
      tanda_tangan: tandaTangan,
    });
  },

  approve: async (id: string, catatan?: string): Promise<SuccessResponse<void>> => {
    return http.patch<SuccessResponse<void>>(`${API_BASE}/${id}/approve`, { 
      catatan: catatan,
    });
  },

  reject: async (id: string, rejection_reason: string): Promise<SuccessResponse<void>> => {
    return http.patch<SuccessResponse<void>>(`${API_BASE}/${id}/reject`, { 
      rejection_reason: rejection_reason,
    });
  },

  // ============================================================
  // LIST MITRA - untuk UMKM users
  // ============================================================
  listMitra: async (params?: {
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<PartnerListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.append("q", params.q);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    
    const url = `/mitra${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    
    // http.get sudah mengembalikan response langsung dari backend
    // Backend mengembalikan: { success, message, data: { mitra, pagination } }
    const response = await http.get<any>(url);
    
    console.log("listMitra raw response:", response);
    
    // Response dari backend: { success: true, message: "", data: { mitra, pagination } }
    if (response && response.data) {
      return {
        mitra: response.data.mitra,
        pagination: response.data.pagination,
      };
    }
    
    // Fallback jika response berbeda
    return {
      mitra: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  },

  // ============================================================
  // LIST UMKM - untuk MITRA users
  // ============================================================
  listUMKM: async (params?: {
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<PartnerListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.append("q", params.q);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    
    const url = `/umkm${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    
    // http.get sudah mengembalikan response langsung dari backend
    // Backend mengembalikan: { success, message, data: { umkm, pagination } }
    const response = await http.get<any>(url);
    
    console.log("listUMKM raw response:", response);
    
    // Response dari backend: { success: true, message: "", data: { umkm, pagination } }
    if (response && response.data) {
      return {
        umkm: response.data.umkm,
        pagination: response.data.pagination,
      };
    }
    
    // Fallback jika response berbeda
    return {
      umkm: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  },
};