import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { User } from "../../auth/api";
import {
  approveRegistration,
  listRegistrations,
  rejectRegistration,
  type RegistrationStatusFilter,
} from "../api";
import AdminLayout from "../components/AdminLayout";

type Tab = "registrations" | "all";

export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as Tab) ?? "registrations";

  function setTab(tab: Tab) {
    setSearchParams({ tab });
  }

  return (
    <AdminLayout>
      <div className="users-page">
        {/* Page header */}
        <div className="users-page__header">
          <div>
            <h2 className="users-page__title">User Management</h2>
            <p className="users-page__sub">Kelola pengguna UMKM dan Mitra yang terdaftar</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="users-tabs">
          <button
            className={`users-tab ${activeTab === "registrations" ? "active" : ""}`}
            onClick={() => setTab("registrations")}
          >
            📋 Pendaftaran
          </button>
          <button
            className={`users-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setTab("all")}
          >
            👥 Semua Pengguna
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "registrations" && <RegistrationsTab />}
        {activeTab === "all" && <AllUsersTab />}
      </div>
    </AdminLayout>
  );
}

// ─── Tab Pendaftaran ──────────────────────────────────────────────────────────

function RegistrationsTab() {
  const [registrations, setRegistrations] = useState<User[]>([]);
  const [status, setStatus] = useState<RegistrationStatusFilter>("PENDING");
  const [loading, setLoading] = useState(true);
  const [actionLoadingID, setActionLoadingID] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetch() {
      setLoading(true);
      try {
        const data = await listRegistrations(status);
        if (!ignore) { setRegistrations(data); setError(""); }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Gagal mengambil data");
          setRegistrations([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetch();
    return () => { ignore = true; };
  }, [status]);

  async function handleApprove(userID: string) {
    setActionLoadingID(userID);
    setError(""); setMessage("");
    try {
      await approveRegistration(userID);
      setMessage("Pendaftaran berhasil disetujui.");
      setRegistrations(await listRegistrations(status));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyetujui");
    } finally { setActionLoadingID(""); }
  }

  async function handleReject(userID: string) {
    const reason = window.prompt("Masukkan alasan penolakan:");
    if (!reason || reason.trim().length < 3) {
      setError("Alasan penolakan minimal 3 karakter."); return;
    }
    setActionLoadingID(userID);
    setError(""); setMessage("");
    try {
      await rejectRegistration(userID, reason.trim());
      setMessage("Pendaftaran berhasil ditolak.");
      setRegistrations(await listRegistrations(status));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menolak");
    } finally { setActionLoadingID(""); }
  }

  const counts = {
    PENDING: registrations.length,
  };

  return (
    <div className="tab-content">
      <div className="tab-content__toolbar">
        <div className="status-filter-tabs">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as RegistrationStatusFilter[]).map((s) => (
            <button
              key={s}
              className={`status-tab ${status === s ? "active" : ""}`}
              onClick={() => { setStatus(s); setError(""); setMessage(""); }}
            >
              {s === "PENDING" && "⏳ Menunggu"}
              {s === "APPROVED" && "✅ Disetujui"}
              {s === "REJECTED" && "❌ Ditolak"}
              {s === "ALL" && "📋 Semua"}
            </button>
          ))}
        </div>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {loading && <p className="tab-loading">Memuat data...</p>}

      {!loading && registrations.length === 0 && (
        <div className="tab-empty">
          <p>Tidak ada pendaftaran dengan status ini.</p>
        </div>
      )}

      {!loading && registrations.length > 0 && (
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
              {registrations.map((user) => (
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
                    {user.status === "PENDING" ? (
                      <div className="table-actions">
                        <button
                          className="btn-approve"
                          onClick={() => handleApprove(user.id)}
                          disabled={actionLoadingID === user.id}
                        >
                          Setujui
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleReject(user.id)}
                          disabled={actionLoadingID === user.id}
                        >
                          Tolak
                        </button>
                      </div>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!loading && (
        <div className="tab-summary">
          Menampilkan <strong>{registrations.length}</strong> pengguna
        </div>
      )}
    </div>
  );
}

// ─── Tab Semua Pengguna ───────────────────────────────────────────────────────

function AllUsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let ignore = false;
    listRegistrations("ALL")
      .then((data) => { if (!ignore) { setUsers(data); setError(""); } })
      .catch((err) => { if (!ignore) setError(err instanceof Error ? err.message : "Gagal memuat"); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const filtered = users.filter((u) =>
    search === "" ||
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="tab-content">
      <div className="tab-content__toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="🔍 Cari nama atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="error-message">{error}</p>}
      {loading && <p className="tab-loading">Memuat data...</p>}

      {!loading && filtered.length === 0 && (
        <div className="tab-empty"><p>Tidak ada pengguna ditemukan.</p></div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nama Lengkap</th>
                <th>Email</th>
                <th>No. HP</th>
                <th>Role</th>
                <th>Status</th>
                <th>Terdaftar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <div className="tab-summary">
          Menampilkan <strong>{filtered.length}</strong> dari <strong>{users.length}</strong> pengguna
        </div>
      )}
    </div>
  );
}
