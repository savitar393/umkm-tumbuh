import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { UserDetailData } from "../api";
import { getUserDetail, approveUser, rejectUser } from "../api";
import { STATUS_LABEL } from "../status";
import { viewDocument, downloadDocument } from "../../../shared/api/documents";
import type { DocumentItem, ChecklistItem } from "../../../shared/api/documents";
import AdminNavbar from "./AdminNavbar";
import "./admin.css";

const MITRA_CHECKLIST_LABELS = [
  "Informasi Organisasi lengkap dan jelas",
  "Identitas PIC valid dan dapat dihubungi",
  "Format NIB sesuai standar (13 digit)",
  "Format NPWP sesuai standar",
  "Dokumen Surat Komitmen terlampir dan sah",
  "Profil perusahaan relevan dengan tujuan program",
];

const UMKM_CHECKLIST_LABELS = [
  "Data usaha lengkap (nama, alamat, kategori)",
  "Identitas pemilik (NIK) valid",
  "Foto usaha terlampir",
  "NIB terlampir dan valid",
  "NPWP terlampir dan valid",
];

export default function RegistrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [checklistItems, setChecklistItems] = useState<boolean[]>([]);
  const [catatan, setCatatan] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchDetail = () => {
    if (!id) return;
    setLoading(true);
    setError("");

    getUserDetail(id)
      .then((res) => {
        setData(res.data);
        if (res.data.user.catatan_validasi) setCatatan(res.data.user.catatan_validasi);
        const cl = res.data.checklist as ChecklistItem[] | undefined;
        if (cl && cl.length > 0) {
          setChecklistItems(cl.map(c => c.uploaded));
        } else {
          setChecklistItems(
            new Array((res.data.user.role === "MITRA" ? MITRA_CHECKLIST_LABELS : UMKM_CHECKLIST_LABELS).length).fill(false)
          );
        }
      })
      .catch((err) => setError(err.message || "Gagal mengambil data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDetail(); }, [id]);

  function handleApprove() {
    if (!id) return;
    setError(""); setMessage("");
    setActionLoading(true);
    approveUser(id, catatan)
      .then((res) => { setMessage(res.message); fetchDetail(); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setActionLoading(false));
  }

  function handleReject() {
    if (!id) return;
    if (rejectReason.trim().length < 3) { setError("Alasan minimal 3 karakter."); return; }
    setError(""); setActionLoading(true);
    rejectUser(id, rejectReason.trim(), catatan)
      .then((res) => { setMessage(res.message); setShowRejectModal(false); fetchDetail(); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setActionLoading(false));
  }

  function getDocIcon(mimeType: string) {
    if (mimeType.startsWith("image/")) return "🖼";
    return "📄";
  }

  if (loading) {
    return (
      <div className="adm-page">
        <AdminNavbar active="registrations" />
        <div className="adm-body detail-body">
          <p style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Memuat detail...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="adm-page">
        <AdminNavbar active="registrations" />
        <div className="adm-body detail-body">
          <div className="adm-alert error">{error || "Data tidak ditemukan."}</div>
          <button className="breadcrumb-link" onClick={() => navigate(-1)}>← Kembali</button>
        </div>
      </div>
    );
  }

  const user = data.user;
  const profile = data.profile;
  const documents = (data.documents || []) as DocumentItem[];
  const checklist = (data.checklist || []) as ChecklistItem[];
  const statusColor = user.status === "APPROVED" ? "#10b981" : user.status === "REJECTED" ? "#ef4444" : "#4f72f5";
  const isPending = user.status === "PENDING";

  return (
    <div className="adm-page">
      <AdminNavbar active="registrations" />

      <div className="adm-body detail-body">
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate("/admin/registrations")}>
            ← Daftar Pendaftaran
          </button>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Detail Pendaftaran</span>
        </div>

        {message && <div className="adm-alert success">✓ {message}</div>}
        {error && <div className="adm-alert error">✕ {error}</div>}

        <div className="detail-main-card">
          <h1 className="detail-page-title">Detail <span className="accent">Pendaftaran</span></h1>
          <p className="detail-page-sub">Tinjau data pendaftaran dan tentukan apakah akun dapat diaktifkan.</p>

          <div className="info-bar">
            <div className="info-bar-cell">
              <span className="info-bar-label">NAMA ORGANISASI / ENTITAS</span>
              <span className="info-bar-value">{profile?.name ?? user.full_name}</span>
            </div>
            <div className="info-bar-cell">
              <span className="info-bar-label">ID PENDAFTARAN</span>
              <span className="info-bar-value">{user.id.slice(0, 13)}...</span>
            </div>
            <div className="info-bar-cell right">
              <span className="info-bar-label">STATUS PENGAJUAN</span>
              <span className="info-bar-status" style={{ color: statusColor }}>
                ● {STATUS_LABEL[user.status]}
              </span>
              <span className="info-bar-meta">
                Dikirim: {user.submitted_at
                  ? new Date(user.submitted_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                  : new Date(user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span className="info-bar-meta">Jenis: {user.role === "UMKM" ? "UMKM" : "Mitra"}</span>
            </div>
          </div>

          <div className="section-row">
            <div className="section-block">
              <div className="section-heading">
                <span className="section-icon">👤</span>
                <h2>Data Akun</h2>
              </div>
              <div className="field-grid">
                <div className="field-item">
                  <span className="field-label">Nama Lengkap</span>
                  <span className="field-val">{user.full_name}</span>
                </div>
                <div className="field-item">
                  <span className="field-label">Email</span>
                  <span className="field-val">{user.email}</span>
                </div>
                <div className="field-item">
                  <span className="field-label">Nomor Telepon</span>
                  <span className="field-val">{user.phone_number || "-"}</span>
                </div>
                <div className="field-item">
                  <span className="field-label">Tipe Akun</span>
                  <span className="field-val">{user.role}</span>
                </div>
                {user.nik && (
                  <div className="field-item">
                    <span className="field-label">NIK</span>
                    <span className="field-val">{user.nik}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="doc-block">
              <div className="section-heading">
                <span className="section-icon">📂</span>
                <h2>Dokumen Pendukung</h2>
              </div>
              {documents.length === 0 ? (
                <div style={{ padding: 16, color: "#9ca3af", fontSize: 13 }}>
                  Belum ada dokumen yang diunggah.
                </div>
              ) : (
                <div className="doc-list">
                  {documents.map((doc) => (
                    <div key={doc.id} className="doc-item">
                      <span className="doc-icon">{getDocIcon(doc.mime_type)}</span>
                      <span className="doc-name">{doc.file_name}</span>
                      <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>
                        {doc.document_type}
                      </span>
                      <div className="doc-actions">
                        <button className="doc-btn" title="Lihat" onClick={() => viewDocument(doc.id)}>👁</button>
                        <button className="doc-btn" title="Unduh" onClick={() => downloadDocument(doc.id)}>⬇</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="section-divider" />

          {profile && (
            <>
              <div className="section-block full">
                <div className="section-heading">
                  <span className="section-icon">{user.role === "UMKM" ? "🏪" : "🏢"}</span>
                  <h2>{user.role === "UMKM" ? "Data UMKM" : "Data Perusahaan"}</h2>
                </div>
                <div className="field-grid wide">
                  {user.role === "UMKM" ? (
                    <>
                      <div className="field-item"><span className="field-label">Nama Usaha</span><span className="field-val">{profile.name || "-"}</span></div>
                      <div className="field-item"><span className="field-label">Kategori</span><span className="field-val">{profile.category || "-"}</span></div>
                      <div className="field-item"><span className="field-label">Nama Pemilik</span><span className="field-val">{profile.person || user.full_name}</span></div>
                      <div className="field-item"><span className="field-label">Telepon</span><span className="field-val">{profile.phone_number || "-"}</span></div>
                      <div className="field-item full-width"><span className="field-label">Alamat</span><span className="field-val">{profile.address || "-"}</span></div>
                      <div className="field-item"><span className="field-label">Kota</span><span className="field-val">{profile.city || "-"}</span></div>
                      <div className="field-item"><span className="field-label">Provinsi</span><span className="field-val">{profile.province || "-"}</span></div>
                      <div className="field-item full-width"><span className="field-label">Deskripsi</span><span className="field-val">{profile.description || "-"}</span></div>
                    </>
                  ) : (
                    <>
                      <div className="field-item full-width"><span className="field-label">Nama Perusahaan / Organisasi</span><span className="field-val">{profile.name || "-"}</span></div>
                      <div className="field-item"><span className="field-label">Jenis Organisasi</span><span className="field-val">{profile.category || "-"}</span></div>
                      <div className="field-item"><span className="field-label">Kontak Person</span><span className="field-val">{profile.person || "-"}</span></div>
                      <div className="field-item"><span className="field-label">Telepon</span><span className="field-val">{profile.phone_number || "-"}</span></div>
                      <div className="field-item full-width"><span className="field-label">Alamat</span><span className="field-val">{profile.address || "-"}</span></div>
                      <div className="field-item"><span className="field-label">Kota</span><span className="field-val">{profile.city || "-"}</span></div>
                      <div className="field-item"><span className="field-label">Provinsi</span><span className="field-val">{profile.province || "-"}</span></div>
                      <div className="field-item full-width"><span className="field-label">Deskripsi</span><span className="field-val">{profile.description || "-"}</span></div>
                    </>
                  )}
                </div>
              </div>
              <div className="section-divider" />
            </>
          )}

          <div className="section-block full">
            <div className="section-heading">
              <span className="section-icon">🛡</span>
              <h2>Area Validasi</h2>
            </div>
            <div className="validasi-row">
              <div className="checklist-block">
                <p className="checklist-heading">CHECKLIST KELENGKAPAN</p>
                {(checklist.length > 0 ? checklist.map(c => c.label) : (user.role === "MITRA" ? MITRA_CHECKLIST_LABELS : UMKM_CHECKLIST_LABELS)).map((label, i) => (
                  <label key={i} className="check-item">
                    <input
                      type="checkbox"
                      checked={checklistItems[i] ?? false}
                      onChange={() => {
                        const next = [...checklistItems];
                        next[i] = !next[i];
                        setChecklistItems(next);
                      }}
                    />
                    <span>{label}</span>
                    {checklist[i]?.doc_id && (
                      <button type="button" className="doc-btn" title="Lihat" style={{ marginLeft: 8 }}
                        onClick={() => viewDocument(checklist[i].doc_id!)}>👁</button>
                    )}
                  </label>
                ))}
              </div>
              <div className="catatan-block">
                <p className="checklist-heading">CATATAN VALIDASI</p>
                <textarea className="catatan-textarea" placeholder="Tambahkan catatan untuk pengguna..." value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={8} disabled={!isPending} />
              </div>
            </div>
          </div>

          {isPending && (
            <div className="detail-action-bar">
              <button className="btn-tolak" onClick={() => setShowRejectModal(true)} disabled={actionLoading}>✕ Tolak Pengajuan</button>
              <button className="btn-setujui" onClick={handleApprove} disabled={actionLoading}>✓ Setujui & Aktifkan Akun</button>
            </div>
          )}

          {user.rejection_reason && user.status === "REJECTED" && (
            <div style={{ padding: "16px 0", color: "#ef4444", fontSize: 13 }}>
              <strong>Alasan penolakan:</strong> {user.rejection_reason}
            </div>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Alasan Penolakan</h2>
            <p className="modal-desc">Berikan alasan yang jelas agar pendaftar dapat memperbaiki datanya.</p>
            <textarea className="modal-textarea" placeholder="Tuliskan alasan penolakan..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} />
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => { setShowRejectModal(false); setRejectReason(""); setError(""); }}>Batal</button>
              <button className="modal-btn reject" onClick={handleReject} disabled={actionLoading}>{actionLoading ? "Memproses..." : "Tolak Pendaftaran"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
