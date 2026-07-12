import { Link, Navigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import {
  getCurrentUser,
  getDefaultRouteByRole,
  isApprovedStatus,
} from "../../../shared/auth/currentUser";

export default function RegisterRejectedPage() {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isApprovedStatus(user.status)) {
    return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
  }

  const rolePath = user.role === "MITRA" ? "mitra" : "umkm";
  const reason =
    user.catatan_validasi ||
    user.rejection_reason ||
    "Terdapat ketidaksesuaian pada data pendaftaran. Silakan perbaiki data Anda.";

  return (
    <main className="register-detail-page">
      <header className="register-detail-navbar">
        <Link to="/" className="register-detail-brand">
          <img src="/tumbuh.png" alt="UMKM Tumbuh" />
          <span>UMKM Tumbuh</span>
        </Link>

        <nav>
          <Link to="/">Tentang Kami</Link>
          <Link to="/">Program</Link>
        </nav>
      </header>

      <section className="register-detail-shell">
        <div className="register-detail-card" style={{ maxWidth: 760, textAlign: "center" }}>
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 999,
              background: "#fee2e2",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 28,
            }}
          >
            <AlertTriangle size={40} color="#b91c1c" />
          </div>

          <h1>Pendaftaran Belum Disetujui</h1>

          <div className="form-alert error" style={{ marginTop: 24, textAlign: "left" }}>
            {reason}
          </div>

          <div className="register-detail-actions" style={{ justifyContent: "center", marginTop: 32 }}>
            <Link to={`/register/${rolePath}/details`} className="primary-button">
              Perbaiki Data
            </Link>

            <Link to="/" className="secondary-button">
              Hubungi Admin
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
