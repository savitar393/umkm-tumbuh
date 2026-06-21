import { useEffect, useState } from "react";
import type { UserListItem } from "../api";
import { Link } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import { STATUS_OPTIONS, displayStatus } from "../status";
import { getStats, listUsers, listReactivationRequests, reactivateUser } from "../api";
import { ApiError } from "../../../shared/api/http";
import "./admin.css";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_COLORS = ["#4f72f5", "#6c3fdb", "#f5a623", "#2ecc71", "#e74c3c", "#1abc9c"];
function getAvatarColor(id: string) {
  const idx = parseInt(id, 10) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx] ?? AVATAR_COLORS[0];
}

export default function AdminRegistrationsPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [inactiveMonths, setInactiveMonths] = useState(0);
  const [stats, setStats] = useState<import("../api").StatsData>({ pending: 0, approved: 0, rejected: 0, reactivation_requested: 0, total: 0 });
  const [reactivationRequests, setReactivationRequests] = useState<UserListItem[]>([]);
  const [reactivationLoading, setReactivationLoading] = useState(false);

  const fetchReactivationRequests = () => {
    setReactivationLoading(true);
    listReactivationRequests(1, 50)
      .then((res) => setReactivationRequests(res.data.users as UserListItem[]))
      .catch(() => {})
      .finally(() => setReactivationLoading(false));
  };

  const handleReactivate = async (userID: string) => {
    try {
      await reactivateUser(userID);
      fetchReactivationRequests();
      fetchData();
    } catch (err: unknown) {
      const code = err instanceof ApiError && err.code ? ` (${err.code})` : "";
      setError((err instanceof Error ? err.message : "Gagal mengaktifkan akun") + code);
    }
  };

  const fetchData = () => {
    setLoading(true);
    setError("");

    Promise.all([
      listUsers({ status: statusFilter, search: search || undefined, inactive_months: inactiveMonths || undefined }),
      getStats(),
      listReactivationRequests(1, 50),
    ])
      .then(([res, statsRes, reactRes]) => {
        setUsers(res.data.users);
        setStats(statsRes.data);
        setReactivationRequests(reactRes.data.users as UserListItem[]);
      })
      .catch((err) => {
        const code = err instanceof ApiError && err.code ? ` (${err.code})` : "";
        setError((err.message || "Gagal mengambil data") + code);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, inactiveMonths]);

  function handleSearch() {
    fetchData();
  }

  return (
    <div className="adm-page">
      <AdminNavbar active="registrations" />

      <div className="adm-body">
        <div className="adm-hero">
          <div>
            <h1 className="adm-hero-title">
              Validasi Pendaftaran <span className="accent">Pengguna</span>
            </h1>
            <p className="adm-hero-sub">
              Tinjau dan verifikasi pendaftaran Pelaku UMKM dan Mitra sebelum akun diaktifkan.
            </p>
          </div>
          <button className="refresh-btn" onClick={fetchData}>
            ↻ Refresh
          </button>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Menunggu Review</span>
              <span className="stat-card-icon">📋</span>
            </div>
            <div className="stat-card-num">{stats.pending}</div>
          </div>

          <div className="stat-card dark">
            <div className="stat-card-header">
              <span className="stat-card-label">Akun Disetujui</span>
            </div>
            <div className="stat-card-num">{stats.approved}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Pendaftaran Ditolak</span>
            </div>
            <div className="stat-card-num">{stats.rejected}</div>
          </div>
        </div>

        {reactivationRequests.length > 0 && (
          <div className="table-card reactivation-card">
            <div className="table-card-head">
              <h2 className="table-card-title">⏳ Permintaan Aktivasi Kembali</h2>
              <span className="table-card-badge">{reactivationRequests.length} menunggu</span>
            </div>
            <div className="reactivation-list">
              {reactivationRequests.map((u) => (
                <div key={u.id} className="reactivation-item">
                  <div className="reactivation-info">
                    <span className="reactivation-name">{u.full_name}</span>
                    <span className="reactivation-email">{u.email}</span>
                    <span className="reactivation-date">
                      Meminta: {u.reactivation_requested_at
                        ? new Date(u.reactivation_requested_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </span>
                  </div>
                  <div className="reactivation-actions">
                    <Link to={`/admin/users/${u.id}`} className="modal-btn cancel" style={{ textDecoration: "none", padding: "6px 14px", fontSize: 12 }}>
                      Detail
                    </Link>
                    <button
                      className="modal-btn approve"
                      onClick={() => handleReactivate(u.id)}
                      disabled={reactivationLoading}
                      style={{ fontSize: 12, padding: "6px 14px" }}
                    >
                      {reactivationLoading ? "..." : "✓ Aktifkan"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="table-card">
          <div className="table-card-head">
            <h2 className="table-card-title">Daftar Pengajuan Pendaftaran</h2>
            <div className="filter-row">
              <div className="filter-select-wrap">
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className={`filter-inactive-btn${inactiveMonths === 3 ? " active" : ""}`}
                onClick={() => setInactiveMonths(inactiveMonths === 3 ? 0 : 3)}
              >
                ⏳ Tidak Aktif &gt; 3 Bulan
              </button>
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input
                  className="search-input"
                  placeholder="Cari nama, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: "16px 24px", color: "#ef4444", fontSize: 14 }}>{error}</div>
          )}

          <div className="reg-table-wrap">
            <table className="reg-tbl">
              <thead>
                <tr>
                  <th>NAMA PENDAFTAR</th>
                  <th>TIPE</th>
                  <th>KELENGKAPAN</th>
                  <th>TERAKHIR LOGIN</th>
                  <th>HASIL SCAN</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                      Memuat data...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                      Tidak ada data pendaftaran.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="reg-tbl-row">
                      <td>
                        <div className="reg-name-cell">
                          <div
                            className="reg-avatar"
                            style={{ background: getAvatarColor(user.id) }}
                          >
                            {getInitials(user.full_name)}
                          </div>
                          <div>
                            <div className="reg-org-name">{user.full_name}</div>
                            <div className="reg-reg-id">{user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="td-plain">{user.role === "UMKM" ? "UMKM" : "Mitra"}</td>
                      <td>
                        {user.submitted_at ? (
                          <span className="kel-badge complete">✔ Dokumen Lengkap</span>
                        ) : (
                          <span className="kel-badge waiting">⚠ Menunggu Dokumen</span>
                        )}
                      </td>
                      <td className="td-login">
                        {user.last_login_at
                          ? new Date(user.last_login_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className={`td-scan ${!user.is_active && user.status === "APPROVED" ? "inactive" : user.status === "APPROVED" ? "valid" : "incomplete"}`}>
                        {!user.is_active && user.status === "APPROVED" ? "Nonaktif" : user.status === "APPROVED" ? "Valid" : user.status === "REJECTED" ? "Ditolak" : "Review"}
                      </td>
                      <td>
                        <span className={`status-pill ${!user.is_active && user.status === "APPROVED" ? "inactive" : user.status.toLowerCase()}`}>
                          {displayStatus(user.status, user.is_active)}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <Link
                            className="btn-review"
                            to={`/admin/users/${user.id}`}
                          >
                            Review
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
