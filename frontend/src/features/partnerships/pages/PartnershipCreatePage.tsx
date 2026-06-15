import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { partnershipsApi } from "../api";
import type { CreatePartnershipRequest } from "../types";

// ─── SVG Logo Components ──────────────────────────────────────────────────────

const LogoUMKMTumbuh: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#F5A623" />
    <path d="M8 28 L14 16 L20 22 L26 12 L32 28 Z" fill="#1A3A6B" strokeLinejoin="round" />
    <circle cx="26" cy="12" r="3" fill="#1A3A6B" />
  </svg>
);

const LogoKementrian: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="17" stroke="white" strokeWidth="1.5" fill="none" />
    <path d="M18 6 L20 13 L27 13 L21.5 17.5 L23.5 24.5 L18 20 L12.5 24.5 L14.5 17.5 L9 13 L16 13 Z"
      fill="white" />
    <text x="18" y="32" textAnchor="middle" fill="white" fontSize="5" fontFamily="serif" fontWeight="bold">KEMENKOP</text>
  </svg>
);

// ─── Upload Card ───────────────────────────────────────────────────────────────

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
    if (file.size > 2 * 1024 * 1024) {
      onChange(null, "File terlalu besar. Maks 2MB.");
      return;
    }
    const valid = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!valid.includes(file.type)) {
      onChange(null, "Format tidak didukung.");
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
        accept=".jpg,.jpeg,.png,.pdf"
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

// const IconBadge = () => (
//   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
//     <circle cx="12" cy="8" r="6" />
//     <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
//   </svg>
// );

const IconCert = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const PartnershipCreatePage: React.FC = () => {
  const navigate = useNavigate();

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
      const response = await partnershipsApi.create(apiData);
      if (response.status === "success") navigate("/partnerships/success");
      else alert(`Gagal: ${response.message}`);
    } catch {
      alert("Terjadi kesalahan saat mengirim pengajuan");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Batalkan pengajuan? Data yang sudah diisi akan hilang.")) {
      navigate("/partnerships");
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
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#F5F4F0" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 200,
        minWidth: 200,
        background: "#1A3A6B",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        zIndex: 100,
      }}>
        {/* Logo area */}
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <LogoUMKMTumbuh size={36} />
            <span style={{ color: "#F5A623", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
              UMKM<br />Tumbuh
            </span>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "16px 0" }}>
          {[
            {
              label: "Monitoring Perkembangan Usaha",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              ),
              active: false,
              path: "/dashboard",
            },
            {
              label: "Pengajuan Kemitraan",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              ),
              active: true,
              path: "/partnerships/create",
            },
            {
              label: "Kelola Informasi UMKM",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                </svg>
              ),
              active: false,
              path: "/umkm",
            },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                width: "100%",
                padding: "10px 20px",
                background: item.active ? "#F5A623" : "transparent",
                border: "none",
                borderRadius: item.active ? "0 20px 20px 0" : 0,
                marginRight: item.active ? 12 : 0,
                color: item.active ? "#1A3A6B" : "rgba(255,255,255,0.75)",
                fontSize: 13,
                fontWeight: item.active ? 700 : 400,
                cursor: "pointer",
                textAlign: "left",
                lineHeight: 1.4,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <span style={{ marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <button
            onClick={() => navigate("/logout")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              color: "#E24B4A",
              fontSize: 13,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Keluar
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────────── */}
      <main style={{ marginLeft: 200, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Top Bar */}
        <header style={{
          background: "white",
          borderBottom: "1px solid #E8E7E2",
          padding: "0 32px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 16,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
          {/* Notification */}
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#888780", padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>

          {/* Profile chip */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#2C2C2A" }}>Nusantara Ventures</p>
              <p style={{ margin: 0, fontSize: 11, color: "#888780" }}>MITRA</p>
            </div>
            <LogoKementrian size={34} />
          </div>
        </header>

        {/* Form Area */}
        <div style={{ padding: "32px 40px", maxWidth: 860, width: "100%" }}>

          {/* Page heading */}
          <div style={{ marginBottom: 28, textAlign: "center" }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 700, color: "#1A3A6B" }}>
              Formulir Pengajuan Kemitraan
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "#5F5E5A", maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
              Bergabunglah dengan ekosistem kami untuk memperluas jangkauan pasar dan meningkatkan kualitas produk artisan Anda.
            </p>
          </div>

          {/* Card form */}
          <form
            onSubmit={handleSubmit}
            style={{
              background: "white",
              borderRadius: 16,
              padding: "32px 36px",
              border: "1px solid #E8E7E2",
            }}
          >
            {/* Row 1: Nama Usaha + Kontak Person */}
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

            {/* Pilih Mitra */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Pilih Mitra/UMKM Tujuan</label>
              <select
                name="receiver_id"
                value={formData.receiver_id}
                onChange={handleChange}
                style={{ ...inputStyle(!!errors.receiver_id), color: formData.receiver_id ? "#2C2C2A" : "#888780" }}
              >
                <option value="">-- Pilih Mitra/UMKM --</option>
                <option value="mitra1">PT. Mitra Sejahtera</option>
                <option value="mitra2">Koperasi Makmur Jaya</option>
                <option value="mitra3">PT. Food Station</option>
              </select>
              {errors.receiver_id && <p style={errorStyle}>{errors.receiver_id}</p>}
            </div>

            {/* Deskripsi Produk */}
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

            {/* Alasan Bermitra */}
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

            {/* Upload Dokumen */}
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

            {/* Action buttons */}
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
  );
};

export default PartnershipCreatePage;