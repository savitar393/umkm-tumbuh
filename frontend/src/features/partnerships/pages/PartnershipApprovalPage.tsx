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

const RejectModal: React.FC<RejectModalProps> = ({ isOpen, onClose, onConfirm, businessName, isSubmitting = false }) => {
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
    if (!selectedReason) { setError("ERR-VAL-02: Alasan pembatalan wajib dipilih."); return; }
    setError("");
    onConfirm(selectedReason, additionalNotes);
  };

  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 1000 }} onClick={onClose} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "90%", maxWidth: 520, background: "white", borderRadius: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.2)", zIndex: 1001, overflow: "hidden" }}>
        <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid #E8E7E2" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 44, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#2C2C2A" }}>Batalkan Pengajuan Kemitraan?</h3>
          </div>
          <p style={{ margin: "12px 0 0 56px", fontSize: 14, color: "#5F5E5A", lineHeight: 1.5 }}>Anda akan membatalkan pengajuan kerjasama dengan <strong>{businessName}</strong>. Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        <div style={{ padding: "20px 28px" }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#2C2C2A", marginBottom: 8 }}>Alasan Pembatalan <span style={{ color: "#E24B4A" }}>*</span></label>
            <select value={selectedReason} onChange={(e) => { setSelectedReason(e.target.value); setError(""); }} style={{ width: "100%", padding: "12px 14px", border: error ? "1px solid #E24B4A" : "1px solid #D3D1C7", borderRadius: 10, fontSize: 14, color: selectedReason ? "#2C2C2A" : "#888780", background: "white", outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
              <option value="">Pilih alasan pembatalan...</option>
              {rejectReasons.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
            </select>
            {error && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#E24B4A" }}>{error}</p>}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#2C2C2A", marginBottom: 8 }}>Keterangan Tambahan <span style={{ fontWeight: 400, color: "#888780" }}>(Opsional)</span></label>
            <textarea value={additionalNotes} onChange={(e) => { if (e.target.value.length <= MAX_NOTES) setAdditionalNotes(e.target.value); }} placeholder="Berikan detail singkat terkait pembatalan Anda..." rows={3} style={{ width: "100%", padding: "12px 14px", border: "1px solid #D3D1C7", borderRadius: 10, fontSize: 14, color: "#2C2C2A", background: "white", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}><span style={{ fontSize: 11, color: additionalNotes.length >= MAX_NOTES ? "#E24B4A" : "#888780" }}>{additionalNotes.length}/{MAX_NOTES}</span></div>
          </div>
          <div style={{ padding: "12px 16px", background: "#FFF8E7", borderRadius: 10, border: "1px solid #FDE8C8" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E07B30" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              <p style={{ margin: 0, fontSize: 12, color: "#8B5E1A", lineHeight: 1.4 }}>Data pengajuan ini akan diarsipkan dan Anda tidak dapat mengajukan kemitraan yang sama selama 30 hari ke depan.</p>
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 28px 24px", borderTop: "1px solid #E8E7E2", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onClose} disabled={isSubmitting} style={{ padding: "10px 24px", background: "white", border: "1px solid #D3D1C7", borderRadius: 10, fontSize: 14, fontWeight: 500, color: "#5F5E5A", cursor: isSubmitting ? "not-allowed" : "pointer" }}>Kembali</button>
          <button onClick={handleConfirm} disabled={!selectedReason || isSubmitting} style={{ padding: "10px 28px", background: !selectedReason || isSubmitting ? "#B4B2A9" : "#E24B4A", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "white", cursor: !selectedReason || isSubmitting ? "not-allowed" : "pointer" }}>{isSubmitting ? "Memproses..." : "Konfirmasi Batalkan"}</button>
        </div>
      </div>
    </>
  );
};

const PartnershipApprovalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = getCurrentUser();
  const isMitra = user?.role === "MITRA";
  const basePath = isMitra ? "/mitra/partnerships" : "/umkm/partnerships";

  const [partnership, setPartnership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchPartnership(id);
  }, [id]);

  const fetchPartnership = async (partnershipId: string) => {
    setLoading(true);
    try {
      const resp = await partnershipsApi.getDetail(partnershipId);
      if (resp.success === true && resp.data) {
        setPartnership(resp.data);
        if (resp.data.contract_document_id) setUploadState("success");
      }
    } catch {
      setPartnership(null);
    } finally { setLoading(false); }
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) { setUploadError("ERR-FILE-02: Hanya file PDF, JPG, dan PNG yang diperbolehkan. Maksimal 10MB."); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError("ERR-FILE-02: File terlalu besar. Maksimal 10MB."); return; }
    setUploadError(null);
    setSignedFile(file);
  };

  const handleFinalApprove = async () => {
    if (!signedFile && uploadState !== "success") { setUploadError("ERR-FILE-01: Harap unggah dokumen kontrak yang sudah ditandatangani."); return; }
    setSubmitting(true);
    try {
      if (!id) throw new Error("ID pengajuan tidak ditemukan");
      // Step 1: Approve first (sets tanggal_keputusan, required before sign due to ck_pengajuan_doc constraint)
      await partnershipsApi.approve(id);
      // Step 2: Upload document and sign
      const userId = user?.id || "";
      if (signedFile && uploadState !== "success") {
        setUploadState("uploading");
        const docId = await partnershipsApi.uploadDocument(signedFile, userId);
        await partnershipsApi.sign(id, docId);
        setUploadState("success");
      }
      navigate(`${basePath}/approve/success`, { state: { partnership } });
    } catch (error: any) {
      setUploadState("error");
      alert(`Terjadi kesalahan: ${error.message || "Gagal memproses"}`);
    } finally { setSubmitting(false); }
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
    } catch (error: any) {
      navigate(`${basePath}/inbox`, { state: { toast: `Gagal menolak: ${error.message || "Terjadi kesalahan"}` } });
    } finally { setIsRejecting(false); }
  };

  const p = partnership?.pengajuan;

  const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif", position: "relative" }}>
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundImage: "url(/background.png)", backgroundSize: "cover", backgroundPosition: "center", zIndex: 0, opacity: 0.7 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", width: "100%" }}>
      <PartnershipSidebar />
      <main style={{ marginLeft: 260, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <header style={{ background: "white", borderBottom: "1px solid #E8E7E2", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "flex-end", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right" }}><p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#2C2C2A" }}>{user?.full_name || "User"}</p><p style={{ margin: 0, fontSize: 11, color: "#888780" }}>{user?.role || "MITRA"}</p></div>
          </div>
        </header>
        <div style={{ padding: "32px 40px", width: "100%", maxWidth: 1200, alignSelf: "center" }}>{children}</div>
      </main>
      </div>
    </div>
  );

  if (loading) return <Layout><div style={{ textAlign: "center", padding: "60px 20px" }}><div style={{ display: "inline-block", width: 40, height: 40, borderRadius: "50%", border: "3px solid #E8E7E2", borderTopColor: "#1A3A6B", animation: "spin 0.8s linear infinite" }} /><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style><p style={{ marginTop: 16, color: "#888780" }}>Memuat data...</p></div></Layout>;
  if (!p) return <Layout><p style={{ textAlign: "center", padding: "60px 20px", color: "#888780" }}>Data tidak ditemukan</p></Layout>;

  return (
    <Layout>
      <RejectModal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} onConfirm={handleReject} businessName={p.requester_name || "UMKM"} isSubmitting={isRejecting} />

      <div style={{ marginBottom: 24 }}>
        <span style={{ background: "#1D9E75", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 20, letterSpacing: 0.5, textTransform: "uppercase", display: "inline-block", marginBottom: 8 }}>Tahap Akhir</span>
        <h1 style={{ margin: "0 0 4px", fontSize: 32, fontWeight: 700, color: "#2C2C2A" }}>Hampir Selesai, UMKM Tumbuh!</h1>
        <p style={{ margin: 0, fontSize: 15, color: "#5F5E5A", lineHeight: 1.5 }}>Tinjau draf kontrak kemitraan. Pastikan semua data sudah sesuai sebelum menandatangani secara digital.</p>
      </div>

      {/* Profil */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E8E7E2", marginBottom: 24, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #E8E7E2", background: "#FAFAF8" }}><h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#2C2C2A" }}>Profil Usaha</h3></div>
        <div style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#F5F7FA", borderRadius: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#1A3A6B", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: 14 }}>{(p.requester_name || "?").charAt(0)}</div>
              <div><p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#2C2C2A" }}>{p.requester_name}</p><p style={{ margin: "2px 0 0", fontSize: 12, color: "#888780" }}>{p.receiver_name}</p></div>
            </div>
            <span style={{ fontSize: 12, color: "#1D9E75", background: "#E8F5F0", padding: "2px 12px", borderRadius: 12, fontWeight: 600 }}>{p.status}</span>
          </div>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #E8E7E2", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#888780" }}>DESKRIPSI</p>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#5F5E5A", lineHeight: 1.5 }}>{p.proposal_description || p.reason_for_partnership || "Tidak ada deskripsi."}</p>
          </div>
          <div style={{ padding: "0 16px" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#888780" }}>KODE PENGAJUAN</p>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#2C2C2A", fontWeight: 500 }}>{p.request_code}</p>
          </div>
        </div>
      </div>

      {/* Draft Kontrak */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E8E7E2", marginBottom: 24, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #E8E7E2", background: "#FAFAF8" }}><h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#2C2C2A" }}>Draf Kontrak Kemitraan</h3></div>
        <div style={{ padding: "20px 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#F8F9FA", borderRadius: 10, border: "1px solid #E8E7E2", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, background: "#E24B4A", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              </div>
              <div><p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#2C2C2A" }}>Draf Kontrak Kemitraan</p><p style={{ margin: "4px 0 0", fontSize: 12, color: "#888780" }}>{p.request_code || "Draf"}</p></div>
            </div>
            <button style={{ padding: "6px 16px", background: "transparent", border: "1px solid #D3D1C7", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#1A3A6B", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>Unduh
            </button>
          </div>
          <div style={{ border: "1px solid #E8E7E2", borderRadius: 10, padding: "16px 20px", background: "#FAFAF8" }}>
            <div style={{ borderBottom: "1px solid #E8E7E2", paddingBottom: 12, marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1A3A6B", letterSpacing: 0.5 }}>{p.proposal_title || "Draf Kontrak"}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#888780" }}>{p.request_code}</p>
            </div>
            <div><p style={{ margin: 0, fontSize: 13, color: "#5F5E5A", lineHeight: 1.5 }}>{p.proposal_description}</p></div>
          </div>
        </div>
      </div>

      {/* Upload */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E8E7E2", marginBottom: 32, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #E8E7E2", background: "#FAFAF8" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#2C2C2A" }}>
            {uploadState === "success" ? "Dokumen Persetujuan Kemitraan" : "Unggah Dokumen yang Sudah Ditandatangani"}
          </h3>
        </div>
        <div style={{ padding: "28px 24px", textAlign: "center" }}>
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} />
          {uploadState === "success" ? (
            <div style={{ border: "2px solid #1D9E75", borderRadius: 16, padding: "28px 20px", background: "#F0FAF6" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#1D9E75" }}>Dokumen_Persetujuan_Kemitraan.pdf</p>
              <p style={{ margin: 0, fontSize: 13, color: "#888780" }}>Telah diunggah dan ditandatangani</p>
            </div>
          ) : (
            <div style={{ border: uploadError ? "2px dashed #E24B4A" : "2px dashed #D3D1C7", borderRadius: 16, padding: "40px 20px", background: uploadError ? "#FEF2F2" : "#FAFAF8", cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#1D9E75"; e.currentTarget.style.background = "#F0FAF6"; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = "#D3D1C7"; e.currentTarget.style.background = "#FAFAF8"; }}
              onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files?.[0] || null); }}
            >
              <div style={{ marginBottom: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={uploadError ? "#E24B4A" : "#888780"} strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 18 15 15" /></svg>
              </div>
              {signedFile ? (
                <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#1D9E75" }}>{signedFile.name}</p>
              ) : (
                <>
                  <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#2C2C2A" }}>Seret dan lepas file PDF Anda di sini.</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#1D9E75", fontWeight: 500 }}>atau klik untuk memilih file</p>
                </>
              )}
              {uploadError && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#E24B4A" }}>{uploadError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, paddingTop: 8 }}>
        <button onClick={() => setShowRejectModal(true)} disabled={submitting}
          style={{ padding: "12px 32px", background: "white", border: "1.5px solid #E24B4A", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#E24B4A", cursor: "pointer", transition: "all 0.2s", minWidth: 160 }}>
          Tolak Persetujuan
        </button>
        <button onClick={handleFinalApprove} disabled={submitting}
          style={{ padding: "12px 40px", background: submitting ? "#888780" : "#1D9E75", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "white", cursor: submitting ? "not-allowed" : "pointer", transition: "all 0.2s", boxShadow: submitting ? "none" : "0 4px 14px rgba(29,158,117,0.3)", minWidth: 180 }}>
          {submitting ? "Memproses..." : "Tanda Tangani & Setujui"}
        </button>
      </div>
    </Layout>
  );
};

export default PartnershipApprovalPage;