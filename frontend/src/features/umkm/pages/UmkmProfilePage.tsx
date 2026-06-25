import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getProfile } from "../api";
import type { UmkmProfile } from "../api";
import { getMyDocuments, viewDocument, downloadDocument } from "../../../shared/api/documents";
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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function UmkmProfilePage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [profile, setProfile] = useState<UmkmProfile | null>(null);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [docError, setDocError] = useState("");

  useEffect(() => {
    getProfile()
      .then((res) => setProfile(res.profile))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
    getMyDocuments()
      .then(res => setDocs(res.documents || []))
      .catch(() => {});
  }, []);

  function getDocByType(type: string) {
    return docs.find(d => d.document_type === type);
  }

  const CREDENTIAL_DOCS = [
    { type: "NIB", label: "Nomor Induk Berusaha (NIB)", icon: "📄" },
    { type: "NPWP", label: "NPWP Usaha", icon: "📋" },
    { type: "SIUP", label: "SIUP / Izin Usaha", icon: "🏢" },
    { type: "SERTIFIKASI_HALAL", label: "Sertifikasi Halal", icon: "🛡" },
  ];

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    navigate("/login");
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

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
          <button className="up-nav-item">
            <span className="up-nav-icon">📚</span>
            Pelatihan Saya
          </button>
          <button className="up-nav-item active">
            <span className="up-nav-icon">🏢</span>
            Kelola Informasi
          </button>
          <button className="up-nav-item">
            <span className="up-nav-icon">📊</span>
            Dashboard
          </button>
          <button className="up-nav-item">
            <span className="up-nav-icon">🤝</span>
            Pengajuan Kemitraan
          </button>
          <button className="up-nav-item">
            <span className="up-nav-icon">⚙️</span>
            Pengaturan
          </button>
        </nav>
        <div style={{ padding: "0 12px 20px" }}>
          <button className="up-nav-logout" onClick={logout}>
            <span>🚪</span> Keluar
          </button>
        </div>
      </aside>

      {/* ── RIGHT AREA ──────────────────────────────────────── */}
      <div className="up-right">
        {/* Header */}
        <header className="up-header">
          <span className="up-header-title">Informasi Bisnis</span>
          <div className="up-header-right">
            <button className="up-header-bell" type="button">🔔</button>
            <div className="up-header-user">
              <div className="up-header-user-info">
                <span className="up-header-user-name">{user?.full_name || "UMKM"}</span>
                <span className="up-header-user-role">Pemilik UMKM</span>
              </div>
              <div className="up-header-avatar">{initials}</div>
            </div>
          </div>
        </header>

        {/* View content */}
        <div className="up-view-content">

          {docError && (
            <div style={{ padding: "10px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#991b1b" }}>
              ⚠️ {docError}
            </div>
          )}

          {/* Top: badges + name + actions */}
          <div className="up-view-top">
            <div className="up-view-top-left">
              <div className="up-badges">
                <span className="up-badge biz">🏪 PROFIL BISNIS</span>
                <span className="up-badge verified">✓ VERIFIED</span>
              </div>
              <h1 className="up-biz-name">{profile?.name || user?.full_name || "Nama Usaha"}</h1>
              <p className="up-biz-desc">
                {profile?.description || "Belum ada deskripsi usaha. Klik Edit Profil untuk melengkapi informasi."}
              </p>
            </div>
            <div className="up-view-actions">
              <Link to="/umkm/profile/view" className="up-btn-publik">
                👁 Lihat Profil Publik
              </Link>
              <Link to="/umkm/profile" className="up-btn-edit-profil">
                ✏️ Edit Profil
              </Link>
            </div>
          </div>

          {/* 2-col: Informasi Dasar + Status Kredibilitas */}
          <div className="up-info-row">
            {/* Informasi Dasar */}
            <div className="up-card">
              <div className="up-card-heading">
                <div className="up-card-icon-circle">ℹ️</div>
                <span className="up-card-title">Informasi Dasar</span>
              </div>
              <div className="up-field-grid">
                <div className="up-field">
                  <span className="up-field-label">NAMA USAHA</span>
                  <span className="up-field-value">{profile?.name || "—"}</span>
                </div>
                <div className="up-field">
                  <span className="up-field-label">KATEGORI</span>
                  {profile?.category
                    ? <span className="up-cat-tag">{profile.category}</span>
                    : <span className="up-field-value">—</span>
                  }
                </div>
                <div className="up-field">
                  <span className="up-field-label">NAMA PEMILIK</span>
                  <span className="up-field-value">{profile?.person || "—"}</span>
                </div>
                <div className="up-field">
                  <span className="up-field-label">TAHUN BERDIRI</span>
                  <span className="up-field-value">—</span>
                </div>
                <div className="up-field">
                  <span className="up-field-label">RATA-RATA OMZET (BULAN)</span>
                  <span className="up-field-value">
                    {profile?.omzet ? `Rp ${profile.omzet.toLocaleString("id-ID")}` : "—"}
                  </span>
                </div>
                <div className="up-field full">
                  <span className="up-field-label">DESKRIPSI USAHA</span>
                  <span className="up-field-value light">{profile?.description || "—"}</span>
                </div>
              </div>
            </div>

            {/* Status Kredibilitas */}
            <div className="up-status-card">
              <div>
                <div className="up-trust-meta">
                  <span className="up-trust-icon">⭐</span>
                  <span className="up-trust-label">STATUS KEPERCAYAAN</span>
                </div>
                <div className="up-trust-title">Status Kredibilitas</div>
                <p className="up-trust-desc">
                  Dokumen & legalitas usaha Anda untuk meningkatkan kepercayaan mitra.
                </p>
              </div>
              <div className="up-cred-list">
                {CREDENTIAL_DOCS.map(({ type, label, icon }) => {
                  const doc = getDocByType(type);
                  return (
                    <div key={type} className="up-cred-item">
                      <div className="up-cred-icon">{icon}</div>
                      <span className="up-cred-name">{label}</span>
                      {doc ? (
                        <span className={`up-cred-badge ${doc.status.toLowerCase()}`}>
                          {doc.status}
                        </span>
                      ) : (
                        <span className="up-cred-badge pending">BELUM UPLOAD</span>
                      )}
                      {doc && (
                        <div className="up-cred-actions" style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                          <button
                            type="button"
                            className="up-doc-action upload"
                            style={{ fontSize: 10, padding: "2px 8px" }}
                            onClick={async () => {
                              setDocError("");
                              try { await viewDocument(doc.id); }
                              catch (e) { setDocError(e instanceof Error ? e.message : "Gagal membuka dokumen"); }
                            }}
                          >
                            Lihat
                          </button>
                          <button
                            type="button"
                            className="up-doc-action change"
                            style={{ fontSize: 10, padding: "2px 8px" }}
                            onClick={async () => {
                              setDocError("");
                              try { await downloadDocument(doc.id, doc.file_name); }
                              catch (e) { setDocError(e instanceof Error ? e.message : "Gagal mengunduh dokumen"); }
                            }}
                          >
                            Unduh
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Kontak & Lokasi */}
          <div className="up-card">
            <div className="up-card-heading">
              <div className="up-card-icon-circle">📍</div>
              <span className="up-card-title">Kontak & Lokasi</span>
            </div>
            <div className="up-lokasi-grid">
              <div className="up-contact-list">
                <div className="up-contact-item">
                  <div className="up-contact-icon">📱</div>
                  {profile?.phone_number ? (
                    <a href={`tel:${profile.phone_number}`} className="up-contact-text" style={{ textDecoration: 'none' }}>
                      {profile.phone_number}
                    </a>
                  ) : (
                    <span className="up-contact-text">—</span>
                  )}
                </div>
                <div className="up-contact-item">
                  <div className="up-contact-icon">✉️</div>
                  {user?.email ? (
                    <a href={`mailto:${user.email}`} className="up-contact-text" style={{ textDecoration: 'none' }}>
                      {user.email}
                    </a>
                  ) : (
                    <span className="up-contact-text">—</span>
                  )}
                </div>
                <div className="up-contact-item">
                  <div className="up-contact-icon">🌐</div>
                  <span className="up-contact-text">—</span>
                </div>
                <div className="up-contact-social">
                  <button type="button" className="up-contact-social-btn">📘</button>
                  <button type="button" className="up-contact-social-btn">📸</button>
                  <button type="button" className="up-contact-social-btn">🐦</button>
                </div>
              </div>
              <div className="up-location-detail">
                <div className="up-location-meta">
                  <div className="up-field">
                    <span className="up-field-label">KOTA</span>
                    <span className="up-field-value">{profile?.city || "—"}</span>
                  </div>
                  <div className="up-field">
                    <span className="up-field-label">PROVINSI</span>
                    <span className="up-field-value">{profile?.province || "—"}</span>
                  </div>
                </div>
                <div className="up-field">
                  <span className="up-field-label">ALAMAT</span>
                  <span className="up-field-value light">{profile?.address || "—"}</span>
                </div>
                <div className="up-map-placeholder">🗺️</div>
              </div>
            </div>
          </div>

          {/* Visual & Galeri */}
          <div className="up-card">
            <div className="up-card-heading">
              <div className="up-card-icon-circle">🖼️</div>
              <span className="up-card-title">Visual & Galeri</span>
            </div>
            <div className="up-galeri-layout">
              <div className="up-logo-box">
                <div className="up-logo-img">
                  <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                </div>
                <button type="button" className="up-logo-change">Ganti Logo</button>
              </div>
              <div className="up-galeri-col">
                <span className="up-galeri-label">FOTO USAHA</span>
                <div className="up-photos-row">
                  <div className="up-photo-thumb">
                    <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80" alt="Galeri 1" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  </div>
                  <div className="up-photo-thumb">
                    <img src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80" alt="Galeri 2" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  </div>
                  <button type="button" className="up-add-photo">
                    <span style={{ fontSize: 18 }}>+</span>
                    Tambah
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Produk */}
          <div className="up-card">
            <div className="up-card-heading">
              <div className="up-card-icon-circle">🛍️</div>
              <span className="up-card-title">Produk</span>
            </div>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
              Kelola produk atau layanan yang Anda tawarkan kepada mitra.
            </p>
            <button 
              type="button" 
              className="up-kelola-btn"
              onClick={() => navigate("/umkm/products")}
            >
              🛍️ Kelola Produk
            </button>
          </div>

          {/* Footer */}
          {profile && (
            <p className="up-view-footer">
              Terakhir diperbarui: {fmtDate(profile.updated_at)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
