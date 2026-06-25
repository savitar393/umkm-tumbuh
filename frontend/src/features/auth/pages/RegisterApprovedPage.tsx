import { Link, Navigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import {
  getCurrentUser,
  getDefaultRouteByRole,
  isApprovedStatus,
} from "../../../shared/auth/currentUser";

export default function RegisterApprovedPage() {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isApprovedStatus(user.status)) {
    return <Navigate to="/register/pending" replace />;
  }

  const dashboardPath = getDefaultRouteByRole(user.role);

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
              background: "#86efac",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 28,
            }}
          >
            <CheckCircle size={44} color="#065f46" />
          </div>

          <h1>Akun Anda Disetujui</h1>

          <p style={{ maxWidth: 560, margin: "24px auto", color: "#475569", lineHeight: 1.7 }}>
            Selamat! Pendaftaran Anda telah diverifikasi dan disetujui. Anda sekarang dapat
            mengakses dashboard penuh.
          </p>

          <Link to={dashboardPath} className="primary-button">
            Masuk ke Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
