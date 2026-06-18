import { httpUser, USER_API } from "../../shared/api/http";

export type DocumentType = "NIB" | "NPWP" | "SIUP" | "SERTIFIKASI_HALAL" | "LEGALITAS" | "SURAT_KOMITMEN" | "PROFIL_PERUSAHAAN" | "LOGO" | "FOTO_USAHA";

export type DocumentStatus = "UPLOADED" | "VERIFIED" | "REJECTED";

export type DocumentItem = {
  id: string;
  user_id: string;
  document_type: DocumentType;
  file_name: string;
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
};

export type ChecklistItem = {
  label: string;
  uploaded: boolean;
  doc_id?: string;
};

export function uploadDocument(file: File, documentType: DocumentType) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("document_type", documentType);

  const token = localStorage.getItem("access_token");

  return fetch(`${USER_API}/profile/umkm/documents`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Upload failed");
    }
    return data as { status: string; document: DocumentItem; checklist: ChecklistItem[] };
  });
}

export function uploadMitraDocument(file: File, documentType: DocumentType) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("document_type", documentType);

  const token = localStorage.getItem("access_token");

  return fetch(`${USER_API}/profile/mitra/documents`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Upload failed");
    }
    return data as { status: string; document: DocumentItem; checklist: ChecklistItem[] };
  });
}

export function getMyDocuments() {
  return httpUser<{ documents: DocumentItem[]; checklist: ChecklistItem[] }>("/documents/");
}

// Fetches document via authenticated request → creates a blob URL → opens in new tab.
// This is necessary because window.open() cannot set Authorization headers.
export async function viewDocument(docID: string): Promise<void> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${USER_API}/documents/${docID}/view`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "Gagal membuka dokumen");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank");
  if (!opened) {
    // Popup blocked — fall back to download
    const a = document.createElement("a");
    a.href = url;
    a.download = `dokumen_${docID}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// Fetches document via authenticated request → creates a blob URL → triggers download.
export async function downloadDocument(docID: string, fileName = "dokumen"): Promise<void> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${USER_API}/documents/${docID}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "Gagal mengunduh dokumen");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function deleteDocument(docID: string) {
  return httpUser<{ status: string; message: string }>(`/documents/${docID}`, {
    method: "DELETE",
  });
}
