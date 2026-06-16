import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import Footer from "../../../shared/components/Footer";
import { useCompleteTraining, useUserEnrollments } from "../hooks";
import { useTrainingStore } from "../store";

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrainingEvaluationPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const umkmId = useTrainingStore((s) => s.umkmId);
  const { data: enrollments } = useUserEnrollments(umkmId);
  const completeMutation = useCompleteTraining();
  const enrollment = (enrollments || []).find((e) => e.pelatihan_id === id);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [checkboxes, setCheckboxes] = useState({
    original: false,
    allData: false,
    curator: false,
  });

  const handleFileSelect = (file: File) => {
    const maxSize = 25 * 1024 * 1024; // 25MB
    const allowedTypes = ["application/pdf", "application/zip", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    
    if (file.size > maxSize) {
      alert("File terlalu besar! Maksimal 25MB");
      return;
    }
    
    if (!allowedTypes.includes(file.type)) {
      alert("Format file tidak didukung! Gunakan PDF, ZIP, atau DOCX");
      return;
    }
    
    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const allChecked = checkboxes.original && checkboxes.allData && checkboxes.curator;
  const canSubmit = selectedFile && allChecked;

  const handleSubmit = () => {
    if (!canSubmit || !enrollment) return;
    completeMutation.mutate(
      { pendaftaran_pelatihan_id: enrollment.pendaftaran_pelatihan_id },
      { onSuccess: () => navigate(`/umkm/trainings/${id}/verification`) }
    );
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "20px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#1a3fa4" }}>Evaluasi Akhir Proyek</h1>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ position: "relative", width: "280px" }}>
            <Icon icon="mdi:magnify" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", color: "#94a3b8" }} />
            <input type="text" placeholder="Cari materi..." style={{ width: "100%", padding: "8px 12px 8px 38px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", outline: "none", background: "#f8fafc" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #FFD700, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(255,215,0,0.3)" }}>
              <Icon icon="mdi:account" style={{ fontSize: "18px", color: "#1a3fa4" }} />
            </div>
            <span style={{ color: "#0f172a", fontWeight: 600, fontSize: "13px" }}>User UMKM</span>
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <div style={{ flex: 1, maxWidth: "1100px", margin: "0 auto", padding: "40px 32px", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "32px" }}>

          {/* ── LEFT: Upload Section ──────────────────────────────────── */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon icon="mdi:file-document-outline" style={{ fontSize: "24px", color: "#3b82f6" }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a", lineHeight: "1.2" }}>Kirim Proyek Akhir</h2>
                <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748b", lineHeight: "1.4" }}>
                  Unggah dokumentasi strategi data lanjutan Anda untuk penilaian akhir.
                </p>
              </div>
            </div>

            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                marginTop: "28px",
                border: isDragging ? "2px dashed #3b82f6" : "2px dashed #cbd5e1",
                borderRadius: "16px",
                padding: "48px 32px",
                textAlign: "center",
                background: isDragging ? "#eff6ff" : "#f8fafc",
                transition: "all 0.2s",
              }}
            >
              {/* Cloud Icon */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon icon="mdi:cloud-upload-outline" style={{ fontSize: "40px", color: "#0284c7" }} />
                </div>
              </div>

              {selectedFile ? (
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>{selectedFile.name}</p>
                  <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={() => setSelectedFile(null)}
                    style={{ padding: "8px 20px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", fontWeight: "600", color: "#475569", cursor: "pointer" }}
                  >
                    Hapus File
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "700", color: "#334155" }}>
                    Tarik dan lepas file di sini
                  </p>
                  <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#64748b" }}>
                    Mendukung Format: PDF, ZIP, DOCX (Max 25MB)
                  </p>

                  <label htmlFor="file-input" style={{ display: "inline-block", padding: "12px 28px", background: "#1a3fa4", color: "#fff", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}>
                    Pilih File dari Komputer
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.zip,.docx"
                    onChange={handleFileInputChange}
                    style={{ display: "none" }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Terms & Conditions ──────────────────────────────── */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <Icon icon="mdi:clipboard-text-outline" style={{ fontSize: "24px", color: "#1a3fa4" }} />
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Syarat & Ketentuan</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={checkboxes.original}
                  onChange={(e) => setCheckboxes({ ...checkboxes, original: e.target.checked })}
                  style={{ width: "18px", height: "18px", marginTop: "2px", cursor: "pointer", accentColor: "#1a3fa4" }}
                />
                <span style={{ fontSize: "14px", color: "#334155", lineHeight: "1.6" }}>
                  Saya menyatakan bahwa karya ini adalah asli hasil pemikiran saya sendiri.
                </span>
              </label>

              <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={checkboxes.allData}
                  onChange={(e) => setCheckboxes({ ...checkboxes, allData: e.target.checked })}
                  style={{ width: "18px", height: "18px", marginTop: "2px", cursor: "pointer", accentColor: "#1a3fa4" }}
                />
                <span style={{ fontSize: "14px", color: "#334155", lineHeight: "1.6" }}>
                  Saya telah menyertakan semua data pendukung yang diperlukan dalam lampiran.
                </span>
              </label>

              <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={checkboxes.curator}
                  onChange={(e) => setCheckboxes({ ...checkboxes, curator: e.target.checked })}
                  style={{ width: "18px", height: "18px", marginTop: "2px", cursor: "pointer", accentColor: "#1a3fa4" }}
                />
                <span style={{ fontSize: "14px", color: "#334155", lineHeight: "1.6" }}>
                  Saya memahami bahwa hasil penilaian tim kurator bersifat mutlak.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Bottom Actions ──────────────────────────────────────────── */}
        <div style={{ marginTop: "32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Icon icon="mdi:alert-circle" style={{ fontSize: "20px", color: "#dc2626" }} />
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#dc2626" }}>Batalkan Sesi</p>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                Pastikan semua dokumen telah sesuai sebelum mengirimkan evaluasi.
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || completeMutation.isPending}
            style={{
              padding: "16px 40px",
              background: canSubmit && !completeMutation.isPending ? "linear-gradient(135deg, #1a3fa4 0%, #1e3a8a 100%)" : "#e2e8f0",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "700",
              color: canSubmit && !completeMutation.isPending ? "#fff" : "#94a3b8",
              cursor: canSubmit && !completeMutation.isPending ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: canSubmit && !completeMutation.isPending ? "0 4px 14px rgba(26,63,164,0.35)" : "none",
              transition: "all 0.2s",
            }}
          >
            {completeMutation.isPending ? "Mengirim..." : "Kirim Evaluasi Akhir"}
            <Icon icon="mdi:send" style={{ fontSize: "20px" }} />
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
