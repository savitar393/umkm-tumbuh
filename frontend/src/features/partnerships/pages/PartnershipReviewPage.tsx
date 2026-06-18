import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { partnershipsApi } from "../api";
import PartnershipSidebar from "../components/PartnershipSidebar";


function formatOptionalDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("id-ID");
}

// ─── Logo Components ──────────────────────────────────────────────────────────

const LogoKementrian: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="17" stroke="white" strokeWidth="1.5" fill="none" />
    <path d="M18 6 L20 13 L27 13 L21.5 17.5 L23.5 24.5 L18 20 L12.5 24.5 L14.5 17.5 L9 13 L16 13 Z" fill="white" />
    <text x="18" y="32" textAnchor="middle" fill="white" fontSize="5" fontFamily="serif" fontWeight="bold">KEMENKOP</text>
  </svg>
);

// ─── Confirmation Modal Component ─────────────────────────────────────────────

interface CancelConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, additionalNotes: string) => void;
  businessName: string;
  isSubmitting?: boolean;
}

const CancelConfirmationModal: React.FC<CancelConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  businessName,
  isSubmitting = false,
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [error, setError] = useState("");

  const cancelReasons = [
    { value: "tidak_sesuai_kriteria", label: "Tidak sesuai dengan kriteria kemitraan" },
    { value: "dokumen_tidak_lengkap", label: "Dokumen tidak lengkap atau tidak valid" },
    { value: "proposal_tidak_jelas", label: "Proposal kurang jelas atau tidak realistis" },
    { value: "duplikat_pengajuan", label: "Duplikat pengajuan yang sudah ada" },
    { value: "permintaan_pengaju", label: "Permintaan pembatalan dari pengaju" },
    { value: "lainnya", label: "Lainnya" },
  ];

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
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: 520,
          background: "white",
          borderRadius: 20,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
          zIndex: 1001,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 28px 16px",
          borderBottom: "1px solid #E8E7E2",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 44,
              background: "#FEF2F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
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
            Anda akan membatalkan pengajuan kerjasama dengan <strong>{businessName}</strong>. Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 28px" }}>
          {/* Alasan Pembatalan */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "#2C2C2A",
              marginBottom: 8,
            }}>
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
              {cancelReasons.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            {error && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#E24B4A" }}>{error}</p>
            )}
          </div>

          {/* Keterangan Tambahan */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "#2C2C2A",
              marginBottom: 8,
            }}>
              Keterangan Tambahan <span style={{ fontWeight: 400, color: "#888780" }}>(Opsional)</span>
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
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
          </div>

          {/* Warning Message */}
          <div style={{
            padding: "12px 16px",
            background: "#FEF2F2",
            borderRadius: 10,
            border: "1px solid #FEE2E2",
            marginTop: 8,
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <circle cx="12" cy="16" r="0.5" fill="#E24B4A" stroke="none" />
              </svg>
              <p style={{ margin: 0, fontSize: 12, color: "#991B1B", lineHeight: 1.4 }}>
                Data pengajuan ini akan diarsipkan dan Anda tidak dapat mengajukan kemitraan yang sama selama 30 hari ke depan.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 28px 24px",
          borderTop: "1px solid #E8E7E2",
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
        }}>
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
              transition: "background 0.15s",
            }}
          >
            Kembali
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            style={{
              padding: "10px 28px",
              background: isSubmitting ? "#B4B2A9" : "#E24B4A",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              color: "white",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {isSubmitting ? "Memproses..." : "Konfirmasi Batalkan"}
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Document Card Component ──────────────────────────────────────────────────

interface DocumentCardProps {
  fileName: string;
  fileSize: string;
  lastUpdated: string;
  onDownload: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ fileName, fileSize, lastUpdated, onDownload }) => {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 20px",
      background: "#F5F4F0",
      borderRadius: 12,
      border: "1px solid #E8E7E2",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          background: "#E24B4A",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <text x="8" y="20" fontSize="8" fill="white" fontFamily="monospace">PDF</text>
          </svg>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#2C2C2A" }}>
            {fileName}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888780" }}>
            {fileSize} • {lastUpdated}
          </p>
        </div>
      </div>
      <button
        onClick={onDownload}
        style={{
          padding: "8px 16px",
          background: "white",
          border: "1px solid #D3D1C7",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          color: "#1A3A6B",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Unduh PDF
      </button>
    </div>
  );
};

// ─── Upload Card Component ────────────────────────────────────────────────────

interface UploadCardProps {
  onFileSelect: (file: File | null) => void;
  onError?: (error: string | null) => void;
  fileName: string | null;
  error?: string;
}

const UploadCard: React.FC<UploadCardProps> = ({ onFileSelect, onError, fileName, error }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File | null) => {
    if (!file) return;
    
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      if (onError) onError("ERR-FILE-02: Hanya file PDF, JPG, dan PNG yang diperbolehkan. Maksimal 10MB.");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      if (onError) onError("ERR-FILE-02: File terlalu besar. Maksimal 10MB.");
      return;
    }
    
    if (onError) onError(null);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        border: error
          ? "2px dashed #E24B4A"
          : fileName
          ? "2px solid #1D9E75"
          : isDragging
          ? "2px dashed #F5A623"
          : "2px dashed #D3D1C7",
        borderRadius: 16,
        padding: "40px 24px",
        textAlign: "center",
        cursor: "pointer",
        background: fileName ? "#F0FAF6" : isDragging ? "#FFF8E7" : "#FAFAF8",
        transition: "all 0.2s",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />
      
      {fileName ? (
        <>
          <div style={{
            width: 48,
            height: 48,
            background: "#1D9E75",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="15" x2="15" y2="15" />
              <line x1="9" y1="11" x2="15" y2="11" />
            </svg>
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1D9E75" }}>
            {fileName}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888780" }}>
            Klik atau seret untuk mengganti file
          </p>
        </>
      ) : (
        <>
          <div style={{
            width: 48,
            height: 48,
            background: "#E8E7E2",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888780" strokeWidth="1.8">
              <path d="M12 16v-6m0 0L9 9m3 1l3-1m-3 9h.01M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              <line x1="9" y1="13" x2="15" y2="13" />
            </svg>
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#2C2C2A" }}>
            Unggah Dokumen yang Sudah Ditandatangani
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#B4B2A9" }}>
            Seret dan lepas file PDF Anda di sini, atau klik untuk memilih file
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#B4B2A9" }}>
            MAKSIMAL 10MB • PDF, JPG, PNG
          </p>
        </>
      )}
      {error && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#E24B4A" }}>{error}</p>
      )}
    </div>
  );
};

// ─── Signed Document Card Component ───────────────────────────────────────────

interface SignedDocumentCardProps {
  document: { name: string; size: string; uploadedAt: string };
  onDownload: () => void;
}

const SignedDocumentCard: React.FC<SignedDocumentCardProps> = ({ document, onDownload }) => {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 20px",
      background: "#F0FAF6",
      borderRadius: 12,
      border: "1px solid #1D9E75",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          background: "#1D9E75",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1D9E75" }}>
            {document.name}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888780" }}>
            {document.size} • Diunggah {document.uploadedAt}
          </p>
        </div>
      </div>
      <button
        onClick={onDownload}
        style={{
          padding: "8px 16px",
          background: "white",
          border: "1px solid #1D9E75",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          color: "#1D9E75",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
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
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PartnershipReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isMitraRoute = location.pathname.includes("/mitra/");
  
  const [partnership, setPartnership] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signedDocument, setSignedDocument] = useState<{ name: string; size: string; uploadedAt: string } | null>(null);
  
  // Modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const sidebarWidth = 260;

  const fetchPartnership = async (partnershipId: string) => {
    setLoading(true);
    try {
      const response = await partnershipsApi.getDetail(partnershipId);
      if (response.success === true && response.data) {
        const data = response.data as any;
        setPartnership(data);
        if (data.status === "ACTIVE" || data.contract_signed_at) {
          setIsSigned(true);
          setSignedDocument({
            name: "Dokumen_Persetujuan_Kemitraan.pdf",
            size: "2.4 MB",
            uploadedAt: formatOptionalDate(data.contract_signed_at || data.updated_at),
          });
        }
      }
    } catch {
      setPartnership(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPartnership(id);
    }
  }, [id]);

  const handleDownloadContract = () => {
    alert("Mengunduh draf kontrak...");
  };

  const handleDownloadSignedDocument = () => {
    alert("Mengunduh dokumen persetujuan kemitraan...");
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSignAndApprove = async () => {
    if (!isSigned && !signedFile) {
      setUploadError("ERR-FILE-01: Harap unggah dokumen kontrak yang sudah ditandatangani.");
      return;
    }
    
    setSubmitting(true);
    try {
      if (!id) throw new Error("ID pengajuan tidak ditemukan");

      // Upload dokumen yang sudah ditandatangani
      if (signedFile) {
        const base64 = await fileToBase64(signedFile);
        await partnershipsApi.sign(id, base64);
      }

      // For MITRA route, navigate to approve page after signing
      if (isMitraRoute) {
        navigate(`/mitra/partnerships/approve/${id}`);
        return;
      }

      // For UMKM route, approve directly
      await partnershipsApi.approve(id);
      
      setIsSigned(true);
      setSignedDocument({
        name: signedFile ? signedFile.name : "Dokumen_Persetujuan_Kemitraan.pdf",
        size: `${(signedFile!.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: "hari ini",
      });
      
      alert("Kontrak berhasil ditandatangani! Kemitraan telah aktif.");
    } catch (error: any) {
      alert(`Terjadi kesalahan: ${error.message || "Gagal memproses"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (reason: string, additionalNotes: string) => {
    setIsRejecting(true);
    try {
      if (!id) throw new Error("ID pengajuan tidak ditemukan");
      
      let rejection_reason = reason;
      if (additionalNotes.trim()) {
        rejection_reason += ` - ${additionalNotes.trim()}`;
      }
      
      await partnershipsApi.reject(id, rejection_reason);
      setShowCancelModal(false);
      if (isMitraRoute) {
        navigate("/mitra/partnerships/inbox", { state: { toast: "Pengajuan berhasil ditolak." } });
      } else {
        navigate(`/umkm/partnerships/${id}`);
      }
    } catch (error: any) {
      alert(`Terjadi kesalahan: ${error.message || "Gagal menolak pengajuan"}`);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleOpenCancelModal = () => {
    setShowCancelModal(true);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", position: "relative", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundImage: "url(/background.png)", backgroundSize: "cover", backgroundPosition: "center", zIndex: 0, opacity: 0.7 }} />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{
            display: "inline-block",
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "3px solid #E8E7E2",
            borderTopColor: "#1A3A6B",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: 16, color: "#888780" }}>Memuat data kontrak...</p>
        </div>
      </div>
    );
  }

  if (!partnership) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", position: "relative", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundImage: "url(/background.png)", backgroundSize: "cover", backgroundPosition: "center", zIndex: 0, opacity: 0.7 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p>Data tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      position: "relative",
    }}>
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundImage: "url(/background.png)", backgroundSize: "cover", backgroundPosition: "center", zIndex: 0, opacity: 0.7 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", width: "100%" }}>
      {/* Cancel Confirmation Modal */}
      <CancelConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleReject}
        businessName={partnership.business_name || "Jati Luhur Furniture"}
        isSubmitting={isRejecting}
      />

      <PartnershipSidebar />

      {/* Main Content */}
      <main style={{
        marginLeft: sidebarWidth,
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Top Bar */}
        <header style={{
          background: "white",
          borderBottom: "1px solid #E8E7E2",
          padding: "0 32px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button style={{
              background: "#1A3A6B",
              border: "none",
              borderRadius: 12,
              width: 44,
              height: 44,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1A7A5E" }}>Nusantara Ventures</p>
                <p style={{ margin: 0, fontSize: 11, color: "#888780" }}>MITRA</p>
              </div>
              <LogoKementrian size={36} />
            </div>
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: "32px 40px", maxWidth: 900, margin: "0 auto", width: "100%" }}>
          {/* Banner */}
          <div style={{
            background: "linear-gradient(90deg, #1A3A6B 0%, #2A5DA8 100%)",
            borderRadius: 18,
            padding: "28px 32px",
            marginBottom: 32,
          }}>
            <span style={{
              display: "inline-block",
              background: "white",
              color: "#1A3A6B",
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 20px",
              borderRadius: 40,
            }}>
              TAHAP AKHIR
            </span>
            <h2 style={{
              margin: "16px 0 8px",
              fontSize: 28,
              fontWeight: 700,
              color: "#F5A623",
            }}>
              Hampir Selesai, UMKM Tumbuh!
            </h2>
            <p style={{
              margin: 0,
              fontSize: 14,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.5,
            }}>
              Silakan tinjau draf kontrak kemitraan Anda. Pastikan semua data profil usaha sudah sesuai sebelum menandatangani secara digital.
            </p>
          </div>

          {/* Profile Usaha Section */}
          <div style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #E8E7E2",
            marginBottom: 24,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #E8E7E2",
              background: "#FAFAF8",
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1A3A6B" }}>Profil Usaha</h3>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#2C2C2A" }}>
                    {partnership.business_name}
                  </h4>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888780" }}>
                    {partnership.product_description}
                  </p>
                </div>
                <div style={{
                  background: "#F1EFE8",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  color: "#5F5E5A",
                }}>
                  {partnership.category || "Tekstil & Kerajinan Tangan"}
                </div>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#888780", marginBottom: 4 }}>
                  SEKTOR BISNIS
                </p>
                <p style={{ margin: 0, fontSize: 14, color: "#2C2C2A" }}>
                  Tekstil & Kerajinan Tangan
                </p>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#888780", marginBottom: 4 }}>
                  SEJARAH SINGKAT
                </p>
                <p style={{ margin: 0, fontSize: 14, color: "#5F5E5A", lineHeight: 1.5 }}>
                  {partnership.reason_for_partnership}
                </p>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#888780", marginBottom: 4 }}>
                  TUJUAN KEMITRAAN SPESIFIK
                </p>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "#5F5E5A", lineHeight: 1.6 }}>
                  <li>Digitalisasi katalog produk untuk pasar internasional.</li>
                  <li>Akses pendanaan modal kerja sebesar Rp 500.000.000.</li>
                  <li>Sistem manajemen inventory terintegrasi.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Draf Kontrak Section */}
          <div style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #E8E7E2",
            marginBottom: 24,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #E8E7E2",
              background: "#FAFAF8",
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1A3A6B" }}>Draf Kontrak Kemitraan</h3>
            </div>
            <div style={{ padding: "24px" }}>
              <DocumentCard
                fileName="Draf Kontrak Kemitraan_v2.pdf"
                fileSize="2.4 MB"
                lastUpdated="Terakhir diperbarui 2 jam lalu"
                onDownload={handleDownloadContract}
              />
              
              {/* Contract Preview */}
              <div style={{
                marginTop: 20,
                padding: "20px",
                background: "#FAFAF8",
                borderRadius: 12,
                border: "1px solid #E8E7E2",
              }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#2C2C2A" }}>
                  {partnership.proposal_title}
                </h4>
                <p style={{ margin: "0 0 16px", fontSize: 12, color: "#888780" }}>
                  Nomor: {partnership.request_code}
                </p>
                
                <div style={{ marginBottom: 16 }}>
                  <h5 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#1A3A6B" }}>
                    PASAL 1: DEFINISI DAN RUANG LINGKUP
                  </h5>
                  <p style={{ margin: 0, fontSize: 13, color: "#5F5E5A", lineHeight: 1.6 }}>
                    Perjanjian ini mengatur hubungan kerja sama antara Mitra Artisan (Pihak Pertama) dan Pemilik Usaha (Pihak Kedua) dalam hal penyediaan produk kriya eksklusif melalui platform digital...
                  </p>
                </div>
                
                <div>
                  <h5 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#1A3A6B" }}>
                    PASAL 2: KOMITMEN KUALITAS
                  </h5>
                  <p style={{ margin: 0, fontSize: 13, color: "#5F5E5A", lineHeight: 1.6 }}>
                    Pihak Kedua berkewajiban menjaga standar kualitas kerajinan tangan sesuai dengan spesifikasi yang telah disepakati pada saat kurasi awal. Kegagalan dalam menjaga kualitas dapat menyebabkan peninjauan ulang status kemitraan...
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload / Signed Document Section */}
          <div style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #E8E7E2",
            marginBottom: 32,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #E8E7E2",
              background: "#FAFAF8",
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1A3A6B" }}>
                {isSigned ? "Dokumen Persetujuan Kemitraan" : "Unggah Dokumen yang Sudah Ditandatangani"}
              </h3>
            </div>
            <div style={{ padding: "24px" }}>
              {isSigned && signedDocument ? (
                <SignedDocumentCard
                  document={signedDocument}
                  onDownload={handleDownloadSignedDocument}
                />
              ) : (
                <UploadCard
                  onFileSelect={(file) => {
                    setSignedFile(file);
                    setUploadError(null);
                  }}
                  onError={(err) => setUploadError(err)}
                  fileName={signedFile?.name || null}
                  error={uploadError ?? undefined}
                />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            paddingTop: 8,
          }}>
            <button
              onClick={handleOpenCancelModal}
              disabled={isSigned}
              style={{
                padding: "12px 32px",
                background: "white",
                border: `1px solid ${isSigned ? "#D3D1C7" : "#E24B4A"}`,
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: isSigned ? "#B4B2A9" : "#E24B4A",
                cursor: isSigned ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}
            >
              Tolak Persetujuan
            </button>
            <button
              onClick={handleSignAndApprove}
              disabled={submitting || isSigned}
              style={{
                padding: "12px 40px",
                background: submitting || isSigned ? "#888780" : "#1D9E75",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: "white",
                cursor: (submitting || isSigned) ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {submitting ? "Memproses..." : (isSigned ? "Sudah Ditandatangani" : "Tanda Tangani & Setujui")}
            </button>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
};

export default PartnershipReviewPage;