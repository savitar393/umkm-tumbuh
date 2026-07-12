import { Link, Navigate, useNavigate } from "react-router-dom";
import { CheckCircle, Clock3 } from "lucide-react";
import {
  getCurrentUser,
  getDefaultRouteByRole,
  isApprovedStatus,
  isRejectedStatus,
} from "../../../shared/auth/currentUser";
import { useEffect, useState } from "react";
import { getRegistrationFlowStatus } from "../api";

export default function RegisterPendingPage() {
  const user = getCurrentUser();

  const navigate = useNavigate();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    if (!user) return;

    if (user.role !== "UMKM" && user.role !== "MITRA") {
      setCheckingStatus(false);
      return;
    }

    let cancelled = false;

    async function checkStatus() {
      try {
        setStatusError("");

        const flowStatus = await getRegistrationFlowStatus();

        if (cancelled) return;

        if (flowStatus.next_route && flowStatus.next_route !== "/register/pending") {
          navigate(flowStatus.next_route, { replace: true });
          return;
        }
      } catch (err) {
        if (!cancelled) {
          setStatusError(err instanceof Error ? err.message : "Gagal memeriksa status pendaftaran.");
        }
      } finally {
        if (!cancelled) {
          setCheckingStatus(false);
        }
      }
    }

    checkStatus();

    return () => {
      cancelled = true;
    };
  }, [navigate, user?.id, user?.role]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isApprovedStatus(user.status)) {
    return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
  }

  if (isRejectedStatus(user.status)) {
    return <Navigate to="/register/rejected" replace />;
  }

  if (checkingStatus) {
    return (
      <main className="register-detail-page">
        <section className="register-detail-shell">
          <div className="register-detail-card">
            <p>Memeriksa status pendaftaran...</p>
          </div>
        </section>
      </main>
    );
  }

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
              background: "#a7f3d0",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 28,
            }}
          >
            <Clock3 size={40} color="#065f46" />
          </div>

          {statusError ? <div className="form-alert error">{statusError}</div> : null}

          <h1>Pendaftaran Berhasil Dikirim</h1>

          <div className="form-alert success" style={{ display: "inline-flex", marginTop: 12 }}>
            <CheckCircle size={18} />
            Menunggu Review
          </div>

          <p style={{ maxWidth: 560, margin: "28px auto", color: "#475569", lineHeight: 1.7 }}>
            Data Anda sedang ditinjau oleh tim kurasi UMKM Tumbuh. Proses verifikasi biasanya
            memakan waktu 2–3 hari kerja. Anda akan menerima notifikasi setelah peninjauan selesai.
          </p>

          <div className="register-detail-actions" style={{ justifyContent: "center" }}>
            <Link to="/login" className="secondary-button">
              Kembali ke Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}