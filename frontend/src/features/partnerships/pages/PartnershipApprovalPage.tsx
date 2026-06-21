import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { partnershipsApi } from "../api";
import PartnershipSidebar from "../components/PartnershipSidebar";
import { getCurrentUser } from "../../../shared/auth/currentUser";

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, additionalNotes: string) => void;
  businessName: string;
  isSubmitting?: boolean;
}

const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  businessName,
  isSubmitting = false,
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [error, setError] = useState("");

  const rejectReasons = [
    { value: "tidak_sesuai_kebutuhan", label: "Tidak sesuai kebutuhan bisnis" },
    { value: "dokumen_tidak_lengkap", label: "Dokumen tidak lengkap" },
    { value: "tidak_memenuhi_kriteria", label: "Tidak memenuhi kriteria" },
    { value: "risiko_terlalu_tinggi", label: "Risiko terlalu tinggi" },
    { value: "memilih_mitra_lain", label: "Memilih mitra lain" },
    { value: "lainnya", label: "Lainnya" },
  ];

  const MAX_NOTES = 500;

  const handleConfirm = () => {
    if (!selectedReason) {
      setError("ERR-VAL-02: Alasan pembatalan wajib dipilih.");
      return;
    }
    setError("");
    onConfirm(selectedReason, additionalNotes);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "90%",
          maxWidth: 520,
          background: "white",
          borderRadius: 24,
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          zIndex: 1001,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid #E8E7E2" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 44,
                background: "#FEF2F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#2C2C2A" }}>
              Batalkan Pengajuan Kemitraan?
            </h3>
          </div>
          <p style={{ margin: "12px 0 0 56px", fontSize: 14, color: "#5F5E5A", lineHeight: 1.5 }}>
            Anda akan membatalkan pengajuan kerjasama dengan <strong>{businessName}</strong>. Tindakan ini
            tidak dapat dibatalkan.
          </p>
        </div>
        <div style={{ padding: "20px 28px" }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#2C2C2A", marginBottom: 8 }}>
              Alasan Pembatalan <span style={{ color: "#E24B4A" }}>*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => {
                setSelectedReason(e.target.value);
                setError("");
              }}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: error ? "1px solid #E24B4A" : "1px solid #D3D1C7",
                borderRadius: 10,
                fontSize: 14,
                color: selectedReason ? "#2C2C2A" : "#888780",
                background: "white",
                outline: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <option value="">Pilih alasan pembatalan...</option>
              {rejectReasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {error && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#E24B4A" }}>{error}</p>
            )}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#2C2C2A", marginBottom: 8 }}>
              Keterangan Tambahan <span style={{ fontWeight: 400, color: "#888780" }}>(Opsional)</span>
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => {
                if (e.target.value.length <= MAX_NOTES) setAdditionalNotes(e.target.value);
              }}
              placeholder="Berikan detail singkat terkait pembatalan Anda..."
              rows={3}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #D3D1C7",
                borderRadius: 10,
                fontSize: 14,
                color: "#2C2C2A",
                background: "white",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <span
                style={{
                  fontSize: 11,
                  color: additionalNotes.length >= MAX_NOTES ? "#E24B4A" : "#888780",
                }}
              >
                {additionalNotes.length}/{MAX_NOTES}
              </span>
            </div>
          </div>
          <div
            style={{
              padding: "12px 16px",
              background: "#FFF8E7",
              borderRadius: 10,
              border: "1px solid #FDE8C8",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E07B30" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p style={{ margin: 0, fontSize: 12, color: "#8B5E1A", lineHeight: 1.4 }}>
                Data pengajuan ini akan diarsipkan dan Anda tidak dapat mengajukan kemitraan yang sama selama 30
                hari ke depan.
              </p>
            </div>
          </div>
        </div>
        <div
          style={{
            padding: "16px 28px 24px",
            borderTop: "1px solid #E8E7E2",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: "10px 24px",
              background: "white",
              border: "1px solid #D3D1C7",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              color: "#5F5E5A",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            Kembali
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedReason || isSubmitting}
            style={{
              padding: "10px 28px",
              background: !selectedReason || isSubmitting ? "#B4B2A9" : "#E24B4A",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              color: "white",
              cursor: !selectedReason || isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Memproses..." : "Konfirmasi Batalkan"}
          </button>
        </div>
      </div>
    </>
  );
};

function downloadContract(p: Record<string, unknown>) {
  const now = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const name = p?.requester_name || "____________________";
  const businessName = p?.requester_business_name || "____________________";
  const code = p?.request_code || "____________________";
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Draf Kontrak Kemitraan - ${name}</title>
<style>
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; margin: 2.5cm; line-height: 1.6; }
  h1 { text-align: center; font-size: 16pt; margin-bottom: 24pt; text-transform: uppercase; }
  h2 { font-size: 14pt; margin-top: 20pt; margin-bottom: 10pt; }
  p { text-align: justify; margin: 8pt 0; }
  table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
  td { padding: 6pt 10pt; border: 1px solid #000; vertical-align: top; }
  .label { font-weight: bold; width: 30%; }
  .ttd { margin-top: 40pt; }
  .ttd td { border: none; text-align: center; width: 50%; }
  .header { text-align: center; margin-bottom: 30pt; }
  .header p { text-align: center; margin: 2pt 0; }
</style>
</head>
<body>

<div class="header">
  <h1>DRAF KONTRAK KEMITRAAN</h1>
  <p>Nomor: ${code}</p>
  <p>UMKM Tumbuh</p>
  <p>${now}</p>
</div>

<p style="text-align: justify;">Pada hari ini, <strong>${now}</strong>, yang bertanda tangan di bawah ini:</p>

<table>
  <tr><td class="label">Nama</td><td>${name}</td></tr>
  <tr><td class="label">Nama Usaha</td><td>${businessName}</td></tr>
  <tr><td class="label">Jabatan</td><td>Pemilik Usaha / Pengaju</td></tr>
</table>

<p>Selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.</p>

<table>
  <tr><td class="label">Nama Mitra</td><td>${p?.receiver_name || "____________________"}</td></tr>
  <tr><td class="label">Jabatan</td><td>Penerima Pengajuan Kemitraan</td></tr>
</table>

<p>Selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.</p>

<p>PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama disebut <strong>PARA PIHAK</strong> yang sepakat untuk mengadakan kerjasama dalam rangka pengembangan dan pemberdayaan Usaha Mikro, Kecil, dan Menengah (UMKM) dengan ketentuan sebagai berikut:</p>

<h2>Pasal 1 - RUANG LINGKUP KERJASAMA</h2>
<p>Para Pihak sepakat untuk menjalin kerjasama dalam bidang pengembangan usaha, akses permodalan, perluasan pemasaran, dan pendampingan usaha sesuai dengan kemampuan dan kapasitas masing-masing pihak.</p>

<h2>Pasal 2 - HAK DAN KEWAJIBAN</h2>
<p>1. PIHAK PERTAMA berhak mendapatkan pendampingan dan dukungan dari PIHAK KEDUA sesuai dengan program kemitraan yang disepakati.</p>
<p>2. PIHAK PERTAMA wajib menyediakan data dan informasi yang benar mengenai usaha yang dijalankan.</p>
<p>3. PIHAK KEDUA berhak mendapatkan laporan perkembangan usaha secara berkala dari PIHAK PERTAMA.</p>
<p>4. PIHAK KEDUA wajib memberikan dukungan sesuai dengan komitmen yang telah disepakati bersama.</p>

<h2>Pasal 3 - JANGKA WAKTU</h2>
<p>Kerjasama ini berlaku sejak ditandatanganinya kontrak ini dan akan berlangsung selama periode yang akan ditentukan kemudian oleh PARA PIHAK.</p>

<h2>Pasal 4 - PENUTUP</h2>
<p>Demikian draf kontrak kemitraan ini dibuat dengan sebenarnya dan tanpa ada unsur paksaan dari pihak manapun.</p>

<br>
<table class="ttd">
  <tr>
    <td><br><br><br>(${name})<br><em>PIHAK PERTAMA</em></td>
    <td><br><br><br>(${p?.receiver_name || "____________________"})<br><em>PIHAK KEDUA</em></td>
  </tr>
</table>

</body>
</html>`;
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Draf_Kontrak_Kemitraan_${code}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== SIDEBAR COMPONENT =====
const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean }> = ({ icon, label, active }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      borderRadius: 10,
      cursor: "pointer",
      marginBottom: 4,
      background: active ? "rgba(255,255,255,0.15)" : "transparent",
      color: active ? "white" : "rgba(255,255,255,0.7)",
      fontWeight: active ? 600 : 400,
      fontSize: 14,
      transition: "all 0.2s",
    }}
  >
    {icon}
    <span>{label}</span>
  </div>
);

const Sidebar: React.FC = () => {
  return (
    <div
      style={{
        width: 260,
        minHeight: "100vh",
        background: "#1A3A6B",
        padding: "24px 16px",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, paddingLeft: 8 }}>
        <div
          style={{
            width: 36,
            height: 36,
            background: "#F5A623",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            color: "white",
            fontSize: 18,
          }}
        >
          U
        </div>
        <span style={{ color: "white", fontWeight: 700, fontSize: 18 }}>UMKM Tumbuh</span>
      </div>

      <SidebarItem
        active={false}
        label="Pelatihan Saya"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        }
      />
      <SidebarItem
        active={false}
        label="Kelola Informasi"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        }
      />
      <SidebarItem
        active={false}
        label="Dashboard"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        }
      />
      <SidebarItem
        active={true}
        label="Pengajuan Kemitraan"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
      />
      <SidebarItem
        active={false}
        label="Pengaturan"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        }
      />
    </div>
  );
};

// ===== DOCUMENT PREVIEW COMPONENT =====
// Dynamically load mammoth.js from CDN
const loadMammoth = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).mammoth) {
      resolve((window as any).mammoth);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.21/mammoth.browser.min.js";
    script.onload = () => resolve((window as any).mammoth);
    script.onerror = () => reject(new Error("Failed to load mammoth.js"));
    document.head.appendChild(script);
  });
};

const DocumentPreview: React.FC<{ url: string; fileType: string; file?: File | null }> = ({ url, fileType, file }) => {
  const [docHtml, setDocHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPDF = fileType === "application/pdf";
  const isDOCX = fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isDOC = fileType === "application/msword";

  // Convert DOCX to HTML using mammoth.js
  useEffect(() => {
    if (isDOCX && file) {
      setLoading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          if (!arrayBuffer) throw new Error("Failed to read file");

          const mammoth = await loadMammoth();
          const result = await mammoth.convertToHtml({ arrayBuffer });

          if (result.value) {
            setDocHtml(result.value);
          } else {
            throw new Error("Failed to convert document");
          }
        } catch (err) {
          setError("Gagal memuat preview dokumen. Silakan unduh untuk melihat isi.");
          console.error("DOCX preview error:", err);
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Gagal membaca file.");
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    }
  }, [isDOCX, file, url]);

  if (isPDF) {
    return (
      <div
        style={{
          border: "1px solid #E8E7E2",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 16,
          background: "#FAFAF8",
          height: 320,
        }}
      >
        <object
          data={url}
          type="application/pdf"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
        >
          <div style={{ padding: 40, textAlign: "center" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#888780" strokeWidth="1.5" style={{ marginBottom: 12 }}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p style={{ margin: 0, fontSize: 14, color: "#888780" }}>
              Browser tidak mendukung preview PDF.{" "}
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#1A3A6B", fontWeight: 600 }}>
                Klik di sini untuk membuka
              </a>
            </p>
          </div>
        </object>
      </div>
    );
  }

  // For DOCX files - render converted HTML
  if (isDOCX) {
    return (
      <div
        style={{
          border: "1px solid #E8E7E2",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 16,
          background: "#FAFAF8",
          height: 320,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "10px 16px",
            background: "#1A3A6B",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>
            Preview Dokumen Word
          </span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div
                style={{
                  display: "inline-block",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "2px solid #E8E7E2",
                  borderTopColor: "#1A3A6B",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ marginTop: 12, fontSize: 12, color: "#888780" }}>Memuat preview...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: 30 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#888780" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <p style={{ margin: 0, fontSize: 13, color: "#888780" }}>{error}</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginTop: 12,
                  display: "inline-block",
                  padding: "6px 16px",
                  background: "#1A3A6B",
                  color: "white",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Buka Dokumen
              </a>
            </div>
          ) : (
            <div
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 13,
                lineHeight: 1.6,
                color: "#2C2C2A",
              }}
              dangerouslySetInnerHTML={{ __html: docHtml }}
            />
          )}
        </div>
      </div>
    );
  }

  // For old DOC format - fallback
  return (
    <div
      style={{
        border: "1px solid #E8E7E2",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 16,
        background: "#FAFAF8",
        height: 320,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#1A3A6B" strokeWidth="1.5" style={{ marginBottom: 16 }}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
      <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: "#2C2C2A" }}>
        Dokumen Word (Format Lama)
      </p>
      <p style={{ margin: 0, fontSize: 13, color: "#888780", textAlign: "center" }}>
        Format .doc tidak didukung untuk preview. Silakan unduh untuk melihat isi dokumen.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: 16,
          padding: "8px 20px",
          background: "#1A3A6B",
          color: "white",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Unduh Dokumen
      </a>
    </div>
  );
};

const PartnershipApprovalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = getCurrentUser();
  const isMitra = user?.role === "MITRA";
  const basePath = isMitra ? "/mitra/partnerships" : "/umkm/partnerships";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [partnership, setPartnership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>("");

  const fetchPartnership = async (partnershipId: string) => {
    setLoading(true);
    try {
      const resp = await partnershipsApi.getDetail(partnershipId);
      if (resp.success === true && resp.data) {
        setPartnership(resp.data);
        if (resp.data.contract_document_id) {
          setUploadState("success");
          try {
            const docResp = await partnershipsApi.getDocumentUrl(resp.data.contract_document_id);
            if (docResp.data?.url) {
              setDocumentUrl(docResp.data.url);
              setFileType(docResp.data?.content_type || "application/pdf");
            }
          } catch {
            // Silently fail
          }
        }
      }
    } catch {
      setPartnership(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPartnership(id);
  }, [id]);

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
      setUploadError("ERR-FILE-02: Hanya file PDF dan DOC yang diperbolehkan. Maksimal 10MB.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("ERR-FILE-02: File terlalu besar. Maksimal 10MB.");
      return;
    }
    setUploadError(null);
    setSignedFile(file);
    setFileType(file.type);
    // Auto-create preview URL immediately after upload
    const url = URL.createObjectURL(file);
    setDocumentUrl(url);
    setUploadState("success");
  };

  const handleFinalApprove = async () => {
    if (!signedFile && uploadState !== "success") {
      setUploadError("ERR-FILE-01: Harap unggah dokumen kontrak yang sudah ditandatangani.");
      return;
    }
    setSubmitting(true);
    try {
      if (!id) throw new Error("ID pengajuan tidak ditemukan");
      const userId = user?.id || "";
      if (signedFile && uploadState !== "success") {
        setUploadState("uploading");
        try {
          const docId = await partnershipsApi.uploadDocument(signedFile, userId);
          await partnershipsApi.sign(id, docId);
          setUploadState("success");
        } catch {
          setUploadState("error");
          throw new Error("Gagal mengunggah dokumen");
        }
      }
      await partnershipsApi.approve(id);
      navigate(`${basePath}/approve/success`, { state: { partnership } });
    } catch {
      setUploadState("error");
      alert("Terjadi kesalahan: Gagal memproses");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (reason: string, additionalNotes: string) => {
    setIsRejecting(true);
    try {
      if (!id) throw new Error("ID pengajuan tidak ditemukan");
      let rejection_reason = reason;
      if (additionalNotes.trim()) rejection_reason += ` - ${additionalNotes.trim()}`;
      await partnershipsApi.reject(id, rejection_reason);
      setShowRejectModal(false);
      navigate(`${basePath}/inbox`, { state: { toast: "Pengajuan berhasil ditolak." } });
    } catch {
      navigate(`${basePath}/inbox`, { state: { toast: "Gagal menolak: Terjadi kesalahan" } });
    } finally {
      setIsRejecting(false);
    }
  };

  const p = partnership?.pengajuan;

  // Extract data for display
  const businessName = p?.requester_business_name || p?.requester_name || "UMKM";
  const requesterName = p?.requester_name || "Bank Mandiri";
  const category = p?.category || "Bisnis dan Finansial";
  const sector = p?.sector || p?.sektor || "Bank";
  const contractNumber = p?.request_code || "PKS-SARI-006";
  const fileName = p?.contract_file_name || "Dokumen_Persetujuan_Kemitraan.pdf";

  // Loading state
  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif", background: "#F0F2F5" }}>
        <Sidebar />
        <main
          style={{
            marginLeft: 260,
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "32px 40px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                display: "inline-block",
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "3px solid #E8E7E2",
                borderTopColor: "#1A3A6B",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ marginTop: 16, color: "#888780" }}>Memuat data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!p) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif", background: "#F0F2F5" }}>
        <Sidebar />
        <main
          style={{
            marginLeft: 260,
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "32px 40px",
          }}
        >
          <p style={{ textAlign: "center", color: "#888780" }}>Data tidak ditemukan</p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif", background: "#F0F2F5" }}>
      <RejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
        businessName={businessName}
        isSubmitting={isRejecting}
      />

      <Sidebar />

      <main
        style={{
          marginLeft: 260,
          flex: 1,
          padding: "32px 40px",
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* ===== HEADER CARD - BLUE ===== */}
          <div
            style={{
              background: "#1A3A6B",
              borderRadius: 16,
              padding: "28px 32px",
              marginBottom: 24,
              color: "white",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                background: "white",
                color: "#1A3A6B",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 14px",
                borderRadius: 20,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                display: "inline-block",
                marginBottom: 12,
              }}
            >
              TAHAP AKHIR
            </span>
            <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 700, color: "white" }}>
              Hampir Selesai, UMKM Tumbuhan!
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, maxWidth: 600 }}>
              Silakan tinjau draf kontrak kemitraan Anda. Pastikan semua data profil Usaha sudah sesuai sebelum menandatangani secara digital.
            </p>
          </div>

          {/* ===== TWO COLUMN LAYOUT ===== */}
          <div style={{ display: "flex", gap: 24 }}>
            {/* LEFT COLUMN - Profile & Contract Draft (simplified) */}
            <div style={{ flex: 1.6, minWidth: 0 }}>
              {/* Profil Usaha - WITHOUT Tujuan Kemitraan */}
              <div
                style={{
                  background: "white",
                  borderRadius: 16,
                  border: "1px solid #E8E7E2",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid #E8E7E2",
                    background: "#FAFAF8",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#2C2C2A" }}>
                    Profil Usaha
                  </h3>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A3A6B" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        background: "#1A3A6B",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: 22,
                        flexShrink: 0,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <img 
                        src={p?.requester_logo || "/default-logo.png"} 
                        alt="Logo" 
                        style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span style={{ position: "relative", zIndex: 1 }}>{requesterName.charAt(0)}</span>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2C2C2A" }}>
                        {requesterName}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 14, color: "#888780" }}>{category}</p>
                    </div>
                  </div>

                  {/* Sector Badge */}
                  <div
                    style={{
                      padding: "8px 14px",
                      background: "#F5F7FA",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888780" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#888780" }}>Sektor Bisnis</span>
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1A3A6B",
                        background: "#E8EDF5",
                        padding: "4px 14px",
                        borderRadius: 10,
                      }}
                    >
                      {sector}
                    </span>
                  </div>

                  {/* Description */}
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: "#5F5E5A", lineHeight: 1.6 }}>
                      Didirikan pada tahun 2012, Merupakan bank dengan tingkat keamanan dan kerja sama yang tinggi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Draf Kontrak - SIMPLIFIED: just file info + download button */}
              <div
                style={{
                  background: "white",
                  borderRadius: 16,
                  border: "1px solid #E8E7E2",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid #E8E7E2",
                    background: "#FAFAF8",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#2C2C2A" }}>
                      Draf Kontrak Kemitraan
                    </h3>
                  </div>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  {/* File info card with download */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      background: "#FAFAF8",
                      borderRadius: 12,
                      border: "1px solid #E8E7E2",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          background: "#FEF2F2",
                          borderRadius: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#2C2C2A" }}>
                          Draf_Kontrak_Kemitraan_{contractNumber}.pdf
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888780" }}>
                          2.4 MB - Terakhir diperbarui 2 jam lalu
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadContract(p)}
                      style={{
                        padding: "8px 20px",
                        background: "white",
                        border: "1.5px solid #1A3A6B",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1A3A6B",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexShrink: 0,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Unduh
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Document Upload with Auto Preview */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Dokumen Persetujuan Kemitraan */}
              <div
                style={{
                  background: "white",
                  borderRadius: 16,
                  border: "1px solid #E8E7E2",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid #E8E7E2",
                    background: "#FAFAF8",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#2C2C2A" }}>
                    Dokumen Persetujuan Kemitraan
                  </h3>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    style={{ display: "none" }}
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  />

                  {uploadState === "success" && documentUrl ? (
                    <div>
                      {/* Auto Preview - renders immediately after upload */}
                      <DocumentPreview url={documentUrl} fileType={fileType} file={signedFile} />

                      {/* File Info Card */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "14px 18px",
                          background: "white",
                          borderRadius: 12,
                          border: "1px solid #E8E7E2",
                          marginBottom: 16,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              background: "#1D9E75",
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#2C2C2A" }}>
                              {signedFile?.name || fileName}
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888780" }}>
                              Telah diunggah dan ditandatangani
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Re-upload button */}
                      <button
                        onClick={() => {
                          setUploadState("idle");
                          setDocumentUrl(null);
                          setSignedFile(null);
                          setFileType("");
                          fileInputRef.current?.click();
                        }}
                        style={{
                          width: "100%",
                          padding: "10px",
                          background: "white",
                          border: "1.5px dashed #D3D1C7",
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#888780",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Ganti Dokumen
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        border: uploadError ? "2px dashed #E24B4A" : "2px dashed #D3D1C7",
                        borderRadius: 12,
                        padding: "40px 20px",
                        background: uploadError ? "#FEF2F2" : "#FAFAF8",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s",
                        minHeight: 200,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = "#1D9E75";
                        e.currentTarget.style.background = "#F0FAF6";
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.style.borderColor = "#D3D1C7";
                        e.currentTarget.style.background = "#FAFAF8";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleFileSelect(e.dataTransfer.files?.[0] || null);
                      }}
                    >
                      <div style={{ marginBottom: 12 }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={uploadError ? "#E24B4A" : "#888780"} strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="12" y1="18" x2="12" y2="12" />
                          <polyline points="9 15 12 18 15 15" />
                        </svg>
                      </div>
                      {signedFile ? (
                        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#1D9E75" }}>
                          {signedFile.name}
                        </p>
                      ) : (
                        <>
                          <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color: "#2C2C2A" }}>
                            Seret dan lepas file PDF Anda di sini.
                          </p>
                          <p style={{ margin: 0, fontSize: 14, color: "#1D9E75", fontWeight: 500 }}>
                            atau klik untuk memilih file
                          </p>
                        </>
                      )}
                      {uploadError && (
                        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#E24B4A" }}>{uploadError}</p>
                      )}
                      <p style={{ margin: "12px 0 0", fontSize: 11, color: "#888780" }}>Maks. 10MB, format PDF atau DOC</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 20,
                }}
              >
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    background: "white",
                    border: "1.5px solid #1A3A6B",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1A3A6B",
                    cursor: submitting ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Tolak Persetujuan
                </button>
                <button
                  onClick={handleFinalApprove}
                  disabled={submitting}
                  style={{
                    flex: 1.5,
                    padding: "14px 24px",
                    background: submitting ? "#888780" : "#1A3A6B",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "white",
                    cursor: submitting ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    boxShadow: submitting ? "none" : "0 4px 14px rgba(26,58,107,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {submitting ? (
                    "Memproses..."
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Tanda Tangani & Setujui
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PartnershipApprovalPage;