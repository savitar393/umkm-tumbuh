import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  // Mail,
  // Phone,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import {
  approveUser,
  getUserDetail,
  rejectUser,
  type MessageResponse,
  type UserDetailResponse,
} from "../api";
import AdminLayout from "../components/AdminLayout";
import { getAccessToken } from "../../../shared/auth/currentUser";
import "./admin.css";


function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function labelize(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusConfig(status?: string) {
  const normalized = String(status ?? "").toUpperCase();

  if (["PENDING", "MENUNGGU"].includes(normalized)) {
    return {
      label: "Menunggu Review",
      tone: "warning",
      icon: AlertTriangle,
      description:
        "Pendaftaran masih menunggu pemeriksaan admin sebelum akun dapat diaktifkan.",
    };
  }

  if (["APPROVED", "DISETUJUI", "AKTIF"].includes(normalized)) {
    return {
      label: "Disetujui",
      tone: "success",
      icon: CheckCircle2,
      description: "Pendaftaran sudah disetujui dan akun dapat digunakan.",
    };
  }

  if (["REJECTED", "DITOLAK"].includes(normalized)) {
    return {
      label: "Ditolak",
      tone: "danger",
      icon: XCircle,
      description: "Pendaftaran ditolak. Pengguna perlu memperbaiki data atau dokumen.",
    };
  }

  return {
    label: status || "Tidak diketahui",
    tone: "neutral",
    icon: ShieldCheck,
    description: "Status pendaftaran belum dikenali sistem.",
  };
}

function getReadableRole(role?: string) {
  if (role === "MITRA") return "Mitra";
  if (role === "UMKM") return "UMKM";
  return role || "—";
}

function getDocumentID(doc: any) {
  return doc.id ?? doc.dokumen_id ?? doc.document_id ?? "";
}

export default function AdminRegistrationDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<UserDetailResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [catatanValidasi, setCatatanValidasi] = useState("");
  const [alasanTolak, setAlasanTolak] = useState("");

  function reload() {
    if (!userId) return;

    setLoading(true);
    setError("");

    getUserDetail(userId)
      .then((res) => {
        if (res.status === "success" && res.data) {
          setData(res.data);
        } else {
          setError("Data pendaftaran tidak ditemukan.");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal mengambil data pendaftaran.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function openApproveModal() {
    setError("");
    setSuccess("");
    setCatatanValidasi(user?.catatan_validasi || "");
    setShowApproveModal(true);
  }

  function openRejectModal() {
    setError("");
    setSuccess("");
    setAlasanTolak("");
    setCatatanValidasi(user?.catatan_validasi || "");
    setShowRejectModal(true);
  }

  function closeApproveModal() {
    if (actionLoading) return;

    setShowApproveModal(false);
    setCatatanValidasi("");
  }

  function closeRejectModal() {
    if (actionLoading) return;

    setShowRejectModal(false);
    setAlasanTolak("");
    setCatatanValidasi("");
  }

  async function handleApprove() {
    if (!userId) return;

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const res: MessageResponse = await approveUser(userId, catatanValidasi);
      setSuccess(res.message || "Pendaftaran berhasil disetujui.");
      setShowApproveModal(false);
      setCatatanValidasi("");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyetujui pendaftaran.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!userId) return;

    if (alasanTolak.trim().length < 3) {
      setError("Alasan penolakan minimal 3 karakter.");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const res: MessageResponse = await rejectUser(
        userId,
        alasanTolak.trim(),
        catatanValidasi
      );
      setSuccess(res.message || "Pendaftaran berhasil ditolak.");
      setShowRejectModal(false);
      setAlasanTolak("");
      setCatatanValidasi("");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menolak pendaftaran.");
    } finally {
      setActionLoading(false);
    }
  }

  async function openDocument(doc: any) {
    const documentID = getDocumentID(doc);

    if (!documentID) {
      setError("ID dokumen tidak ditemukan.");
      return;
    }

    const token = getAccessToken();

    if (!token) {
      setError("Sesi admin tidak valid. Silakan login ulang.");
      return;
    }

    try {
      setError("");

      const response = await fetch(`/api/v1/documents/${documentID}/url`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Gagal membuka dokumen.");
      }

      const url = data?.data?.url;

      if (!url) {
        throw new Error("URL dokumen tidak tersedia.");
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuka dokumen.");
    }
  }

  async function downloadDocument(doc: any) {
    const documentID = getDocumentID(doc);

    if (!documentID) {
      setError("ID dokumen tidak ditemukan.");
      return;
    }

    const token = getAccessToken();

    if (!token) {
      setError("Sesi admin tidak valid. Silakan login ulang.");
      return;
    }

    try {
      setError("");

      const response = await fetch(`/api/v1/documents/${documentID}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Gagal mengunduh dokumen.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const fileName =
        doc.original_filename ??
        doc.nama_dokumen ??
        doc.file_name ??
        doc.name ??
        `${documentID}.bin`;

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunduh dokumen.");
    }
  }

  const user = data?.user;
  const statusConfig = getStatusConfig(user?.status);
  const StatusIcon = statusConfig.icon;

  const isPending = useMemo(() => {
    const status = String(user?.status ?? "").toUpperCase();
    return ["PENDING", "MENUNGGU"].includes(status);
  }, [user?.status]);

  const profileEntries = data?.profile && typeof data.profile === "object"
    ? Object.entries(data.profile).filter(([_, value]) => value !== null && value !== undefined && value !== "")
    : [];

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-reg-detail">
          <div className="admin-reg-loading">Memuat detail pendaftaran...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !data) {
    return (
      <AdminLayout>
        <div className="admin-reg-detail">
          <button className="admin-back-link" onClick={() => navigate("/admin/registrations")}>
            <ArrowLeft size={16} />
            Kembali
          </button>
          <div className="admin-reg-alert admin-reg-alert--danger">{error}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-reg-detail">
        <button className="admin-back-link" onClick={() => navigate("/admin/registrations")}>
          <ArrowLeft size={16} />
          Kembali ke Daftar Pengajuan
        </button>

        <section className="admin-reg-hero">
          <div>
            <p className="admin-reg-kicker">Detail Pendaftaran</p>
            <h1>
              Detail <span>Pendaftaran</span>
            </h1>
            <p>
              Tinjau data pendaftaran, profil, dokumen pendukung, dan tentukan apakah akun
              dapat diaktifkan.
            </p>
          </div>

          <div className={`admin-reg-status-card admin-reg-status-card--${statusConfig.tone}`}>
            <div className="admin-reg-status-icon">
              <StatusIcon size={24} />
            </div>
            <div>
              <small>Status Pendaftaran</small>
              <strong>{statusConfig.label}</strong>
              <p>{statusConfig.description}</p>
            </div>
          </div>
        </section>

        {success ? <div className="admin-reg-alert admin-reg-alert--success">{success}</div> : null}
        {error ? <div className="admin-reg-alert admin-reg-alert--danger">{error}</div> : null}

        <div className="admin-reg-layout">
          <main className="admin-reg-main">
            <section className="admin-reg-section">
              <div className="admin-reg-section-title">
                <User size={20} />
                <h2>Data Akun</h2>
              </div>

              <div className="admin-reg-field-grid">
                <div className="admin-reg-field">
                  <span>Nama PIC</span>
                  <strong>{user?.full_name || "—"}</strong>
                </div>
                <div className="admin-reg-field">
                  <span>Email</span>
                  <strong>{user?.email || "—"}</strong>
                </div>
                <div className="admin-reg-field">
                  <span>WhatsApp</span>
                  <strong>{user?.phone_number || "—"}</strong>
                </div>
                <div className="admin-reg-field">
                  <span>Tipe Akun Pengajuan</span>
                  <strong>{getReadableRole(user?.role)}</strong>
                </div>
                <div className="admin-reg-field">
                  <span>NIK</span>
                  <strong>{user?.nik || "—"}</strong>
                </div>
                <div className="admin-reg-field">
                  <span>Tanggal Daftar</span>
                  <strong>{formatDate(user?.created_at)}</strong>
                </div>
                <div className="admin-reg-field">
                  <span>Tanggal Submit</span>
                  <strong>{formatDate(user?.submitted_at)}</strong>
                </div>
                <div className="admin-reg-field">
                  <span>Tanggal Review</span>
                  <strong>{formatDate(user?.reviewed_at)}</strong>
                </div>
              </div>
            </section>

            <section className="admin-reg-section">
              <div className="admin-reg-section-title">
                <Building2 size={20} />
                <h2>Data Peran ({getReadableRole(user?.role)})</h2>
              </div>

              {profileEntries.length > 0 ? (
                <div className="admin-reg-field-grid">
                  {profileEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className={
                        String(value).length > 80
                          ? "admin-reg-field admin-reg-field--wide"
                          : "admin-reg-field"
                      }
                    >
                      <span>{labelize(key)}</span>
                      <strong>{String(value)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-reg-empty">Belum ada data profil yang tersimpan.</div>
              )}
            </section>

            <section className="admin-reg-section">
              <div className="admin-reg-section-title">
                <ShieldCheck size={20} />
                <h2>Area Validasi</h2>
              </div>

              <div className="admin-reg-validation-grid">
                <div>
                  <h3>Checklist Kelengkapan</h3>
                  {data?.checklist && data.checklist.length > 0 ? (
                    <div className="admin-reg-checklist">
                      {data.checklist.map((item, index) => (
                        <div key={`${item.label}-${index}`} className="admin-reg-check-item">
                          {item.uploaded ? (
                            <CheckCircle2 size={18} className="admin-reg-check-ok" />
                          ) : (
                            <XCircle size={18} className="admin-reg-check-missing" />
                          )}
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-reg-checklist">
                      <div className="admin-reg-check-item">
                        <AlertTriangle size={18} className="admin-reg-check-missing" />
                        <span>Checklist belum tersedia dari backend.</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3>Catatan Validasi</h3>
                  <textarea
                    className="admin-reg-note"
                    value={catatanValidasi}
                    onChange={(e) => setCatatanValidasi(e.target.value)}
                    placeholder="Tambahkan catatan untuk pengguna jika ada kekurangan data, dokumen, atau alasan keputusan validasi..."
                  />
                </div>
              </div>
            </section>
          </main>

          <aside className="admin-reg-side">
            <section className="admin-reg-section admin-reg-doc-section">
              <div className="admin-reg-section-title">
                <FileText size={20} />
                <h2>Dokumen Pendukung</h2>
              </div>

              {data?.documents && data.documents.length > 0 ? (
                <div className="admin-reg-doc-list">
                  {data.documents.map((doc: any, index: number) => {
                    const docName =
                      doc.original_filename ??
                      doc.nama_dokumen ??
                      doc.file_name ??
                      doc.name ??
                      `Dokumen ${index + 1}`;

                    return (
                      <div key={doc.id ?? doc.dokumen_id ?? docName} className="admin-reg-doc-card">
                        <div className="admin-reg-doc-icon">
                          <FileText size={18} />
                        </div>
                        <div>
                          <strong>{docName}</strong>
                          <span>{doc.status ?? doc.type ?? "Dokumen"}</span>
                        </div>
                        <div className="admin-reg-doc-actions">
                          <button
                            type="button"
                            className="admin-reg-doc-action-btn"
                            onClick={() => openDocument(doc)}
                            title="Lihat dokumen"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="admin-reg-doc-action-btn"
                            onClick={() => downloadDocument(doc)}
                            title="Unduh dokumen"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="admin-reg-empty">Belum ada dokumen pendukung.</div>
              )}
            </section>

            <section className="admin-reg-section admin-reg-summary">
              <h2>Ringkasan Review</h2>
              <div>
                <span>Pendaftar</span>
                <strong>{user?.full_name || "—"}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{user?.email || "—"}</strong>
              </div>
              <div>
                <span>Role</span>
                <strong>{getReadableRole(user?.role)}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{statusConfig.label}</strong>
              </div>

              {user?.rejection_reason ? (
                <div className="admin-reg-rejection">
                  <span>Alasan Penolakan</span>
                  <strong>{user.rejection_reason}</strong>
                </div>
              ) : null}
            </section>
          </aside>
        </div>

        <div className="admin-reg-actionbar">
          <button className="admin-reg-btn admin-reg-btn--secondary" onClick={() => navigate("/admin/registrations")}>
            Batal
          </button>

          {isPending ? (
            <>
              <button
                className="admin-reg-btn admin-reg-btn--danger"
                onClick={openRejectModal}
                disabled={actionLoading}
              >
                Tolak Pendaftaran
              </button>
              <button
                className="admin-reg-btn admin-reg-btn--success"
                onClick={openApproveModal}
                disabled={actionLoading}
              >
                Setujui & Aktifkan Akun
              </button>
            </>
          ) : (
            <button className="admin-reg-btn admin-reg-btn--primary" onClick={() => navigate("/admin/registrations")}>
              Kembali ke Daftar
            </button>
          )}
        </div>
      </div>

      {showApproveModal ? (
        <div className="modal-overlay" onClick={closeApproveModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Setujui Pendaftaran</h3>
            <p>
              Setujui akun <strong>{user?.full_name}</strong> ({user?.email})?
            </p>
            <label>
              Catatan Validasi (opsional)
              <textarea
                className="textarea-input"
                value={catatanValidasi}
                onChange={(e) => setCatatanValidasi(e.target.value)}
                placeholder="Tambahkan catatan..."
                rows={3}
              />
            </label>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={closeApproveModal} disabled={actionLoading}>
                Batal
              </button>
              <button className="btn btn-approve" onClick={handleApprove} disabled={actionLoading}>
                {actionLoading ? "Memproses..." : "Setujui"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showRejectModal ? (
        <div className="modal-overlay" onClick={closeRejectModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Tolak Pendaftaran</h3>
            <p>
              Tolak akun <strong>{user?.full_name}</strong> ({user?.email})?
            </p>
            <label>
              Alasan Penolakan <span className="required">*</span>
              <textarea
                className="textarea-input"
                value={alasanTolak}
                onChange={(e) => setAlasanTolak(e.target.value)}
                placeholder="Minimal 3 karakter..."
                rows={3}
                required
              />
            </label>
            <label>
              Catatan Validasi (opsional)
              <textarea
                className="textarea-input"
                value={catatanValidasi}
                onChange={(e) => setCatatanValidasi(e.target.value)}
                placeholder="Tambahkan catatan..."
                rows={2}
              />
            </label>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={closeRejectModal} disabled={actionLoading}>
                Batal
              </button>
              <button
                className="btn btn-reject"
                onClick={handleReject}
                disabled={actionLoading || alasanTolak.trim().length < 3}
              >
                {actionLoading ? "Memproses..." : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
