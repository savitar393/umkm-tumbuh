import React from "react";
import { useNavigate } from "react-router-dom";
import PartnershipSidebar from "../components/PartnershipSidebar";
import { getCurrentUser } from "../../../shared/auth/currentUser";

const PartnershipSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const basePath = user?.role === "MITRA" ? "/mitra/partnerships" : "/umkm/partnerships";

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif", position: "relative" }}>
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundImage: "url(/background.png)", backgroundSize: "cover", backgroundPosition: "center", zIndex: 0, opacity: 0.7 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", width: "100%" }}>
      <PartnershipSidebar />
      <main style={{ marginLeft: 260, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div style={{ maxWidth: 500, width: "100%", background: "white", borderRadius: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.08)", padding: "56px 40px", textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#E8F5F0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 800, color: "#1A3A6B" }}>Pengajuan Berhasil Dikirim!</h1>
          <p style={{ margin: "0 0 36px", fontSize: 15, color: "#5F5E5A", lineHeight: 1.6 }}>
            Pengajuan kemitraan Anda telah berhasil dikirim dan sedang menunggu review dari mitra terkait.
          </p>
          <button onClick={() => navigate(`${basePath}/status`)} style={{ width: "100%", padding: "14px 0", background: "#1A3A6B", border: "none", borderRadius: 40, color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 16, boxShadow: "0 4px 12px rgba(26,58,107,0.25)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2A5DA8")} onMouseLeave={(e) => (e.currentTarget.style.background = "#1A3A6B")}>
            Lihat Status Pengajuan
          </button>
          <button onClick={() => navigate("/umkm")} style={{ background: "none", border: "none", fontSize: 14, fontWeight: 600, color: "#888780", cursor: "pointer", padding: "8px 16px" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1A3A6B")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888780")}>
            Kembali ke Dashboard
          </button>
        </div>
      </main>
      </div>
    </div>
  );
};

export default PartnershipSuccessPage;
