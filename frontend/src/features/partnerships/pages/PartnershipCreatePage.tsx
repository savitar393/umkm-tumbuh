import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { partnershipsApi } from "../api";
import type { CreatePartnershipRequest } from "../types";
import PartnershipSidebar from "../components/PartnershipSidebar";
import { getCurrentUser } from "../../../shared/auth/currentUser";

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
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      onChange(null, "ERR-FILE-02: Hanya file PDF, JPG, dan PNG yang diperbolehkan.");
      return;
    }
    onChange(file.name);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        border: error ? "1.5px dashed #E24B4A" : value ? "1.5px dashed #1D9E75" : "1.5px dashed #B4B2A9",
        borderRadius: 12, padding: "20px 12px", textAlign: "center", cursor: "pointer",
        background: value ? "#F0FAF6" : "white", transition: "border-color 0.2s, background 0.2s",
        minHeight: 120, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 8,
      }}
    >
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={handleFile} />
      <div style={{ color: value ? "#0F6E56" : "#888780", fontSize: 28 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: value ? "#0F6E56" : "#2C2C2A" }}>
        {value ? value : label}
        {optional && !value && <span style={{ fontWeight: 400, color: "#888780", marginLeft: 4 }}>(opsional)</span>}
      </p>
      {!value && <p style={{ margin: 0, fontSize: 11, color: "#888780" }}>{hint}</p>}
      {error && <p style={{ margin: 0, fontSize: 11, color: "#E24B4A" }}>{error}</p>}
    </div>
  );
};

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

function validateContact(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Kontak person wajib diisi";

  const digitCount = (trimmed.match(/\d/g) || []).length;
  const hasOnlyDigits = /^[\d\s\-()+]+$/.test(trimmed);

  if (hasOnlyDigits && digitCount > 0) {
    if (!trimmed.startsWith("08")) return "Nomor telepon harus diawali 08";
    if (digitCount < 11 || digitCount > 13) return "Nomor telepon harus 11-13 angka";
    return null;
  }

  if (trimmed.includes("@")) {
    if (!trimmed.includes("@") || !trimmed.toLowerCase().includes(".com"))
      return "Format email harus mengandung @ dan .com";
    return null;
  }

  return null;
}

const PartnershipCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const basePath = user?.role === "MITRA" ? "/mitra/partnerships" : "/umkm/partnerships";
  const isMitra = user?.role === "MITRA";

  const params = new URLSearchParams(location.search);
  const preselectedReceiverId = params.get("receiver_id") || "";

  const isFromDetail = !!preselectedReceiverId;

  const [mitraList, setMitraList] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingMitra, setLoadingMitra] = useState(true);
  const [mitraError, setMitraError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedPartnerName, setSelectedPartnerName] = useState("");

  const [formData, setFormData] = useState({
    receiver_id: preselectedReceiverId,
    business_name: user?.full_name || "",
    contact_person: user?.email || "",
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchPartnerList = async () => {
      setLoadingMitra(true);
      setMitraError(null);
      try {
        if (isMitra) {
          const response = await partnershipsApi.listUMKM({ page: 1, limit: 100 });
          if (response.umkm) setMitraList(response.umkm.map(m => ({ id: m.id, name: m.name })));
        } else {
          const response = await partnershipsApi.listMitra({ page: 1, limit: 100 });
          if (response.mitra) setMitraList(response.mitra.map(m => ({ id: m.id, name: m.name })));
        }
      } catch (error: any) {
        setMitraError(error.message || "Gagal memuat daftar");
      } finally {
        setLoadingMitra(false);
      }
    };
    fetchPartnerList();
  }, [isMitra]);

  useEffect(() => {
    if (preselectedReceiverId && mitraList.length > 0) {
      const found = mitraList.find(m => m.id === preselectedReceiverId);
      if (found) setSelectedPartnerName(found.name);
    }
  }, [preselectedReceiverId, mitraList]);

  const filteredList = mitraList.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (isFromDetail && (name === "business_name" || name === "contact_person")) return;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleSelectPartner = (id: string, name: string) => {
    setFormData(p => ({ ...p, receiver_id: id }));
    setSelectedPartnerName(name);
    setShowDropdown(false);
    setSearchQuery("");
    if (errors.receiver_id) setErrors(p => { const n = { ...p }; delete n.receiver_id; return n; });
  };

  const handleFileChange = (key: keyof typeof files) => (filename: string | null, error?: string) => {
    if (error) {
      setFileErrors(p => ({ ...p, [key]: error }));
      setFiles(p => ({ ...p, [key]: null }));
    } else {
      setFiles(p => ({ ...p, [key]: filename }));
      setFileErrors(p => { const n = { ...p }; delete n[key]; return n; });
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.business_name.trim()) e.business_name = "Nama usaha wajib diisi";
    const contactErr = validateContact(formData.contact_person);
    if (contactErr) e.contact_person = contactErr;
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

      if (!files.nib_ktp) throw new Error("ERR-FILE-01: Dokumen NIB/KTP wajib diunggah.");
      if (!files.pdf_kemitraan) throw new Error("ERR-FILE-01: Dokumen PDF Pengajuan Kemitraan wajib diunggah.");

      if (apiData.proposal_title.length < 10) throw new Error("proposal_title minimal 10 karakter");
      if (apiData.proposal_description.length < 30) throw new Error("proposal_description minimal 30 karakter");

      const response = await partnershipsApi.create(apiData);

      if (response.success === true && response.data?.pengajuanID) {
        navigate(`${basePath}/success?id=${response.data.pengajuanID}`, {
          state: { pengajuanID: response.data.pengajuanID },
        });
      } else {
        alert(`Gagal: ${response.message || "Terjadi kesalahan"}`);
      }
    } catch (error: any) {
      alert(`Terjadi kesalahan: ${error.message || "Gagal mengirim pengajuan"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Batalkan pengajuan? Data yang sudah diisi akan hilang.")) {
      navigate(isFromDetail ? `${basePath}` : basePath);
    }
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: "100%", padding: "10px 14px",
    border: `1px solid ${hasError ? "#E24B4A" : "#D3D1C7"}`,
    borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", color: "#2C2C2A", background: "white",
    transition: "border-color 0.15s",
  });

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 600, color: "#1A3A6B", marginBottom: 6,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 12, color: "#E24B4A", marginTop: 4,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif", position: "relative" }}>
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundImage: "url(/background.png)", backgroundSize: "cover", backgroundPosition: "center", zIndex: 0, opacity: 0.7 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", width: "100%" }}>
        <PartnershipSidebar />
        <main style={{ marginLeft: 260, flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 860, padding: "40px" }}>
            <div style={{ background: "white", borderRadius: 16, padding: "32px 36px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ marginBottom: 28, textAlign: "center" }}>
                <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 700, color: "#1A3A6B" }}>
                  Formulir Pengajuan Kemitraan
                </h1>
                <p style={{ margin: "0 auto", fontSize: 14, color: "#5F5E5A", maxWidth: 520 }}>
                  {isFromDetail
                    ? `Anda akan mengajukan kemitraan dengan ${selectedPartnerName || "mitra terpilih"}.`
                    : "Bergabunglah dengan ekosistem kami untuk memperluas jangkauan pasar."}
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ background: "white", borderRadius: 16, padding: "32px 36px", border: "1px solid #E8E7E2" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                  <div>
                    <label style={labelStyle}>Nama Usaha</label>
                    <input
                      type="text"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleChange}
                      readOnly={isFromDetail}
                      placeholder={isFromDetail ? "Otomatis dari akun Anda" : "Masukkan nama brand atau toko Anda"}
                      style={{ ...inputStyle(!!errors.business_name), background: isFromDetail ? "#F5F4F0" : "white", cursor: isFromDetail ? "not-allowed" : "text" }}
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
                      readOnly={isFromDetail}
                      placeholder={isFromDetail ? "Otomatis dari akun Anda" : "e.g. 0812-3456-7890 atau email@usaha.com"}
                      style={{ ...inputStyle(!!errors.contact_person), background: isFromDetail ? "#F5F4F0" : "white", cursor: isFromDetail ? "not-allowed" : "text" }}
                    />
                    {errors.contact_person && <p style={errorStyle}>{errors.contact_person}</p>}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Pilih Mitra/UMKM Tujuan</label>
                  {isFromDetail ? (
                    <input
                      type="text"
                      value={selectedPartnerName || "Memuat..."}
                      readOnly
                      style={{ ...inputStyle(), background: "#F5F4F0", cursor: "not-allowed" }}
                    />
                  ) : (
                    <div ref={dropdownRef} style={{ position: "relative" }}>
                      <input
                        type="text"
                        placeholder={loadingMitra ? "Memuat data..." : mitraError ? "Gagal memuat data" : "Cari mitra/UMKM..."}
                        value={searchQuery || selectedPartnerName}
                        onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); if (!e.target.value) { setSelectedPartnerName(""); setFormData(p => ({ ...p, receiver_id: "" })); } }}
                        onFocus={() => setShowDropdown(true)}
                        style={{ ...inputStyle(!!errors.receiver_id) }}
                      />
                      {showDropdown && (
                        <div style={{
                          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                          background: "white", border: "1px solid #D3D1C7", borderRadius: 8,
                          marginTop: 4, maxHeight: 240, overflow: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}>
                          {filteredList.length === 0 ? (
                            <div style={{ padding: "12px 14px", fontSize: 13, color: "#888780" }}>Tidak ditemukan</div>
                          ) : (
                            filteredList.map(m => (
                              <div
                                key={m.id}
                                onClick={() => handleSelectPartner(m.id, m.name)}
                                style={{
                                  padding: "10px 14px", cursor: "pointer", fontSize: 13, color: "#2C2C2A",
                                  borderBottom: "1px solid #F1EFE8", transition: "background 0.1s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#FAFAF8"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >
                                {m.name}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
                  <label style={{ ...labelStyle, marginBottom: 14 }}>Upload Legalitas / Dokumen Pendukung</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                    <UploadCard label="NIB / KTP" hint="PDF, JPG, PNG (Max 10MB)" icon={<IconDoc />} value={files.nib_ktp} onChange={handleFileChange("nib_ktp")} error={fileErrors.nib_ktp} />
                    <UploadCard label="PDF Pengajuan Kemitraan" hint="PDF, JPG, PNG (Max 10MB)" icon={<IconDoc />} value={files.pdf_kemitraan} onChange={handleFileChange("pdf_kemitraan")} error={fileErrors.pdf_kemitraan} />
                    <UploadCard label="Sertifikat Halal/PIRT" hint="Opsional, jika ada" optional icon={<IconCert />} value={files.sertifikat} onChange={handleFileChange("sertifikat")} error={fileErrors.sertifikat} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E8E7E2", paddingTop: 24 }}>
                  <button type="button" onClick={handleCancel}
                    style={{ padding: "10px 28px", background: "none", border: "none", fontSize: 14, fontWeight: 600, color: "#5F5E5A", cursor: "pointer", borderRadius: 8 }}>
                    Batalkan
                  </button>
                  <button type="submit" disabled={loading}
                    style={{
                      padding: "11px 36px", background: loading ? "#888780" : "#1A3A6B",
                      border: "none", borderRadius: 10, color: "white", fontSize: 14,
                      fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                      transition: "background 0.15s", letterSpacing: 0.3,
                    }}>
                    {loading ? "Mengirim..." : "Kirim Pengajuan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PartnershipCreatePage;
