import { useEffect, useState, useRef, type FormEvent, type MouseEvent } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { getProfile, updateProfile } from "../api";
import type { MitraProfile, MitraProfilePayload } from "../api";
import { getMyDocuments, uploadMitraDocument, downloadDocument, viewDocument } from "../../../shared/api/documents";
import type { DocumentItem } from "../../../shared/api/documents";
import logo from "../../../assets/logo-umkm-tumbuh.png";
import "./mitra-profile.css";

/* ── helpers ─────────────────────────────────────────── */
type CurrentUser = { id: string; full_name: string; email: string; role: string; status: string };

function getUser(): CurrentUser | null {
  try { return JSON.parse(localStorage.getItem("current_user") ?? "null"); }
  catch { return null; }
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}

type ActiveModal = "group" | "pic" | "bidang" | "docs" | null;

/* ============================================================
   SIDEBAR
   ============================================================ */
function Sidebar() {
  const navigate = useNavigate();
  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    navigate("/login");
  }

  return (
    <aside className="mp-sidebar">
      <div className="mp-sidebar-logo">
        <img src={logo} alt="UMKM Tumbuh" className="mp-sidebar-logo-img" />
        <span className="mp-sidebar-logo-text">UMKM Tumbuh</span>
      </div>
      <nav className="mp-nav">
        <Link to="/mitra" className="mp-nav-item">
          <span className="mp-nav-icon">📊</span>
          Monitoring Perkembangan Usaha
        </Link>
        <Link to="/mitra" className="mp-nav-item">
          <span className="mp-nav-icon">🤝</span>
          Pengajuan Kemitraan
        </Link>
        <Link to="/profile/mitra" className="mp-nav-item active">
          <span className="mp-nav-icon">📝</span>
          Kelola Informasi Mitra
        </Link>
        <button className="mp-nav-item" style={{ marginTop: "auto" }} onClick={logout}>
          <span className="mp-nav-icon">🚪</span>
          Keluar
        </button>
      </nav>
    </aside>
  );
}

/* ============================================================
   HEADER
   ============================================================ */
function Header({ companyName }: { companyName: string }) {
  const user = getUser();
  const avatarLetter = initials(companyName || user?.full_name || "M");

  return (
    <header className="mp-header">
      <span className="mp-header-title">Kelola Informasi Mitra</span>
      <div className="mp-header-search">
        <span className="mp-header-search-icon">🔍</span>
        <input placeholder="Cari informasi..." />
      </div>
      <div className="mp-header-right">
        <button className="mp-header-icon-btn" title="Notifikasi">🔔</button>
        <button className="mp-header-icon-btn" title="Pengaturan">⚙️</button>
        <div className="mp-header-user">
          <div className="mp-header-user-info">
            <span className="mp-header-company">{companyName || user?.full_name || "Mitra"}</span>
            <span className="mp-header-badge">MITRA</span>
          </div>
          <div className="mp-header-avatar">{avatarLetter}</div>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   MODAL — Edit Informasi Organisasi  (/profile/mitra/group)
   ============================================================ */
function OrgModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: MitraProfile | null;
  onClose: () => void;
  onSaved: (p: MitraProfile) => void;
}) {
  const [orgName, setOrgName] = useState(profile?.name ?? "");
  const [orgType, setOrgType] = useState(profile?.category ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [nib, setNib] = useState("");
  const [npwp, setNpwp] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) { setError("Nama perusahaan wajib diisi."); return; }
    setError("");
    setSaving(true);
    try {
      const payload: MitraProfilePayload = {
        organization_name: orgName.trim(),
        organization_type: orgType.trim(),
        description: profile?.description ?? "",
        contact_person: profile?.person ?? "",
        phone_number: profile?.phone_number ?? "",
        address: address.trim(),
        city: profile?.city ?? "",
        province: profile?.province ?? "",
      };
      const res = await updateProfile(payload);
      onSaved(res.profile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan.";
      console.error("[OrgModal] save error:", err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mp-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mp-modal">
        <div className="mp-modal-head">
          <div>
            <div className="mp-modal-title">Edit Informasi Organisasi</div>
            <div className="mp-modal-subtitle">Perbarui detail badan hukum dan operasional mitra di sini.</div>
          </div>
          <button className="mp-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Verify banner */}
        <div className="mp-verify-banner">
          <div>
            <div className="mp-verify-label">Status Verifikasi</div>
            <div className="mp-verify-status">
              <span className="mp-verify-dot" />
              Terverifikasi
            </div>
          </div>
        </div>

        <form className="mp-modal-body" onSubmit={handleSubmit}>
          {error && <div className="mp-modal-alert error">{error}</div>}

          {/* Nama Perusahaan */}
          <div className="mp-form-field">
            <label className="mp-form-label">Nama Perusahaan</label>
            <input
              className="mp-form-input"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="PT. Nama Perusahaan"
            />
          </div>

          {/* Jenis Mitra + NIB */}
          <div className="mp-form-row">
            <div className="mp-form-field">
              <label className="mp-form-label">Jenis Mitra</label>
              <select
                className="mp-form-select"
                value={orgType}
                onChange={e => setOrgType(e.target.value)}
              >
                <option value="">Pilih tipe...</option>
                <option value="Penyedia Teknologi">Penyedia Teknologi</option>
                <option value="Sektor Swasta (Private)">Sektor Swasta (Private)</option>
                <option value="BUMN">BUMN</option>
                <option value="Koperasi">Koperasi</option>
                <option value="Yayasan">Yayasan</option>
                <option value="Lembaga Pemerintah">Lembaga Pemerintah</option>
              </select>
            </div>
            <div className="mp-form-field">
              <label className="mp-form-label">NIB (Nomor Induk Perusahaan)</label>
              <input
                className="mp-form-input"
                value={nib}
                onChange={e => setNib(e.target.value)}
                placeholder="1234567890123"
              />
            </div>
          </div>

          {/* NPWP + Unduh */}
          <div className="mp-form-field">
            <label className="mp-form-label">NPWP Perusahaan</label>
            <div className="mp-form-input-action">
              <input
                className="mp-form-input"
                value={npwp}
                onChange={e => setNpwp(e.target.value)}
                placeholder="01.234.567.8-001.000"
              />
              <button type="button" className="mp-unduh-btn">Unduh Dokumen</button>
            </div>
          </div>

          {/* Alamat */}
          <div className="mp-form-field">
            <label className="mp-form-label">Alamat Kantor Pusat</label>
            <textarea
              className="mp-form-textarea"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Jl. Contoh No. 1, Kota, Provinsi"
              rows={3}
            />
          </div>
        </form>

        <div className="mp-modal-footer">
          <button className="mp-btn-cancel" onClick={onClose}>Batal</button>
          <button
            className="mp-btn-save"
            onClick={(e: MouseEvent) => handleSubmit(e as unknown as FormEvent)}
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "💾 Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL — Edit Informasi PIC  (/profile/mitra/pic)
   ============================================================ */
function PicModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: MitraProfile | null;
  onClose: () => void;
  onSaved: (p: MitraProfile) => void;
}) {
  const [picName, setPicName] = useState(profile?.person ?? "");
  const [jabatan, setJabatan] = useState("");
  const [email, setEmail] = useState(getUser()?.email ?? "");
  const [whatsapp, setWhatsapp] = useState(profile?.phone_number ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload: MitraProfilePayload = {
        organization_name: profile?.name ?? "",
        organization_type: profile?.category ?? "",
        description: profile?.description ?? "",
        contact_person: picName.trim(),
        phone_number: whatsapp.trim(),
        address: profile?.address ?? "",
        city: profile?.city ?? "",
        province: profile?.province ?? "",
      };
      const res = await updateProfile(payload);
      onSaved(res.profile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan.";
      console.error("[PicModal] save error:", err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mp-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mp-modal">
        <div className="mp-modal-head">
          <div>
            <div className="mp-modal-title">Edit Informasi PIC</div>
            <div className="mp-modal-subtitle">Perbarui detail kontak penanggung jawab utama.</div>
          </div>
          <button className="mp-modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="mp-modal-body" onSubmit={handleSubmit}>
          {error && <div className="mp-modal-alert error">{error}</div>}

          <div className="mp-form-field">
            <label className="mp-form-label">Nama Lengkap</label>
            <div className="mp-form-input-wrap">
              <span className="mp-form-input-icon">👤</span>
              <input
                className="mp-form-input with-icon"
                value={picName}
                onChange={e => setPicName(e.target.value)}
                placeholder="Nama PIC"
              />
            </div>
          </div>

          <div className="mp-form-field">
            <label className="mp-form-label">Jabatan</label>
            <div className="mp-form-input-wrap">
              <span className="mp-form-input-icon">💼</span>
              <input
                className="mp-form-input with-icon"
                value={jabatan}
                onChange={e => setJabatan(e.target.value)}
                placeholder="Contoh: Operations Manager"
              />
            </div>
          </div>

          <div className="mp-form-row">
            <div className="mp-form-field">
              <label className="mp-form-label">Email</label>
              <div className="mp-form-input-wrap">
                <span className="mp-form-input-icon">✉️</span>
                <input
                  className="mp-form-input with-icon"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@perusahaan.id"
                />
              </div>
            </div>
            <div className="mp-form-field">
              <label className="mp-form-label">Nomor WhatsApp</label>
              <div className="mp-form-input-wrap">
                <span className="mp-form-input-icon">📱</span>
                <input
                  className="mp-form-input with-icon"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="+62 812-3456-7890"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="mp-modal-footer">
          <button className="mp-btn-cancel" onClick={onClose}>Batal</button>
          <button
            className="mp-btn-save"
            onClick={(e: MouseEvent) => handleSubmit(e as unknown as FormEvent)}
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "💾 Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL — Edit Profil Kerja Sama  (/profile/mitra/bidang)
   ============================================================ */
function BidangModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: MitraProfile | null;
  onClose: () => void;
  onSaved: (p: MitraProfile) => void;
}) {
  const [tags, setTags] = useState<string[]>(["Digitalisasi UMKM", "Pembiayaan"]);
  const [tagInput, setTagInput] = useState("");
  const [dukungan, setDukungan] = useState(profile?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag() {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) setTags(prev => [...prev, val]);
    setTagInput("");
    inputRef.current?.focus();
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload: MitraProfilePayload = {
        organization_name: profile?.name ?? "",
        organization_type: profile?.category ?? "",
        description: dukungan.trim(),
        contact_person: profile?.person ?? "",
        phone_number: profile?.phone_number ?? "",
        address: profile?.address ?? "",
        city: profile?.city ?? "",
        province: profile?.province ?? "",
      };
      const res = await updateProfile(payload);
      onSaved(res.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mp-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mp-modal">
        <div className="mp-modal-head">
          <div>
            <div className="mp-modal-title">Edit Profil Kerja Sama</div>
            <div className="mp-modal-subtitle">Perbarui informasi bidang fokus dan jenis dukungan kemitraan Anda.</div>
          </div>
          <button className="mp-modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="mp-modal-body" onSubmit={handleSubmit}>
          {error && <div className="mp-modal-alert error">{error}</div>}

          <div className="mp-form-field">
            <label className="mp-form-label">Bidang Fokus</label>
            <div
              className="mp-tag-editor"
              onClick={() => inputRef.current?.focus()}
            >
              {tags.map(tag => (
                <span key={tag} className="mp-tag-chip">
                  {tag}
                  <button
                    type="button"
                    className="mp-tag-chip-remove"
                    onClick={e => { e.stopPropagation(); removeTag(tag); }}
                  >✕</button>
                </span>
              ))}
              <input
                ref={inputRef}
                className="mp-tag-add-input"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") { e.preventDefault(); addTag(); }
                  if (e.key === "Backspace" && !tagInput && tags.length) {
                    setTags(prev => prev.slice(0, -1));
                  }
                }}
                placeholder="+ Tambah bidang..."
              />
            </div>
            <span className="mp-form-char-hint">Tekan Enter untuk menambah bidang baru.</span>
          </div>

          <div className="mp-form-field">
            <label className="mp-form-label">Jenis Dukungan</label>
            <textarea
              className="mp-form-textarea"
              value={dukungan}
              onChange={e => setDukungan(e.target.value)}
              placeholder="Deskripsikan bentuk dukungan yang Anda berikan kepada mitra UMKM..."
              rows={4}
              maxLength={500}
            />
            <span className="mp-form-char-hint">
              {dukungan.length}/500 karakter. Jelaskan rincian bentuk dukungan Anda.
            </span>
          </div>

          <div className="mp-notice">
            <span className="mp-notice-icon">ℹ️</span>
            <span>
              Perubahan profil ini akan ditinjau oleh tim administrator UMKM Tumbuh
              dalam waktu 1×24 jam sebelum ditampilkan secara publik di direktori mitra.
            </span>
          </div>
        </form>

        <div className="mp-modal-footer">
          <button className="mp-btn-cancel" onClick={onClose}>Batal</button>
          <button
            className="mp-btn-save"
            onClick={(e: MouseEvent) => handleSubmit(e as unknown as FormEvent)}
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "💾 Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL — Upload Dokumen  (/profile/mitra/docs)
   ============================================================ */
function DocsModal({ onClose, onDocUploaded }: { onClose: () => void; onDocUploaded?: () => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("LEGALITAS");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const REQUIRED_DOCS = [
    { name: "Legalitas UMKM", type: "LEGALITAS" as const },
    { name: "Surat Komitmen", type: "SURAT_KOMITMEN" as const },
    { name: "Profil Perusahaan", type: "PROFIL_PERUSAHAAN" as const },
  ];

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError("");
    setSuccess("");

    try {
      await uploadMitraDocument(selectedFile, docType as any);
      setSuccess("Dokumen berhasil diunggah!");
      setSelectedFile(null);
      if (onDocUploaded) onDocUploaded();
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah dokumen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mp-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mp-modal">
        <div className="mp-modal-head">
          <div>
            <div className="mp-modal-title">Unggah Dokumen Baru</div>
            <div className="mp-modal-subtitle">Pastikan file sesuai dengan standar regulasi nasional.</div>
          </div>
          <button className="mp-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="mp-modal-body">
          {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</div>}
          {success && <div style={{ color: "#10b981", fontSize: 13, marginBottom: 12 }}>{success}</div>}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Jenis Dokumen</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              style={{
                width: "100%", marginTop: 6, padding: "8px 12px",
                border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13,
              }}
            >
              {REQUIRED_DOCS.map(doc => (
                <option key={doc.type} value={doc.type}>{doc.name}</option>
              ))}
            </select>
          </div>

          <div
            className={`mp-dropzone${dragOver ? " drag-over" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) setSelectedFile(file);
            }}
            onClick={() => document.getElementById("mp-file-input")?.click()}
          >
            <input
              id="mp-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={e => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }}
            />
            <span className="mp-dropzone-icon">☁️</span>
            <span className="mp-dropzone-title">
              {selectedFile ? selectedFile.name : "Tarik dan lepas file di sini"}
            </span>
            <span className="mp-dropzone-sub">
              {selectedFile
                ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                : "atau telusuri dari penyimpanan lokal Anda"}
            </span>
            <span className="mp-dropzone-limit">Maksimal ukuran file 5MB (PDF, JPG, PNG)</span>
          </div>

          <div>
            <div className="mp-docs-required-label">≡ Dokumen yang Diperlukan</div>
            <div className="mp-docs-required-list">
              {REQUIRED_DOCS.map(doc => (
                <div key={doc.name} className="mp-docs-req-item">
                  <span className="mp-docs-req-icon">📄</span>
                  <span className="mp-docs-req-name">{doc.name}</span>
                  <span className="mp-docs-req-status miss">⊗</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mp-modal-footer">
          <button className="mp-btn-cancel" onClick={onClose}>Batal</button>
          <button
            className="mp-btn-save"
            disabled={!selectedFile || uploading}
            onClick={handleUpload}
          >
            {uploading ? "Mengunggah..." : "💾 Unggah Dokumen"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function MitraProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<MitraProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<DocumentItem[]>([]);

  /* Determine which modal from URL path */
  const activeModal: ActiveModal = (() => {
    const p = location.pathname;
    if (p.endsWith("/group"))  return "group";
    if (p.endsWith("/pic"))    return "pic";
    if (p.endsWith("/bidang")) return "bidang";
    if (p.endsWith("/docs"))   return "docs";
    return null;
  })();

  function closeModal() { navigate("/profile/mitra"); }

  function fetchProfile() {
    setLoading(true);
    getProfile()
      .then(res => setProfile(res.profile))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }

  function fetchDocs() {
    getMyDocuments()
      .then(res => setDocs(res.documents || []))
      .catch(() => {});
  }

  useEffect(() => {
    fetchProfile();
    fetchDocs();
  }, [location.pathname]);

  function handleSaved(_updated: MitraProfile) {
    closeModal();
    // useEffect will re-fetch on pathname change
  }

  if (loading) {
    return (
      <div className="mp-page">
        <Sidebar />
        <div className="mp-right">
          <Header companyName="" />
          <div className="mp-content" style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
            <p style={{ color: "#6b7280", fontSize: 14 }}>Memuat profil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mp-page">
      <Sidebar />

      <div className="mp-right">
        <Header companyName={profile?.name ?? ""} />

        <div className="mp-content">
          {/* ── Hero ── */}
          <div className="mp-hero">
            <div className="mp-hero-label">Akun Mitra Terverifikasi</div>
            <div className="mp-hero-title">Lengkapi Profil Bisnis Anda</div>
            <div className="mp-hero-sub">
              Pastikan semua data organisasi dan operasional Anda terbaru untuk
              memaksimalkan peluang kemitraan strategis.
            </div>
          </div>

          {/* ── 2 × 2 cards ── */}
          <div className="mp-cards-grid">

            {/* ── Card: Informasi Organisasi ── */}
            <div className="mp-card">
              <div className="mp-card-head">
                <div className="mp-card-head-left">
                  <div className="mp-card-icon">🏢</div>
                  <div>
                    <div className="mp-card-title">Informasi Organisasi</div>
                    <div className="mp-card-subtitle">Detail entitas hukum perusahaan</div>
                  </div>
                </div>
                <button className="mp-card-edit-btn" onClick={() => navigate("/profile/mitra/group")}>
                  Edit Informasi
                </button>
              </div>

              <div className="mp-field-grid">
                <div className="mp-field span-2">
                  <span className="mp-field-label">Nama Perusahaan</span>
                  <span className="mp-field-value">
                    {profile?.name || <span className="mp-field-value empty">Belum diisi</span>}
                  </span>
                </div>
                <div className="mp-field">
                  <span className="mp-field-label">Jenis Mitra</span>
                  <span className="mp-field-value">
                    {profile?.category || <span className="mp-field-value empty">—</span>}
                  </span>
                </div>
                <div className="mp-field">
                  <span className="mp-field-label">NIB</span>
                  <span className="mp-field-value empty">—</span>
                </div>
                <div className="mp-field">
                  <span className="mp-field-label">NPWP</span>
                  <span className="mp-field-value empty">—</span>
                </div>
                {profile?.address && (
                  <div className="mp-field span-2">
                    <span className="mp-field-label">Alamat Kantor Pusat</span>
                    <span className="mp-field-value link">{profile.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Card: Informasi PIC ── */}
            <div className="mp-card">
              <div className="mp-card-head">
                <div className="mp-card-head-left">
                  <div className="mp-card-icon">👤</div>
                  <div>
                    <div className="mp-card-title">Informasi PIC</div>
                    <div className="mp-card-subtitle">Kontak penanggung jawab</div>
                  </div>
                </div>
                <button className="mp-card-edit-btn" onClick={() => navigate("/profile/mitra/pic")}>
                  ✏️
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div className="mp-pic-name">
                    {profile?.person || <span style={{ color: "#d1d5db", fontStyle: "italic", fontWeight: 400 }}>Belum diisi</span>}
                  </div>
                  <div className="mp-pic-title">—</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="mp-pic-row">
                    <span className="mp-pic-icon">✉️</span>
                    <span className="mp-pic-text">{getUser()?.email ?? "—"}</span>
                  </div>
                  <div className="mp-pic-row">
                    <span className="mp-pic-icon">📱</span>
                    <span className="mp-pic-text">{profile?.phone_number ?? "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Card: Profil Kerja Sama ── */}
            <div className="mp-card">
              <div className="mp-card-head">
                <div className="mp-card-head-left">
                  <div className="mp-card-icon">🤝</div>
                  <div>
                    <div className="mp-card-title">Profil Kerja Sama</div>
                    <div className="mp-card-subtitle">Bidang dan jenis dukungan</div>
                  </div>
                </div>
                <button className="mp-card-edit-btn" onClick={() => navigate("/profile/mitra/bidang")}>
                  Edit Informasi
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div className="mp-field-label" style={{ marginBottom: 8 }}>Bidang Fokus</div>
                  <div className="mp-tags">
                    <span className="mp-tag">Digitalisasi UMKM</span>
                    <span className="mp-tag">Pembiayaan</span>
                  </div>
                </div>
                <div>
                  <div className="mp-field-label" style={{ marginBottom: 6 }}>Jenis Dukungan</div>
                  <p className="mp-jenis-dukungan">
                    {profile?.description || "Belum ada deskripsi dukungan."}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Card: Dokumen Terunggah ── */}
            <div className="mp-card">
              <div className="mp-card-head">
                <div className="mp-card-head-left">
                  <div className="mp-card-icon">📄</div>
                  <div>
                    <div className="mp-card-title">Dokumen Terunggah</div>
                    <div className="mp-card-subtitle">Berkas verifikasi legalitas</div>
                  </div>
                </div>
                <button className="mp-upload-btn" onClick={() => navigate("/profile/mitra/docs")}>
                  ↑ Upload Baru
                </button>
              </div>

              <div className="mp-doc-list">
                {docs.length === 0 ? (
                  <span style={{ color: "#9ca3af", fontSize: 13 }}>Belum ada dokumen</span>
                ) : (
                  docs.map(doc => (
                    <div key={doc.id} className="mp-doc-item">
                      <span className="mp-doc-icon">📕</span>
                      <span className="mp-doc-name">{doc.file_name}</span>
                      <span className={`mp-doc-badge ${doc.status === "VERIFIED" ? "verified" : "pending"}`}>
                        {doc.status === "VERIFIED" ? "TERVERIFIKASI" : doc.status}
                      </span>
                      <button className="mp-doc-download" title="Lihat" onClick={() => viewDocument(doc.id)}>👁</button>
                      <button className="mp-doc-download" title="Unduh" onClick={() => downloadDocument(doc.id)}>⬇</button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>{/* end cards grid */}
        </div>{/* end content */}
      </div>{/* end right */}

      {/* ── Modals ── */}
      {activeModal === "group" && (
        <OrgModal profile={profile} onClose={closeModal} onSaved={handleSaved} />
      )}
      {activeModal === "pic" && (
        <PicModal profile={profile} onClose={closeModal} onSaved={handleSaved} />
      )}
      {activeModal === "bidang" && (
        <BidangModal profile={profile} onClose={closeModal} onSaved={handleSaved} />
      )}
      {activeModal === "docs" && (
        <DocsModal onClose={closeModal} onDocUploaded={fetchDocs} />
      )}
    </div>
  );
}
