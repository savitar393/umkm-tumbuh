import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, CheckCircle, XCircle, Download, FileText, Clock, Award, Plus, Filter } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "../components/AdminLayout";
import type { Certificate } from "../../certificates/types";
import { downloadCertificate } from "../../certificates/api";
import {
  getCertificateStats,
  listCertificates,
  approveCertificate,
  rejectCertificate,
} from "../api";

type StatusFilterType = "ALL" | "DIAJUKAN" | "TERBIT" | "DITOLAK";

const STATUS_OPTIONS: { value: StatusFilterType; label: string; color: string }[] = [
  { value: "ALL", label: "Semua Status", color: "#6b7280" },
  { value: "DIAJUKAN", label: "Diajukan", color: "#f59e0b" },
  { value: "TERBIT", label: "Terbit", color: "#10b981" },
  { value: "DITOLAK", label: "Ditolak", color: "#ef4444" },
];

function getStatusBadge(status: string) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    DIAJUKAN: { bg: "#fef3c7", color: "#d97706", label: "Diajukan" },
    TERBIT: { bg: "#ecfdf5", color: "#059669", label: "Terbit" },
    DITOLAK: { bg: "#fef2f2", color: "#dc2626", label: "Ditolak" },
  };

  const c = config[status] || { bg: "#f3f4f6", color: "#6b7280", label: status };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 20,
      background: c.bg, color: c.color,
      fontSize: 12, fontWeight: 700, textTransform: "uppercase",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.color }} />
      {c.label}
    </span>
  );
}

export default function AdminCertificatesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [searchText, setSearchText] = useState("");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<StatusFilterType>("ALL");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const limit = 15;

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ["admin", "certificate-stats"],
    queryFn: getCertificateStats,
    staleTime: 60 * 1000,
  });

  const stats = statsData || { diajukan: 0, terbit: 0, ditolak: 0 };

  // Fetch certificates list
  const { data: certData, isLoading } = useQuery({
    queryKey: ["admin", "certificates", appliedStatusFilter, appliedSearchText, page],
    queryFn: () => listCertificates(
      appliedStatusFilter === "ALL" ? "" : appliedStatusFilter,
      page,
      limit,
      appliedSearchText,
    ),
    staleTime: 30 * 1000,
  });

  const handleApplyFilter = () => {
    setAppliedSearchText(searchText);
    setAppliedStatusFilter(statusFilter);
    setPage(1);
  };

  const certificates = certData?.certificates || [];
  const total = certData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: approveCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "certificates"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "certificate-stats"] });
      toast.success("Sertifikat berhasil disetujui");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menyetujui sertifikat");
    },
    onSettled: () => setActionLoadingId(null),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectCertificate(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "certificates"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "certificate-stats"] });
      toast.success("Sertifikat berhasil ditolak");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menolak sertifikat");
    },
    onSettled: () => setActionLoadingId(null),
  });

  function handleApprove(sertifikatId: number) {
    setActionLoadingId(sertifikatId);
    approveMutation.mutate(sertifikatId);
  }

  function handleReject(sertifikatId: number) {
    const reason = window.prompt("Masukkan alasan penolakan:");
    if (!reason || reason.trim().length < 3) {
      toast.error("Alasan penolakan minimal 3 karakter.");
      return;
    }
    setActionLoadingId(sertifikatId);
    rejectMutation.mutate({ id: sertifikatId, reason: reason.trim() });
  }

  return (
    <AdminLayout>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>
            Verifikasi Sertifikat
          </h1>
          <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
            <button
              onClick={() => navigate("/admin/training")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 12,
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Dashboard Pelatihan
            </button>
            <button
              onClick={() => navigate("/admin/training/certificates")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 12,
                background: "#fff", border: "none",
                color: "#1f45b6", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              Verifikasi Sertifikat
            </button>
            <button
              onClick={() => navigate("/admin/training/new")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 12,
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <Plus size={18} />
              Buat Pelatihan Baru
            </button>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0 }}>
          Kelola pengajuan sertifikat dari peserta pelatihan
        </p>
      </div>

      {/* Stats cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28,
      }}>
        {[
          { label: "Diajukan", value: stats.diajukan, icon: <Clock size={22} />, color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
          { label: "Terbit", value: stats.terbit, icon: <Award size={22} />, color: "#10b981", bg: "rgba(16,185,129,0.15)" },
          { label: "Ditolak", value: stats.ditolak, icon: <XCircle size={22} />, color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
        ].map((card) => (
          <div key={card.label} style={{
            background: "rgba(15,23,42,0.6)", borderRadius: 16,
            padding: "20px 24px", border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: card.bg, color: card.color,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{
        background: "#fff", borderRadius: 20,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden",
      }}>
        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 28px", borderBottom: "1px solid #f3f4f6",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
            Daftar Pengajuan Sertifikat
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
              style={{
                appearance: "none", WebkitAppearance: "none",
                background: "#fff", border: "1px solid #e5e7eb",
                borderRadius: 10, padding: "8px 36px 8px 14px",
                fontSize: 13, fontWeight: 600, color: "#374151",
                cursor: "pointer", outline: "none", fontFamily: "inherit",
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#f9fafb", border: "1px solid #e5e7eb",
              borderRadius: 10, padding: "8px 14px", minWidth: 260,
            }}>
              <Search size={16} style={{ color: "#9ca3af", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Cari nama UMKM atau pelatihan..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleApplyFilter(); }}
                style={{
                  border: "none", background: "transparent", fontSize: 13,
                  color: "#374151", outline: "none", width: "100%", padding: 0,
                }}
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={handleApplyFilter}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: 10,
                background: "#1f45b6", border: "none",
                color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <Filter size={16} />
              Terapkan Filter
            </button>
          </div>
        </div>

        {/* Table header */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 140px 220px",
          padding: "14px 28px", borderBottom: "1px solid #f3f4f6",
          fontSize: 11, fontWeight: 700, color: "#9ca3af",
          letterSpacing: "0.05em", textTransform: "uppercase",
        }}>
          <div>UMKM</div>
          <div>Pelatihan</div>
          <div>Status</div>
          <div>No. Sertifikat</div>
          <div>Aksi</div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ padding: "80px 28px", textAlign: "center", color: "#9ca3af" }}>
            Memuat data...
          </div>
        )}

        {/* Empty */}
        {!isLoading && certificates.length === 0 && (
          <div style={{ padding: "80px 28px", textAlign: "center", color: "#9ca3af" }}>
            <FileText size={48} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p>Tidak ada pengajuan sertifikat ditemukan.</p>
          </div>
        )}

        {/* Table body */}
        {!isLoading && certificates.map((cert: Certificate) => (
          <div
            key={cert.sertifikat_id}
            style={{
              display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 140px 220px",
              padding: "16px 28px", borderBottom: "1px solid #f9fafb",
              alignItems: "center", fontSize: 13,
            }}
          >
            {/* UMKM info */}
            <div>
              <div style={{ fontWeight: 600, color: "#111827", marginBottom: 2 }}>
                {cert.nama_umkm}
              </div>
              <div style={{ color: "#6b7280", fontSize: 12 }}>
                {cert.pelaku_nama}
              </div>
            </div>

            {/* Pelatihan */}
            <div>
              <div style={{ fontWeight: 600, color: "#111827", marginBottom: 2 }}>
                {cert.judul_pelatihan}
              </div>
              <div style={{ color: "#6b7280", fontSize: 12 }}>
                {cert.jenis_pelatihan} • {cert.mentor_nama}
              </div>
            </div>

            {/* Status */}
            <div>{getStatusBadge(cert.nama_status_sertifikat)}</div>

            {/* No. Sertifikat */}
            <div style={{ color: "#6b7280", fontSize: 12 }}>
              {cert.nomor_sertifikat || "—"}
            </div>

            {/* Aksi */}
            <div style={{ display: "flex", gap: 6 }}>
              {String(cert.nama_status_sertifikat).trim().toUpperCase() === "DIAJUKAN" && (
                <>
                  <button
                    onClick={() => handleApprove(cert.sertifikat_id)}
                    disabled={actionLoadingId === cert.sertifikat_id || Number(cert.progress_persen ?? 0) < 100}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "6px 12px", borderRadius: 8,
                      background: "#10b981", border: "none",
                      color: "#fff", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                      opacity: actionLoadingId === cert.sertifikat_id || Number(cert.progress_persen ?? 0) < 100 ? 0.55 : 1,
                    }}
                    title={Number(cert.progress_persen ?? 0) < 100 ? `Progress baru ${cert.progress_persen}%` : "Setujui"}
                  >
                    <CheckCircle size={14} />
                    {Number(cert.progress_persen ?? 0) < 100 ? `${cert.progress_persen}%` : "Setujui"}
                  </button>
                  <button
                    onClick={() => handleReject(cert.sertifikat_id)}
                    disabled={actionLoadingId === cert.sertifikat_id}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "6px 12px", borderRadius: 8,
                      background: "#ef4444", border: "none",
                      color: "#fff", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                      opacity: actionLoadingId === cert.sertifikat_id ? 0.6 : 1,
                    }}
                    title="Tolak"
                  >
                    <XCircle size={14} />
                    Tolak
                  </button>
                </>
              )}
              {String(cert.nama_status_sertifikat).trim().toUpperCase() === "TERBIT" && cert.dokumen_url && (
                <button
                  type="button"
                  onClick={() => {
                    downloadCertificate(cert.sertifikat_id).catch((error) => {
                      toast.error(error instanceof Error ? error.message : "Gagal mengunduh sertifikat");
                    });
                  }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: 8,
                    background: "#eef3ff", border: "none",
                    color: "#1f45b6", fontSize: 12, fontWeight: 600,
                    cursor: "pointer", textDecoration: "none",
                    fontFamily: "inherit",
                  }}
                  title="Unduh Sertifikat"
                >
                  <Download size={14} />
                  Unduh
                </button>
              )}
              {String(cert.nama_status_sertifikat).trim().toUpperCase() === "DITOLAK" && cert.catatan_validasi && (
                <span style={{ fontSize: 11, color: "#9ca3af" }} title={cert.catatan_validasi}>
                  {cert.catatan_validasi.length > 30
                    ? cert.catatan_validasi.substring(0, 30) + "…"
                    : cert.catatan_validasi}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 28px", borderTop: "1px solid #f3f4f6",
          }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Halaman {page} dari {totalPages} ({total} total)
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  background: page === 1 ? "#f3f4f6" : "#fff",
                  border: "1px solid #e5e7eb",
                  color: page === 1 ? "#9ca3af" : "#374151",
                  fontSize: 13, fontWeight: 600,
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                Sebelumnya
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  background: page === totalPages ? "#f3f4f6" : "#fff",
                  border: "1px solid #e5e7eb",
                  color: page === totalPages ? "#9ca3af" : "#374151",
                  fontSize: 13, fontWeight: 600,
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
