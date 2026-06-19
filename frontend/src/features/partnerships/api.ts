// frontend/src/features/partnerships/api.ts

import { partnershipHttp as httpPartnerships } from "../../shared/api/partnershipHttp";
import { getAccessToken, getCurrentUser } from "../../shared/auth/currentUser";
import type { CreatePartnershipRequest, PartnershipStatus } from "./types";

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface SuccessResponse<T> {
  success: boolean;
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
    status: string;
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

export interface UMKMDetail {
  id: string;
  name: string;
  type: string;
  city: string;
  province: string;
  description: string;
  operational_area: string;
  owner_name: string;
  phone_number: string;
  email: string;
  address: string;
  products: string;
  year_established: number;
}

export interface MitraDetail {
  id: string;
  name: string;
  type: string;
  city: string;
  province: string;
  description: string;
  operational_area: string;
  owner_name: string;
  phone_number: string;
  email: string;
  address: string;
  products: string;
}

export const partnershipsApi = {
  // POST /api/v1/partnerships
  create: async (data: CreatePartnershipRequest): Promise<BackendResponse<{ pengajuanID: string }>> => {
    console.log("[partnershipsApi.create] Request data:", JSON.stringify(data));
    const resp = await httpPartnerships.post<BackendResponse<{ pengajuanID: string }>>("/partnerships", data);
    console.log("[partnershipsApi.create] Raw response:", JSON.stringify(resp));
    return resp;
  },

  // GET /api/v1/partnerships/status
  getStatus: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<SuccessResponse<PartnershipStatusResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    const url = `/partnerships/status${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return httpPartnerships.get<SuccessResponse<PartnershipStatusResponse>>(url);
  },

  // GET /api/v1/partnerships/incoming
  getIncoming: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<SuccessResponse<IncomingPartnershipsResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    const url = `/partnerships/incoming${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return httpPartnerships.get<SuccessResponse<IncomingPartnershipsResponse>>(url);
  },

  // GET /api/v1/partnerships/{id}
  getDetail: async (id: string): Promise<SuccessResponse<any>> => {
    return httpPartnerships.get<SuccessResponse<any>>(`/partnerships/${id}`);
  },

  // GET /api/v1/partnerships/summary
  getSummary: async (): Promise<SuccessResponse<{ summary: { bermitra: number; menunggu: number; ditolak: number } }>> => {
    return httpPartnerships.get<SuccessResponse<{ summary: { bermitra: number; menunggu: number; ditolak: number } }>>("/partnerships/summary");
  },

  // POST /api/v1/partnerships/{id}/sign
  sign: async (id: string, dokumenKontrak: string): Promise<SuccessResponse<void>> => {
    return httpPartnerships.post<SuccessResponse<void>>(`/partnerships/${id}/sign`, {
      dokumen_kontrak: dokumenKontrak,
    });
  },

  // PATCH /api/v1/partnerships/{id}/read
  markAsRead: async (id: string): Promise<SuccessResponse<void>> => {
    return httpPartnerships.patch<SuccessResponse<void>>(`/partnerships/${id}/read`, {});
  },

  // PATCH /api/v1/partnerships/{id}/approve
  approve: async (id: string): Promise<SuccessResponse<void>> => {
    return httpPartnerships.patch<SuccessResponse<void>>(`/partnerships/${id}/approve`, {});
  },

  // PATCH /api/v1/partnerships/{id}/reject
  reject: async (id: string, rejection_reason: string): Promise<SuccessResponse<void>> => {
    return httpPartnerships.patch<SuccessResponse<void>>(`/partnerships/${id}/reject`, {
      rejection_reason: rejection_reason,
    });
  },

  // GET /api/v1/umkm/{id}
  getUMKMDetail: async (id: string): Promise<SuccessResponse<{ umkm: UMKMDetail }>> => {
    return httpPartnerships.get<SuccessResponse<{ umkm: UMKMDetail }>>(`/umkm/${id}`);
  },

  // GET /api/v1/mitra/{id}
  getMitraDetail: async (id: string): Promise<SuccessResponse<{ mitra: MitraDetail }>> => {
    return httpPartnerships.get<SuccessResponse<{ mitra: MitraDetail }>>(`/mitra/${id}`);
  },

  // GET /api/v1/mitra
  listMitra: async (params?: {
    q?: string;
    filterType?: string;
    page?: number;
    limit?: number;
  }): Promise<PartnerListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.append("q", params.q);
    if (params?.filterType && params.filterType !== "all") queryParams.append("filterType", params.filterType);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const url = `/mitra${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await httpPartnerships.get<BackendResponse<{ mitra: PartnerListItem[]; pagination: any }>>(url);

    return {
      mitra: response.data.mitra,
      pagination: response.data.pagination,
    };
  },

  // GET /api/v1/umkm
  listUMKM: async (params?: {
    q?: string;
    filterType?: string;
    page?: number;
    limit?: number;
  }): Promise<PartnerListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.append("q", params.q);
    if (params?.filterType && params.filterType !== "all") queryParams.append("filterType", params.filterType);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const url = `/umkm${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await httpPartnerships.get<BackendResponse<{ umkm: PartnerListItem[]; pagination: any }>>(url);

    return {
      umkm: response.data.umkm,
      pagination: response.data.pagination,
    };
  },

  // POST /api/v1/documents/upload - upload dokumen
  uploadDocument: async (file: File, uploaderAkunId: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("jenis_dokumen_id", "PERJANJIAN_KERJASAMA");
    formData.append("uploader_akun_id", uploaderAkunId);
    formData.append("owner_type", "PENGAJUAN_KERJASAMA");
    formData.append("owner_id", uploaderAkunId);
    formData.append("context_type", "partnership");
    formData.append("is_public", "false");
    formData.append("display_order", "1");

    const userRole = getCurrentUser()?.role || "UMKM";
    const token = getAccessToken();
    const headers: Record<string, string> = {
      "X-User-Role": userRole,
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const resp = await fetch("/api/v1/documents/upload", {
      method: "POST",
      headers,
      body: formData,
    });
    const json = await resp.json();
    if (!resp.ok) throw new Error(json.message || "Upload gagal");
    return json.data?.dokumen_id || json.data?.DokumenID;
  },
};
