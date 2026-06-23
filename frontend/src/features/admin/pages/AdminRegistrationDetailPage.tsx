import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getUserDetail, approveUser, rejectUser, deactivateUser, type UserDetailResponse, type MessageResponse } from "../api";
import AdminLayout from "../components/AdminLayout";
import "./admin.css";

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
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [catatanValidasi, setCatatanValidasi] = useState("");
  const [alasanTolak, setAlasanTolak] = useState("");
  const [deactivateReasonType, setDeactivateReasonType] = useState("");
  const [deactivateCustomReason, setDeactivateCustomReason] = useState("");

  useEffect(() => {
    if (!userId) return;

    let ignore = false;
    setLoading(true);
    setError("");

    getUserDetail(userId)
      .then((res) => {
        if (!ignore && res.status === "success" && res.data) {
          setData(res.data);
        } else if (!ignore) {
          setError("Data tidak ditemukan.");
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Gagal mengambil data");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [userId]);

  async function handleApprove() {
    if (!userId) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res: MessageResponse = await approveUser(userId, catatanValidasi);
      setSuccess(res.message || "Akun berhasil disetujui.");
      setShowApproveModal(false);
      const updated = await getUserDetail(userId);
      if (updated.status === "success" && updated.data) setData(updated.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyetujui");
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
      const res: MessageResponse = await rejectUser(userId, alasanTolak.trim(), catatanValidasi);
      setSuccess(res.message || "Akun berhasil ditolak.");
      setShowRejectModal(false);
      const updated = await getUserDetail(userId);
      if (updated.status === "success" && updated.data) setData(updated.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menolak");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeactivate() {
    if (!userId) return;
    const reason = deactivateReasonType === "others" ? deactivateCustomReason.trim() : deactivateReasonType;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res: MessageResponse = await deactivateUser(userId, reason || undefined);
      setSuccess(res.message || "Akun berhasil dinonaktifkan.");
      setShowDeactivateDialog(false);
      const updated = await getUserDetail(userId);
      if (updated.status === "success" && updated.data) setData(updated.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menonaktifkan");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="detail-page">
          <p className="tab-loading">Memuat data...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error && !data) {
    return (
      <AdminLayout>
        <div className="detail-page">
          <p className="error-message">{error}</p>
          <button className="btn btn-outline" onClick={() => navigate("/admin/registrations")}>
            Kembali
          </button>
        </div>
      </AdminLayout>
    );
  }

  const user = data?.user;

  return (
    <AdminLayout>
      <div className="detail-page">
        {/* Header */}
        <div className="detail-header">
          <button className="btn btn-ghost" onClick={() => navigate("/admin/registrations")}>
            <ArrowLeft size={18} />
            <span>Kembali</span>
          </button>
          <h2>Detail Pendaftaran</h2>
        </div>

        {success && <p className="success-message">{success}</p>}
        {error && <p className="error-message">{error}</p>}

        {/* Data Akun */}
        <section className="detail-section">
          <h3>Data Akun</h3>
          <div className="detail-grid">
            <div className="detail-field">
              <span className="detail-label">Nama Lengkap</span>
              <span className="detail-value">{user?.full_name}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Email</span>
              <span className="detail-value">{user?.email}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">No. HP</span>
              <span className="detail-value">{user?.phone_number ?? "—"}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">NIK</span>
              <span className="detail-value">{user?.nik ?? "—"}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Role</span>
              <span className="detail-value">
                <span className={`role-badge role-badge--${user?.role?.toLowerCase() ?? ""}`}>
                  {user?.role}
                </span>
              </span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Status</span>
              <span className="detail-value">
                <span className={`status-badge status-badge--${user?.status?.toLowerCase() ?? ""}`}>
                  {user?.status}
                </span>
              </span>
            </div>
            {(user?.status === "DITOLAK" || user?.status === "REJECTED") && user?.rejection_reason && (
              <div className="detail-field detail-field--full">
                <span className="detail-label">Alasan Penolakan</span>
                <span className="detail-value detail-value--error">{user.rejection_reason}</span>
              </div>
            )}
            {user?.catatan_validasi && (
              <div className="detail-field detail-field--full">
                <span className="detail-label">Catatan Validasi</span>
                <span className="detail-value">{user.catatan_validasi}</span>
              </div>
            )}
            <div className="detail-field">
              <span className="detail-label">Tanggal Daftar</span>
              <span className="detail-value">
                {user?.created_at ? new Date(user.created_at).toLocaleString("id-ID") : "—"}
              </span>
            </div>
            {user?.submitted_at && (
              <div className="detail-field">
                <span className="detail-label">Tanggal Submit</span>
                <span className="detail-value">
                  {new Date(user.submitted_at).toLocaleString("id-ID")}
                </span>
              </div>
            )}
            {user?.reviewed_at && (
              <div className="detail-field">
                <span className="detail-label">Tanggal Review</span>
                <span className="detail-value">
                  {new Date(user.reviewed_at).toLocaleString("id-ID")}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Profil UMKM / Mitra */}
        <section className="detail-section">
          <h3>Profil {user?.role === "MITRA" ? "Mitra" : "UMKM"}</h3>
          {data?.profile && typeof data.profile === "object" ? (
            <div className="detail-grid">
              {Object.entries(data.profile).map(([key, val]) => (
                <div key={key} className="detail-field">
                  <span className="detail-label">{key.replace(/_/g, " ")}</span>
                  <span className="detail-value">
                    {val === null || val === undefined ? "—" : String(val)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="detail-empty">Tidak ada data profil.</p>
          )}
        </section>

        {/* Dokumen */}
        <section className="detail-section">
          <h3>Dokumen</h3>
          {data?.documents && Array.isArray(data.documents) && data.documents.length > 0 ? (
            <div className="table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Nama Dokumen</th>
                    <th>Status</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {data.documents.map((doc: any, idx: number) => (
                    <tr key={doc.id ?? idx}>
                      <td>{doc.nama_dokumen ?? doc.file_name ?? doc.name ?? `Dokumen ${idx + 1}`}</td>
                      <td>
                        <span className={`status-badge status-badge--${doc.status?.toLowerCase() ?? "pending"}`}>
                          {doc.status ?? "—"}
                        </span>
                      </td>
                      <td>
                        {doc.url || doc.file_url || doc.path ? (
                          <a href={doc.url ?? doc.file_url ?? doc.path} target="_blank" rel="noreferrer">
                            Lihat
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="detail-empty">Belum ada dokumen.</p>
          )}
        </section>

        {/* Checklist */}
        <section className="detail-section">
          <h3>Checklist Dokumen</h3>
          {data?.checklist && Array.isArray(data.checklist) && data.checklist.length > 0 ? (
            <div className="checklist">
              {data.checklist.map((item: any, idx: number) => (
                <div key={idx} className="checklist-item">
                  <span className={`checklist-status ${item.uploaded ? "checklist-ok" : "checklist-missing"}`}>
                    {item.uploaded ? "✓" : "✗"}
                  </span>
                  <span>{item.label ?? item.nama ?? `Item ${idx + 1}`}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="detail-empty">Belum ada checklist.</p>
          )}
        </section>

        {/* Action Buttons */}
        <section className="detail-section detail-actions">
          {(user?.status === "PENDING" || user?.status === "MENUNGGU") && (
            <div className="detail-actions-row">
              <button
                className="btn btn-approve"
                onClick={() => setShowApproveModal(true)}
                disabled={actionLoading}
              >
                Setujui
              </button>
              <button
                className="btn btn-reject"
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
              >
                Tolak
              </button>
            </div>
          )}
          {(user?.status === "APPROVED" || user?.status === "DISETUJUI" || user?.status === "AKTIF") && user?.is_active && (
            <div className="detail-actions-row">
              <button
                className="btn btn-deactivate"
                onClick={() => setShowDeactivateDialog(true)}
                disabled={actionLoading}
              >
                Nonaktifkan Akun
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ─── Approve Modal ─────────────────────────────────────────────── */}
      {showApproveModal && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
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
              <button className="btn btn-outline" onClick={() => setShowApproveModal(false)}>
                Batal
              </button>
              <button className="btn btn-approve" onClick={handleApprove} disabled={actionLoading}>
                {actionLoading ? "Memproses..." : "Setujui"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Reject Modal ──────────────────────────────────────────────── */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
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
              <button className="btn btn-outline" onClick={() => setShowRejectModal(false)}>
                Batal
              </button>
              <button className="btn btn-reject" onClick={handleReject} disabled={actionLoading}>
                {actionLoading ? "Memproses..." : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Deactivate Confirmation Dialog ────────────────────────────── */}
      {showDeactivateDialog && (
        <div className="modal-overlay" onClick={() => setShowDeactivateDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Nonaktifkan Akun</h3>
            <p>
              Apakah Anda yakin ingin menonaktifkan akun{" "}
              <strong>{user?.full_name}</strong> ({user?.email})?
            </p>
            <p style={{ fontSize: 13, color: "#ef4444" }}>
              Pengguna tidak akan bisa login sampai akun diaktifkan kembali.
            </p>

            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 4 }}>
              Alasan Nonaktif
            </label>
            <div className="radio-group">
              <label className="radio-item">
                <input
                  type="radio"
                  name="deactivateReason"
                  value="3_bulan_tidak_aktif"
                  checked={deactivateReasonType === "3_bulan_tidak_aktif"}
                  onChange={(e) => setDeactivateReasonType(e.target.value)}
                />
                <span>Akun tidak aktif selama 3 bulan</span>
              </label>
              <label className="radio-item">
                <input
                  type="radio"
                  name="deactivateReason"
                  value="others"
                  checked={deactivateReasonType === "others"}
                  onChange={(e) => setDeactivateReasonType(e.target.value)}
                />
                <span>Lainnya</span>
              </label>
            </div>

            {deactivateReasonType === "others" && (
              <label>
                <span className="required">*</span> Uraikan alasan
                <textarea
                  className="textarea-input"
                  value={deactivateCustomReason}
                  onChange={(e) => setDeactivateCustomReason(e.target.value)}
                  placeholder="Misalnya: melanggar ketentuan platform..."
                  rows={3}
                />
              </label>
            )}

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowDeactivateDialog(false)}>
                Batal
              </button>
              <button className="btn btn-deactivate" onClick={handleDeactivate} disabled={actionLoading}>
                {actionLoading ? "Memproses..." : "Ya, Nonaktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
