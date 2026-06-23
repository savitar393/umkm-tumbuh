import { useCallback, useEffect, useState } from "react";
import { Search, RefreshCw, Users, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  listUsers,
  approveUser,
  rejectUser,
  deactivateUser,
  getStats,
  type StatsData,
  type UserListItem,
  type MessageResponse,
} from "../api";
import AdminLayout from "../components/AdminLayout";
import "./admin.css";

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
type FilterRole = "ALL" | "UMKM" | "MITRA";

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [roleFilter, setRoleFilter] = useState<FilterRole>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const [actionLoadingID, setActionLoadingID] = useState("");

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [catatanValidasi, setCatatanValidasi] = useState("");
  const [alasanTolak, setAlasanTolak] = useState("");

  const [deactivateReasonType, setDeactivateReasonType] = useState("");
  const [deactivateCustomReason, setDeactivateCustomReason] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (roleFilter !== "ALL") params.role = roleFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      params.page = page;
      params.limit = limit;

      const [userRes, statsRes] = await Promise.all([
        listUsers(params as any),
        getStats(),
      ]);

      if (userRes.status === "success" && userRes.data) {
        setUsers(userRes.data.users || []);
        setTotalPages(userRes.data.pagination?.total_pages ?? 1);
        setTotalItems(userRes.data.pagination?.total ?? 0);
      } else {
        setUsers([]);
        setTotalPages(1);
        setTotalItems(0);
      }

      if (statsRes.status === "success" && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil data");
      setUsers([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, roleFilter, searchQuery, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, roleFilter, searchQuery]);

  function openApproveModal(user: UserListItem) {
    setSelectedUser(user);
    setCatatanValidasi("");
    setShowApproveModal(true);
  }

  function openRejectModal(user: UserListItem) {
    setSelectedUser(user);
    setAlasanTolak("");
    setShowRejectModal(true);
  }

  function openDeactivateDialog(user: UserListItem) {
    setSelectedUser(user);
    setDeactivateReasonType("");
    setDeactivateCustomReason("");
    setShowDeactivateDialog(true);
  }

  async function handleApprove() {
    if (!selectedUser) return;
    setActionLoadingID(selectedUser.id);
    setError("");
    setSuccess("");
    try {
      const res: MessageResponse = await approveUser(selectedUser.id, catatanValidasi);
      setSuccess(res.message || "Akun berhasil disetujui.");
      setShowApproveModal(false);
      setSelectedUser(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyetujui");
    } finally {
      setActionLoadingID("");
    }
  }

  async function handleReject() {
    if (!selectedUser) return;
    if (alasanTolak.trim().length < 3) {
      setError("Alasan penolakan minimal 3 karakter.");
      return;
    }
    setActionLoadingID(selectedUser.id);
    setError("");
    setSuccess("");
    try {
      const res: MessageResponse = await rejectUser(selectedUser.id, alasanTolak.trim(), catatanValidasi);
      setSuccess(res.message || "Akun berhasil ditolak.");
      setShowRejectModal(false);
      setSelectedUser(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menolak");
    } finally {
      setActionLoadingID("");
    }
  }

  async function handleDeactivate() {
    if (!selectedUser) return;
    const reason = deactivateReasonType === "others" ? deactivateCustomReason.trim() : deactivateReasonType;
    setActionLoadingID(selectedUser.id);
    setError("");
    setSuccess("");
    try {
      const res: MessageResponse = await deactivateUser(selectedUser.id, reason || undefined);
      setSuccess(res.message || "Akun berhasil dinonaktifkan.");
      setShowDeactivateDialog(false);
      setSelectedUser(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menonaktifkan");
    } finally {
      setActionLoadingID("");
    }
  }

  return (
    <AdminLayout>
      <div className="users-page">
        <div className="users-page__header">
          <div>
            <h2 className="users-page__title">
              Validasi Pendaftaran <span className="users-page__title--highlight">Pengguna</span>
            </h2>
            <p className="users-page__sub">Tinjau dan Verifikasi Pendaftaran Pelaku UMKM dan Mitra Sebelum Akun Di Daftarkan</p>
          </div>
          <button className="btn btn-outline" onClick={fetchData} disabled={loading}>
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stat Cards */}
        <div className="stat-cards">
          <div className="stat-card">
            <Users size={24} className="stat-icon stat-icon--total" />
            <div>
              <p className="stat-value">{stats?.total ?? 0}</p>
              <p className="stat-label">Total</p>
            </div>
          </div>
          <div className="stat-card">
            <Clock size={24} className="stat-icon stat-icon--pending" />
            <div>
              <p className="stat-value">{stats?.pending ?? 0}</p>
              <p className="stat-label">Menunggu</p>
            </div>
          </div>
          <div className="stat-card stat-card--approved-card">
            <CheckCircle size={24} className="stat-icon stat-icon--approved-white" />
            <div>
              <p className="stat-value stat-value--white">{stats?.approved ?? 0}</p>
              <p className="stat-label stat-label--white">Disetujui</p>
            </div>
          </div>
          <div className="stat-card">
            <XCircle size={24} className="stat-icon stat-icon--rejected" />
            <div>
              <p className="stat-value">{stats?.rejected ?? 0}</p>
              <p className="stat-label">Ditolak</p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-tabs">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterStatus[]).map((s) => (
              <button
                key={s}
                className={`filter-tab ${statusFilter === s ? "active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === "ALL" && "Semua"}
                {s === "PENDING" && "Menunggu"}
                {s === "APPROVED" && "Disetujui"}
                {s === "REJECTED" && "Ditolak"}
              </button>
            ))}
          </div>
          <div className="filter-controls">
            <select
              className="select-input"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as FilterRole)}
            >
              <option value="ALL">Semua Role</option>
              <option value="UMKM">UMKM</option>
              <option value="MITRA">Mitra</option>
            </select>
            <div className="search-field">
              <Search size={16} className="search-input-icon" />
              <input
                className="search-input"
                type="text"
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {success && <p className="success-message">{success}</p>}
        {error && <p className="error-message">{error}</p>}

        {/* Table */}
        {loading && <p className="tab-loading">Memuat data...</p>}

        {!loading && users.length === 0 && (
          <div className="tab-empty">
            <p>Tidak ada pengguna ditemukan.</p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nama Lengkap</th>
                  <th>Email</th>
                  <th>No. HP</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Tanggal Daftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                    <tr key={user.id}>
                    <td className="td-name">{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone_number ?? "—"}</td>
                    <td>
                      <span className={`role-badge role-badge--${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${user.status.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString("id-ID")}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          title="Lihat Detail"
                        >
                          Detail
                        </button>
                        {(user.status === "PENDING" || user.status === "MENUNGGU") && (
                          <>
                            <button
                              className="btn btn-sm btn-approve"
                              onClick={() => openApproveModal(user)}
                              disabled={actionLoadingID === user.id}
                            >
                              Setujui
                            </button>
                            <button
                              className="btn btn-sm btn-reject"
                              onClick={() => openRejectModal(user)}
                              disabled={actionLoadingID === user.id}
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        {(user.status === "APPROVED" || user.status === "DISETUJUI" || user.status === "AKTIF") && user.is_active && (
                          <button
                            className="btn btn-sm btn-deactivate"
                            onClick={() => openDeactivateDialog(user)}
                            disabled={actionLoadingID === user.id}
                          >
                            Nonaktifkan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <div className="tab-summary">
            Menampilkan <strong>{users.length}</strong> dari{" "}
            <strong>{totalItems}</strong> pengguna
            {totalPages > 1 && (
              <span> — Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong></span>
            )}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
              Sebelumnya
            </button>
            <div className="pagination-pages">
              {(() => {
                const pages: (number | "...")[] = [];
                const showPages = 5;
                const half = Math.floor(showPages / 2);
                let start = Math.max(1, page - half);
                let end = Math.min(totalPages, page + half);
                if (page - half < 1) {
                  end = Math.min(totalPages, end + (half - page + 1));
                }
                if (page + half > totalPages) {
                  start = Math.max(1, start - (page + half - totalPages));
                }
                if (start > 1) {
                  pages.push(1);
                  if (start > 2) pages.push("...");
                }
                for (let i = start; i <= end; i++) pages.push(i);
                if (end < totalPages) {
                  if (end < totalPages - 1) pages.push("...");
                  pages.push(totalPages);
                }
                return pages.map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="pagination-ellipsis">...</span>
                  ) : (
                    <button
                      key={p}
                      className={`pagination-page ${p === page ? "active" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  )
                );
              })()}
            </div>
            <button
              className="pagination-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Selanjutnya
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ─── Approve Modal ─────────────────────────────────────────────── */}
      {showApproveModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Setujui Pendaftaran</h3>
            <p>
              Setujui akun <strong>{selectedUser.full_name}</strong> ({selectedUser.email})?
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
              <button
                className="btn btn-outline"
                onClick={() => setShowApproveModal(false)}
              >
                Batal
              </button>
              <button
                className="btn btn-approve"
                onClick={handleApprove}
                disabled={actionLoadingID === selectedUser.id}
              >
                {actionLoadingID === selectedUser.id ? "Memproses..." : "Setujui"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Reject Modal ──────────────────────────────────────────────── */}
      {showRejectModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Tolak Pendaftaran</h3>
            <p>
              Tolak akun <strong>{selectedUser.full_name}</strong> ({selectedUser.email})?
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
              <button
                className="btn btn-outline"
                onClick={() => setShowRejectModal(false)}
              >
                Batal
              </button>
              <button
                className="btn btn-reject"
                onClick={handleReject}
                disabled={actionLoadingID === selectedUser.id}
              >
                {actionLoadingID === selectedUser.id ? "Memproses..." : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Deactivate Confirmation Dialog ────────────────────────────── */}
      {showDeactivateDialog && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDeactivateDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Nonaktifkan Akun</h3>
            <p>
              Apakah Anda yakin ingin menonaktifkan akun{" "}
              <strong>{selectedUser.full_name}</strong> ({selectedUser.email})?
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
              <button
                className="btn btn-outline"
                onClick={() => setShowDeactivateDialog(false)}
              >
                Batal
              </button>
              <button
                className="btn btn-deactivate"
                onClick={handleDeactivate}
                disabled={actionLoadingID === selectedUser.id}
              >
                {actionLoadingID === selectedUser.id ? "Memproses..." : "Ya, Nonaktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
