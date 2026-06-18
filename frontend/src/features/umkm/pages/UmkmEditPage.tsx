import { type FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile } from "../api";
import type { UmkmProfilePayload } from "../api";
import { getMyDocuments, uploadDocument, viewDocument } from "../../../shared/api/documents";
import type { DocumentItem } from "../../../shared/api/documents";
import logoImg from "../../../assets/logo-umkm-tumbuh.png";
import "./umkm-profile.css";

type CurrentUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

function getCurrentUser(): CurrentUser | null {
  const raw = localStorage.getItem("current_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

type FormErrors = Partial<Record<keyof UmkmProfilePayload, string>>;

export default function UmkmEditPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState<UmkmProfilePayload>({
    business_name: "",
    business_category: "",
    business_description: "",
    owner_name: "",
    phone_number: "",
    city: "",
    province: "",
    omzet: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function fetchDocs() {
    getMyDocuments()
      .then(res => setDocs(res.documents || []))
      .catch(() => {});
  }

  function getDocByType(type: string) {
    return docs.find(d => d.document_type === type);
  }

  async function handleDocUpload(docType: string, file: File) {
    setUploadMsg("");

    try {
      await uploadDocument(file, docType as any);
      setUploadMsg(`${docType} berhasil diunggah!`);
      fetchDocs();
    } catch (err: any) {
      setUploadMsg(`Gagal: ${err.message}`);
    }
  }

  function triggerFileUpload(docType: string) {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("data-doctype", docType);
      fileInputRef.current.click();
    }
  }

  useEffect(() => {
    getProfile()
      .then((res) => {
        const p = res.profile;
        setForm({
          business_name: p.name || "",
          business_category: p.category || "",
          business_description: p.description || "",
          owner_name: p.person || "",
          phone_number: p.phone_number || "",
          address: p.address || "",
          city: p.city || "",
          province: p.province || "",
          omzet: p.omzet || 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetchDocs();

    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.business_name.trim()) {
      errs.business_name = "Nama usaha wajib diisi";
    }
    if (form.phone_number && !/^[0-9]{7,15}$/.test(form.phone_number.replace(/\D/g, ""))) {
      errs.phone_number = "Nomor telepon tidak valid";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;
    setSaving(true);
    try {
      await updateProfile(form);
      setShowToast(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof UmkmProfilePayload>(key: K, value: UmkmProfilePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    navigate("/login");
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const hasFormErrors = Object.keys(errors).length > 0 || !!submitError;

  if (loading) {
    return (
      <div className="up-page">
        <aside className="up-sidebar">
          <div className="up-sidebar-logo">
            <img src={logoImg} alt="logo" className="up-sidebar-logo-img" />
            <span className="up-sidebar-logo-text">UMKM Tumbuh</span>
          </div>
        </aside>
        <div className="up-right">
          <div style={{ padding: 40, color: "#6b7280", fontSize: 14 }}>Memuat profil...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="up-page">
      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="up-sidebar">
        <div className="up-sidebar-logo">
          <img src={logoImg} alt="logo" className="up-sidebar-logo-img" />
          <span className="up-sidebar-logo-text">UMKM Tumbuh</span>
        </div>
        <nav className="up-nav">
          <button type="button" className="up-nav-item">
            <span className="up-nav-icon">📚</span>
            Pelatihan Saya
          </button>
          <button type="button" className="up-nav-item active">
            <span className="up-nav-icon">🏢</span>
            Kelola Informasi
          </button>
          <button type="button" className="up-nav-item">
            <span className="up-nav-icon">📊</span>
            Dashboard
          </button>
          <button type="button" className="up-nav-item">
            <span className="up-nav-icon">🤝</span>
            Pengajuan Kemitraan
          </button>
          <button type="button" className="up-nav-item">
            <span className="up-nav-icon">⚙️</span>
            Pengaturan
          </button>
        </nav>
        <div style={{ padding: "0 12px 20px" }}>
          <button type="button" className="up-nav-logout" onClick={logout}>
            <span>🚪</span> Keluar
          </button>
        </div>
      </aside>

      {/* ── RIGHT AREA ──────────────────────────────────────── */}
      <div className="up-right">
        {/* Header */}
        <header className="up-header">
          <div className="up-header-search">
            <span className="up-header-search-icon">🔍</span>
            <input placeholder="Cari..." />
          </div>
          {showToast && (
            <div className="up-toast">✓ Profil berhasil disimpan!</div>
          )}
          <div className="up-header-right">
            <button type="button" className="up-header-bell">🔔</button>
            <div className="up-header-user">
              <div className="up-header-user-info">
                <span className="up-header-user-name">{user?.full_name || "UMKM"}</span>
                <span className="up-header-user-role">Pemilik UMKM</span>
              </div>
              <div className="up-header-avatar">{initials}</div>
            </div>
          </div>
        </header>

        {/* Edit form */}
        <form onSubmit={handleSubmit}>
          <div className="up-edit-content">
            <div className="up-edit-heading">
              <h1 className="up-edit-title">Edit Profil Bisnis</h1>
              <p className="up-edit-subtitle">
                Lengkapi informasi usaha Anda untuk meningkatkan kepercayaan mitra.
              </p>
            </div>

            {hasFormErrors && (
              <div className="up-alert-banner">
                ⚠️ {submitError || "Mohon periksa kembali data Anda"}
              </div>
            )}

            {/* ── SECTION 1: Informasi Dasar ── */}
            <div className="up-section">
              <div className="up-section-head">
                <div className="up-section-icon">ℹ️</div>
                <span className="up-section-title">Informasi Dasar</span>
                <span className="up-section-badge">Wajib</span>
              </div>
              <div className="up-form-grid">
                <div className="up-form-group">
                  <label className="up-form-label">Nama Usaha *</label>
                  <input
                    className={`up-input${errors.business_name ? " has-error" : ""}`}
                    value={form.business_name}
                    onChange={(e) => set("business_name", e.target.value)}
                    placeholder="Masukkan nama usaha Anda"
                  />
                  {errors.business_name && (
                    <span className="up-error-text">{errors.business_name}</span>
                  )}
                </div>
                <div className="up-form-group">
                  <label className="up-form-label">Kategori Usaha</label>
                  <select
                    className="up-select"
                    value={form.business_category}
                    onChange={(e) => set("business_category", e.target.value)}
                  >
                    <option value="">Pilih kategori</option>
                    <option value="Kuliner">Kuliner</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Retail">Retail</option>
                    <option value="Jasa">Jasa</option>
                    <option value="Teknologi">Teknologi</option>
                    <option value="Pertanian">Pertanian</option>
                    <option value="Kerajinan">Kerajinan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="up-form-group">
                  <label className="up-form-label">Nama Pemilik</label>
                  <input
                    className="up-input"
                    value={form.owner_name}
                    onChange={(e) => set("owner_name", e.target.value)}
                    placeholder="Nama lengkap pemilik usaha"
                  />
                </div>
                <div className="up-form-group">
                  <label className="up-form-label">Tahun Berdiri</label>
                  <input
                    className="up-input"
                    placeholder="Contoh: 2018"
                    disabled
                    style={{ opacity: 0.5, cursor: "not-allowed" }}
                  />
                </div>
                <div className="up-form-group full">
                  <label className="up-form-label">Rata-rata Omzet Per Bulan (Rp)</label>
                  <input
                    type="number"
                    className="up-input"
                    value={form.omzet || ""}
                    onChange={(e) => set("omzet", Number(e.target.value))}
                    placeholder="Contoh: 5000000"
                  />
                </div>
                <div className="up-form-group full">
                  <label className="up-form-label">Deskripsi Usaha</label>
                  <textarea
                    className="up-textarea"
                    value={form.business_description}
                    onChange={(e) => set("business_description", e.target.value)}
                    placeholder="Ceritakan tentang usaha Anda, produk/layanan yang ditawarkan..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Kontak & Lokasi ── */}
            <div className="up-section">
              <div className="up-section-head">
                <div className="up-section-icon">📍</div>
                <span className="up-section-title">Kontak & Lokasi</span>
              </div>
              <div className="up-form-grid">
                <div className="up-form-group">
                  <label className="up-form-label">Nomor Telepon</label>
                  <div className={`up-phone-wrap${errors.phone_number ? " has-error" : ""}`}>
                    <span className="up-phone-prefix">+62</span>
                    <input
                      className="up-phone-input"
                      value={(form.phone_number ?? "").replace(/^\+?62/, "")}
                      onChange={(e) => set("phone_number", e.target.value)}
                      placeholder="812-3456-7890"
                    />
                  </div>
                  {errors.phone_number && (
                    <span className="up-error-text">{errors.phone_number}</span>
                  )}
                </div>
                <div className="up-form-group">
                  <label className="up-form-label">Email Bisnis</label>
                  <input
                    className="up-input"
                    placeholder="email@usaha.com"
                    disabled
                    style={{ opacity: 0.5, cursor: "not-allowed" }}
                  />
                </div>
                <div className="up-form-group full">
                  <label className="up-form-label">Alamat Usaha</label>
                  <input
                    className="up-input"
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Jl. Contoh No. 123, RT/RW..."
                  />
                </div>
                <div className="up-form-group">
                  <label className="up-form-label">Kota</label>
                  <input
                    className="up-input"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="Jakarta, Surabaya, ..."
                  />
                </div>
                <div className="up-form-group">
                  <label className="up-form-label">Provinsi</label>
                  <input
                    className="up-input"
                    value={form.province}
                    onChange={(e) => set("province", e.target.value)}
                    placeholder="DKI Jakarta, Jawa Timur, ..."
                  />
                </div>
              </div>
            </div>

            {/* ── SECTION 3: Legalitas & Visual ── */}
            <div className="up-section">
              <div className="up-section-head">
                <div className="up-section-icon">📄</div>
                <span className="up-section-title">Legalitas & Visual</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: "none" }}
                onChange={(e) => {
                  const doctype = fileInputRef.current?.getAttribute("data-doctype") || "";
                  const file = e.target.files?.[0];
                  if (file) handleDocUpload(doctype, file);
                }}
              />

              {uploadMsg && (
                <div style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: 13, marginBottom: 12,
                  background: uploadMsg.includes("berhasil") ? "#d1fae5" : "#fee2e2",
                  color: uploadMsg.includes("berhasil") ? "#065f46" : "#991b1b",
                }}>
                  {uploadMsg}
                </div>
              )}

              <div className="up-legvis-grid">
                <div className="up-legvis-left">
                  <div>
                    <p className="up-upload-label">Logo Usaha</p>
                    <div
                      className="up-logo-upload-area"
                      onClick={() => triggerFileUpload("LOGO")}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="up-upload-icon">🏪</span>
                      <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                        Klik untuk upload
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="up-upload-label">Foto Utama Usaha</p>
                    <div
                      className="up-foto-upload"
                      onClick={() => triggerFileUpload("FOTO_USAHA")}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="up-foto-upload-overlay">
                        <span className="up-foto-upload-icon">📷</span>
                        <span className="up-foto-upload-text">Upload foto usaha Anda</span>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>
                          JPG, PNG — maks. 5MB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="up-doc-status-head">STATUS DOKUMEN</p>
                  <div className="up-doc-status-list">
                    {[
                      { type: "NIB", label: "Nomor Induk Berusaha (NIB)" },
                      { type: "NPWP", label: "NPWP Usaha" },
                      { type: "SIUP", label: "SIUP / Izin Usaha" },
                      { type: "SERTIFIKASI_HALAL", label: "Sertifikasi Halal" },
                    ].map(({ type, label }) => {
                      const doc = getDocByType(type);
                      return (
                        <div key={type} className="up-doc-status-item">
                          <div className={`up-doc-check ${doc ? "ok" : "missing"}`}>
                            {doc ? "✓" : "○"}
                          </div>
                          <span className="up-doc-name">{label}</span>
                          {doc ? (
                            <>
                              <button type="button" className="up-doc-action change"
                                onClick={() => triggerFileUpload(type)}
                              >
                                Ganti
                              </button>
                              <button type="button" className="up-doc-action upload"
                                onClick={async () => {
                                  try { await viewDocument(doc.id); }
                                  catch (e) { setUploadMsg(e instanceof Error ? e.message : "Gagal membuka dokumen"); }
                                }}
                                style={{ marginLeft: 4 }}
                              >
                                Lihat
                              </button>
                            </>
                          ) : (
                            <button type="button" className="up-doc-action upload"
                              onClick={() => triggerFileUpload(type)}
                            >
                              Upload
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="up-doc-note">
                    * Upload dokumen dalam format PDF atau JPG. Dokumen akan diverifikasi oleh tim
                    UMKM Tumbuh dalam 1–3 hari kerja.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── FIXED FOOTER ── */}
          <div className="up-edit-footer">
            <button
              type="button"
              className="up-footer-cancel"
              onClick={() => navigate("/profile/umkm")}
            >
              Batal
            </button>
            <button type="submit" className="up-footer-save" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
