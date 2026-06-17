import React from "react";
import { useNavigate } from "react-router-dom";
import PartnershipSidebar from "../components/PartnershipSidebar";

const PartnershipApprovalSuccessPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif", position: "relative" }}>
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundImage: "url(/background.png)", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", zIndex: 0 }} />
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(255,255,255,0.45)", zIndex: 1 }} />
      <PartnershipSidebar />
      <main style={{ marginLeft: 260, flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 2, minHeight: "100vh" }}>
        <header style={{ background: "white", borderBottom: "1px solid #E8E7E2", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#2C2C2A" }}>Nusantara Ventures</p>
              <p style={{ margin: 0, fontSize: 11, color: "#888780" }}>MITRA</p>
            </div>
          </div>
        </header>
        <div style={{ padding: "32px 40px", width: "100%", maxWidth: 1200, alignSelf: "center" }}>
          <div style={{ maxWidth: 640, margin: "40px auto 0", background: "white", borderRadius: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.08)", border: "1px solid #E8E7E2", padding: "56px 48px", textAlign: "center" }}>
            <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 28px" }}>
              <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#F0FAF6", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(29, 158, 117, 0.2)" }}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <svg style={{ position: "absolute", top: -8, right: -12, width: 32, height: 32 }} viewBox="0 0 24 24" fill="#F5A623"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <svg style={{ position: "absolute", bottom: -4, left: -10, width: 20, height: 20 }} viewBox="0 0 24 24" fill="#1D9E75"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <h1 style={{ margin: "0 0 12px", fontSize: 32, fontWeight: 800, color: "#1A3A6B", letterSpacing: "-0.5px" }}>Kemitraan Disetujui!</h1>
            <p style={{ margin: "0 0 32px", fontSize: 16, lineHeight: 1.7, color: "#5F5E5A" }}>Selamat! Kemitraan telah berhasil disetujui dan ditandatangani secara digital.</p>
            <div style={{ background: "#F0FAF6", borderRadius: 14, border: "1px solid #1D9E75", padding: "16px 20px", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#1D9E75", textAlign: "left" }}>DokumenPersetujuan_Kemitraan.pdf</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#888780", textAlign: "left" }}>Ditandatangani hari ini</p>
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1D9E75", background: "#E8F5F0", padding: "4px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Tertanda tangan
              </span>
            </div>
            <button onClick={() => navigate("/mitra/partnerships/inbox")} style={{ width: "100%", maxWidth: 400, padding: "14px 0", background: "#1A3A6B", border: "none", borderRadius: 40, color: "white", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "block", margin: "0 auto 16px", boxShadow: "0 4px 12px rgba(26, 58, 107, 0.25)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2A5DA8")} onMouseLeave={(e) => (e.currentTarget.style.background = "#1A3A6B")}>Lihat Status Kemitraan</button>
            <button onClick={() => navigate("/mitra")} style={{ padding: "10px 24px", background: "white", border: "1px solid #D3D1C7", borderRadius: 30, fontSize: 14, fontWeight: 500, color: "#1A3A6B", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2A5DA8")} onMouseLeave={(e) => (e.currentTarget.style.color = "#1A3A6B")}>Kembali ke Dashboard</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PartnershipApprovalSuccessPage;