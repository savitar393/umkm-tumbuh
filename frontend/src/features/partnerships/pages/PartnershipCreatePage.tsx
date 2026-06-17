import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { partnershipsApi } from "../api";
import type { CreatePartnershipRequest } from "../types";
import PartnershipSidebar from "../components/PartnershipSidebar";
import { getCurrentUser } from "../../../shared/auth/currentUser";

// ─── SVG Logo Components (tetap sama) ─────────────────────────────────────────



// ─── Upload Card (tetap sama) ─────────────────────────────────────────────────

interface UploadCardProps {
  label: string;
  hint: string;
  optional?: boolean;
  icon: React.ReactNode;
  value: string | null;
  onChange: (filename: string | null, error?: string) => void;
  error?: string;
}

const UploadCard: React.FC<UploadCardProps> = ({ label, hint, optional, icon, value, onChange, error }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      onChange(null, "ERR-FILE-02: File terlalu besar. Maksimal 10MB.");
      return;
    }
    if (file.type !== "application/pdf") {
      onChange(null, "ERR-FILE-02: Hanya file PDF yang diperbolehkan.");
      return;
    }
    onChange(file.name);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        border: error
          ? "1.5px dashed #E24B4A"
          : value
          ? "1.5px dashed #1D9E75"
          : "1.5px dashed #B4B2A9",
        borderRadius: 12,
        padding: "20px 12px",
        textAlign: "center",
        cursor: "pointer",
        background: value ? "#F0FAF6" : "white",
        transition: "border-color 0.2s, background 0.2s",
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <div style={{ color: value ? "#0F6E56" : "#888780", fontSize: 28 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: value ? "#0F6E56" : "#2C2C2A" }}>
        {value ? value : label}
        {optional && !value && (
          <span style={{ fontWeight: 400, color: "#888780", marginLeft: 4 }}>(opsional)</span>
        )}
      </p>
      {!value && (
        <p style={{ margin: 0, fontSize: 11, color: "#888780" }}>{hint}</p>
      )}
      {error && (
        <p style={{ margin: 0, fontSize: 11, color: "#E24B4A" }}>{error}</p>
      )}
    </div>
  );
};

// ─── Icon helpers ──────────────────────────────────────────────────────────────

const IconDoc = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="15" y2="17" />
  </svg>
);

const IconCert = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const PartnershipCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const basePath = user?.role === "MITRA" ? "/mitra/partnerships" : "/umkm/partnerships";
  const isMitra = user?.role === "MITRA";
  const sidebarWidth = isMitra ? 260 : 220;
  
  // State untuk daftar mitra dari backend
  const [mitraList, setMitraList] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingMitra, setLoadingMitra] = useState(true);
  const [mitraError, setMitraError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    receiver_id: "",
    business_name: "",
    contact_person: "",
    product_description: "",
    reason_for_partnership: "",
  });

  const [files, setFiles] = useState<{
    nib_ktp: string | null;
    pdf_kemitraan: string | null;
    sertifikat: string | null;
  }>({ nib_ktp: null, pdf_kemitraan: null, sertifikat: null });

  const [fileErrors, setFileErrors] = useState<{
    nib_ktp?: string;
    pdf_kemitraan?: string;
    sertifikat?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch daftar mitra/umkm dari backend saat component mount
  useEffect(() => {
    const fetchPartnerList = async () => {
      setLoadingMitra(true);
      setMitraError(null);
      try {
        if (user?.role === "MITRA") {
          // MITRA melihat daftar UMKM
          const response = await partnershipsApi.listUMKM({ page: 1, limit: 100 });
          if (response.umkm && response.umkm.length > 0) {
            setMitraList(response.umkm.map(m => ({ id: m.id, name: m.name })));
          }
        } else {
          // UMKM melihat daftar MITRA
          const response = await partnershipsApi.listMitra({ page: 1, limit: 100 });
          if (response.mitra && response.mitra.length > 0) {
            setMitraList(response.mitra.map(m => ({ id: m.id, name: m.name })));
          }
        }
      } catch (error: any) {
        setMitraError(error.message || "Gagal memuat daftar mitra/UMKM");
        console.error("Error fetching partner list:", error);
      } finally {
        setLoadingMitra(false);
      }
    };
    
    fetchPartnerList();
  }, [user]);

  // Cek URL params untuk pre-select mitra (dropdown only)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const receiverId = params.get("receiver_id");
    if (receiverId) {
      setFormData(prev => ({ ...prev, receiver_id: receiverId }));
    }
  }, [location]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleFileChange = (key: keyof typeof files) => (filename: string | null, error?: string) => {
    if (error) {
      setFileErrors((p) => ({ ...p, [key]: error }));
      setFiles((p) => ({ ...p, [key]: null }));
    } else {
      setFiles((p) => ({ ...p, [key]: filename }));
      setFileErrors((p) => { const n = { ...p }; delete n[key]; return n; });
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.business_name.trim()) e.business_name = "Nama usaha wajib diisi";
    if (!formData.contact_person.trim()) e.contact_person = "Kontak person wajib diisi";
    if (!formData.product_description.trim()) e.product_description = "Deskripsi produk wajib diisi";
    if (!formData.reason_for_partnership.trim()) e.reason_for_partnership = "Alasan bermitra wajib diisi";
    if (!formData.receiver_id) e.receiver_id = "Pilih mitra/UMKM yang dituju";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const attachments = [files.nib_ktp, files.pdf_kemitraan, files.sertifikat].filter(Boolean) as string[];
      
      const apiData: CreatePartnershipRequest = {
        receiver_id: formData.receiver_id,
        proposal_title: `Pengajuan Kemitraan - ${formData.business_name}`,
        proposal_description: `${formData.product_description}\n\nAlasan Bermitra: ${formData.reason_for_partnership}`,
        attachment_files: attachments,
      };
      
      console.log("=== DEBUG SUBMIT ===");
      console.log("receiver_id:", apiData.receiver_id);
      console.log("proposal_title:", apiData.proposal_title);
      console.log("proposal_description length:", apiData.proposal_description.length);
      console.log("attachment_files:", apiData.attachment_files);
      console.log("Full data:", JSON.stringify(apiData, null, 2));
      
      // Validasi dokumen wajib
      if (!files.nib_ktp) {
        throw new Error("ERR-FILE-01: Dokumen NIB/KTP wajib diunggah.");
      }
      if (!files.pdf_kemitraan) {
        throw new Error("ERR-FILE-01: Dokumen PDF Pengajuan Kemitraan wajib diunggah.");
      }

      // Validasi tambahan
      if (!apiData.receiver_id) {
        throw new Error("receiver_id tidak boleh kosong");
      }
      if (apiData.proposal_title.length < 10) {
        throw new Error("proposal_title minimal 10 karakter");
      }
      if (apiData.proposal_description.length < 30) {
        throw new Error("proposal_description minimal 30 karakter");
      }
      
      const response = await partnershipsApi.create(apiData);
      console.log("=== CREATE RESPONSE FULL ===");
      console.log("Raw response:", JSON.stringify(response));
      console.log("response.success:", response.success);
      console.log("response.message:", response.message);
      console.log("response.data:", JSON.stringify(response.data));
      
      if (response.success === true && response.data?.pengajuanID) {
        console.log("SUCCESS PATH: redirecting to success page with pengajuanID:", response.data.pengajuanID);
        navigate(`${basePath}/success?id=${response.data.pengajuanID}`, {
          state: { pengajuanID: response.data.pengajuanID },
        });
      } else {
        console.error("FAILURE PATH: response.success is not true or missing pengajuanID:", JSON.stringify(response));
        alert(`Gagal: ${response.message || "Terjadi kesalahan"}`);
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      alert(`Terjadi kesalahan: ${error.message || "Gagal mengirim pengajuan"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Batalkan pengajuan? Data yang sudah diisi akan hilang.")) {
      navigate(basePath);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "10px 14px",
    border: `1px solid ${hasError ? "#E24B4A" : "#D3D1C7"}`,
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    color: "#2C2C2A",
    background: "white",
    transition: "border-color 0.15s",
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#1A3A6B",
    marginBottom: 6,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#E24B4A",
    marginTop: 4,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif", position: "relative" }}>
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundImage: "url(/background.png)", backgroundSize: "cover", backgroundPosition: "center", zIndex: 0, opacity: 0.7 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", width: "100%" }}>
      <PartnershipSidebar />
      <main style={{ marginLeft: sidebarWidth, flex: 1, padding: "40px", maxWidth: 860 }}>
        <div style={{ background: "white", borderRadius: 16, padding: "32px 36px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

          <div style={{ marginBottom: 28, textAlign: "center" }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 700, color: "#1A3A6B" }}>
              Formulir Pengajuan Kemitraan
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "#5F5E5A", maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
              Bergabunglah dengan ekosistem kami untuk memperluas jangkauan pasar dan meningkatkan kualitas produk artisan Anda.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              background: "white",
              borderRadius: 16,
              padding: "32px 36px",
              border: "1px solid #E8E7E2",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Nama Usaha</label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  placeholder="Masukkan nama brand atau toko Anda"
                  style={inputStyle(!!errors.business_name)}
                />
                {errors.business_name && <p style={errorStyle}>{errors.business_name}</p>}
              </div>
              <div>
                <label style={labelStyle}>Kontak Person (WhatsApp/Email)</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  placeholder="e.g. 0812-3456-7890 atau email@usaha.com"
                  style={inputStyle(!!errors.contact_person)}
                />
                {errors.contact_person && <p style={errorStyle}>{errors.contact_person}</p>}
              </div>
            </div>

            {/* Pilih Mitra - Menggunakan data dari backend */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Pilih Mitra/UMKM Tujuan</label>
              <select
                name="receiver_id"
                value={formData.receiver_id}
                onChange={handleChange}
                disabled={loadingMitra || !!mitraError}
                style={{ ...inputStyle(!!errors.receiver_id), color: formData.receiver_id ? "#2C2C2A" : "#888780" }}
              >
                <option value="">
                  {loadingMitra ? "Memuat data..." : mitraError ? "Gagal memuat data" : "-- Pilih Mitra/UMKM --"}
                </option>
                {mitraList.map((mitra) => (
                  <option key={mitra.id} value={mitra.id}>
                    {mitra.name}
                  </option>
                ))}
              </select>
              {mitraError && <p style={errorStyle}>{mitraError}</p>}
              {errors.receiver_id && <p style={errorStyle}>{errors.receiver_id}</p>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Deskripsi Produk</label>
              <textarea
                name="product_description"
                value={formData.product_description}
                onChange={handleChange}
                rows={4}
                placeholder="Ceritakan keunikan produk artisan Anda, bahan baku yang digunakan, dan proses produksinya..."
                style={{ ...inputStyle(!!errors.product_description), resize: "vertical", lineHeight: 1.6 }}
              />
              {errors.product_description && <p style={errorStyle}>{errors.product_description}</p>}
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Alasan Ingin Bermitra</label>
              <textarea
                name="reason_for_partnership"
                value={formData.reason_for_partnership}
                onChange={handleChange}
                rows={3}
                placeholder="Apa harapan Anda setelah menjadi bagian dari UMKM Artisan?"
                style={{ ...inputStyle(!!errors.reason_for_partnership), resize: "vertical", lineHeight: 1.6 }}
              />
              {errors.reason_for_partnership && <p style={errorStyle}>{errors.reason_for_partnership}</p>}
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ ...labelStyle, marginBottom: 14 }}>
                Upload Legalitas / Dokumen Pendukung
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <UploadCard
                  label="NIB / KTP"
                  hint="Format: PDF, JPG (Max 2MB)"
                  icon={<IconDoc />}
                  value={files.nib_ktp}
                  onChange={handleFileChange("nib_ktp")}
                  error={fileErrors.nib_ktp}
                />
                <UploadCard
                  label="PDF Pengajuan Kemitraan"
                  hint="Format: PDF, JPG (Max 2MB)"
                  icon={<IconDoc />}
                  value={files.pdf_kemitraan}
                  onChange={handleFileChange("pdf_kemitraan")}
                  error={fileErrors.pdf_kemitraan}
                />
                <UploadCard
                  label="Sertifikat Halal/PIRT"
                  hint="Opsional, jika ada"
                  optional
                  icon={<IconCert />}
                  value={files.sertifikat}
                  onChange={handleFileChange("sertifikat")}
                  error={fileErrors.sertifikat}
                />
              </div>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #E8E7E2",
              paddingTop: 24,
            }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "10px 28px",
                  background: "none",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#5F5E5A",
                  cursor: "pointer",
                  borderRadius: 8,
                  transition: "color 0.15s",
                }}
              >
                Batalkan
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "11px 36px",
                  background: loading ? "#888780" : "#1A3A6B",
                  border: "none",
                  borderRadius: 10,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                  letterSpacing: 0.3,
                }}
              >
                {loading ? "Mengirim..." : "Kirim Pengajuan"}
              </button>
            </div>
          </form>
        </div>
      </main>
      </div>
    </div>
  );
};

export default PartnershipCreatePage;