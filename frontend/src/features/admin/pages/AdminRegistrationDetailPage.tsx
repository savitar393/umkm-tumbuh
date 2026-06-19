import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { User } from "../../auth/api";

export default function AdminRegistrationDetailPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  useParams(); // id resolved from state
  // Prefer passed state, fallback to fetching via API if needed (not implemented)
  const user: User | undefined = state as User | undefined;

  if (!user) {
    // No user data; could fetch here. For now, show placeholder.
    return (
      <main className="dashboard-page">
        <section className="dashboard-card">
          <h1>Detail Pendaftaran</h1>
          <p>Data tidak tersedia.</p>
          <button onClick={() => navigate(-1)}>Kembali</button>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-card wide">
        <h1>Detail Pendaftaran</h1>
        <p><strong>Nama:</strong> {user.full_name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Status:</strong> {user.status}</p>
        <p><strong>Tanggal Daftar:</strong> {new Date(user.created_at).toLocaleString("id-ID")}</p>
        <button onClick={() => navigate(-1)}>Kembali</button>
      </section>
    </main>
  );
}
