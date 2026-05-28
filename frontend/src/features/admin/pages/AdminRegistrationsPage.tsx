import { useEffect, useState } from "react";
import type { User } from "../../auth/api";
import {
  approveRegistration,
  listRegistrations,
  rejectRegistration,
  type RegistrationStatusFilter,
} from "../api";

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<User[]>([]);
  const [status, setStatus] = useState<RegistrationStatusFilter>("PENDING");
  const [loading, setLoading] = useState(true);
  const [actionLoadingID, setActionLoadingID] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchRegistrations() {
      try {
        const data = await listRegistrations(status);

        if (!ignore) {
          setRegistrations(data);
          setError("");
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil data pendaftaran"
          );
          setRegistrations([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchRegistrations();

    return () => {
      ignore = true;
    };
  }, [status]);

  function handleStatusChange(nextStatus: RegistrationStatusFilter) {
    setStatus(nextStatus);
    setLoading(true);
    setError("");
    setMessage("");
  }

  async function refreshRegistrations() {
    const data = await listRegistrations(status);
    setRegistrations(data);
  }

  async function handleApprove(userID: string) {
    setActionLoadingID(userID);
    setError("");
    setMessage("");

    try {
      await approveRegistration(userID);
      setMessage("Pendaftaran berhasil disetujui.");
      await refreshRegistrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyetujui pendaftaran");
    } finally {
      setActionLoadingID("");
    }
  }

  async function handleReject(userID: string) {
    const reason = window.prompt("Masukkan alasan penolakan:");

    if (!reason || reason.trim().length < 3) {
      setError("Alasan penolakan minimal 3 karakter.");
      return;
    }

    setActionLoadingID(userID);
    setError("");
    setMessage("");

    try {
      await rejectRegistration(userID, reason.trim());
      setMessage("Pendaftaran berhasil ditolak.");
      await refreshRegistrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menolak pendaftaran");
    } finally {
      setActionLoadingID("");
    }
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-card wide">
        <div className="page-header">
          <div>
            <h1>Review Pendaftaran</h1>
            <p>Validasi akun UMKM dan Mitra yang baru mendaftar.</p>
          </div>

          <select
            value={status}
            onChange={(event) =>
              handleStatusChange(event.target.value as RegistrationStatusFilter)
            }
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ALL">Semua</option>
          </select>
        </div>

        {loading && <p>Memuat data...</p>}
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && registrations.length === 0 && (
          <p>Tidak ada data pendaftaran untuk status ini.</p>
        )}

        {registrations.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Tanggal Daftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((user) => (
                  <tr key={user.id}>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.status}</td>
                    <td>{new Date(user.created_at).toLocaleString("id-ID")}</td>
                    <td>
                      {user.status === "PENDING" ? (
                        <div className="table-actions">
                          <button
                            onClick={() => handleApprove(user.id)}
                            disabled={actionLoadingID === user.id}
                          >
                            Setujui
                          </button>
                          <button
                            className="danger"
                            onClick={() => handleReject(user.id)}
                            disabled={actionLoadingID === user.id}
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}