import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { getCurrentUser } from "../../../shared/auth/currentUser";

type RegisterDetailRole = "umkm" | "mitra";

export default function RegisterReviewPage() {
  const params = useParams();
  const location = useLocation();
  const currentUser = getCurrentUser();

  const role: RegisterDetailRole = params.role === "mitra" ? "mitra" : "umkm";

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const expectedRole = role === "umkm" ? "UMKM" : "MITRA";

  if (currentUser.role !== expectedRole) {
    return <Navigate to={`/register/${currentUser.role.toLowerCase()}/details`} replace />;
  }

  const dashboardPath = role === "umkm" ? "/umkm" : "/mitra";
  const editPath = `/register/${role}/details`;

  return (
    <main className="register-detail-page">
      <header className="register-detail-navbar">
        <Link to="/" className="register-detail-brand">
          <img src="/tumbuh.png" alt="UMKM Tumbuh" />
          <span>UMKM Tumbuh</span>
        </Link>

        <nav>
          <Link to={editPath}>Edit Data</Link>
          <Link to={dashboardPath}>Dashboard</Link>
        </nav>
      </header>

      <section className="register-detail-shell">
        <div className="register-detail-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <CheckCircle size={32} color="#16a34a" />
            <div>
              <h1>Review Pendaftaran</h1>
              <p>
                {location.state?.message ??
                  "Data pendaftaran berhasil disimpan. Silakan cek kembali data Anda."}
              </p>
            </div>
          </div>

          <div className="form-alert success">
            Data profil dan dokumen sudah tersimpan. Tahap review final belum dibuat penuh, jadi halaman
            ini menjadi checkpoint sementara sebelum submit final pendaftaran.
          </div>

          <div className="register-detail-actions">
            <Link to={editPath} className="secondary-button">
              Kembali Edit Data
            </Link>

            <Link to={dashboardPath} className="primary-button">
              Lanjut ke Dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
