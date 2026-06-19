import React from "react";
import { useNavigate } from "react-router-dom";
import PartnershipSidebar from "../components/PartnershipSidebar";

// ─── Logo Components ──────────────────────────────────────────────────────────

const LogoKementrian: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="17" stroke="white" strokeWidth="1.5" fill="none" />
    <path d="M18 6 L20 13 L27 13 L21.5 17.5 L23.5 24.5 L18 20 L12.5 24.5 L14.5 17.5 L9 13 L16 13 Z" fill="white" />
    <text x="18" y="32" textAnchor="middle" fill="white" fontSize="5" fontFamily="serif" fontWeight="bold">KEMENKOP</text>
  </svg>
);

// ─── Success Page ─────────────────────────────────────────────────────────────

const PartnershipSuccessPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      background: "#F5F4F0",
    }}>
      <PartnershipSidebar />

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      <main style={{
        marginLeft: 200,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}>
        {/* Top Bar */}
        <header style={{
          background: "white",
          borderBottom: "1px solid #E8E7E2",
          padding: "0 32px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
          {/* Search Bar - like mockup */}
          <div style={{ position: "relative", width: 340 }}>
            <svg
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#B4B2A9",
              }}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Cari aplikasi kemitraan..."
              style={{
                width: "100%",
                height: 40,
                paddingLeft: 42,
                borderRadius: 40,
                border: "none",
                background: "#F1F1F1",
                fontSize: 13,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Right Section */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Notification */}
            <button style={{
              background: "#1A3A6B",
              border: "none",
              borderRadius: 12,
              width: 44,
              height: 44,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>

            {/* Profile */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1A7A5E" }}>
                  Nusantara Ventures
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "#888780" }}>MITRA</p>
              </div>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#1A3A6B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}>
                <LogoKementrian size={32} />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: "32px 40px", flex: 1 }}>
          {/* Banner - Tahap Akhir */}
          <div style={{
            background: "linear-gradient(90deg, #1A3A6B 0%, #2A5DA8 100%)",
            borderRadius: 18,
            padding: "32px 40px",
            marginBottom: 48,
          }}>
            <span style={{
              display: "inline-block",
              background: "white",
              color: "#1A3A6B",
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 20px",
              borderRadius: 40,
              letterSpacing: 0.5,
            }}>
              TAHAP AKHIR
            </span>
            <h2 style={{
              margin: "20px 0 12px",
              fontSize: 48,
              fontWeight: 700,
              color: "#F5A623",
              lineHeight: 1.2,
            }}>
              Selesai, UMKM Tumbuh!
            </h2>
            <p style={{
              margin: 0,
              fontSize: 18,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.5,
              maxWidth: 600,
            }}>
              Silakan tinjau draf kontrak kemitraan Anda. Pastikan semua data
              profil usaha sudah sesuai sebelum menandatangani secara digital.
            </p>
          </div>

          {/* Success Content - Centered like mockup */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: 700,
            margin: "0 auto",
          }}>
            {/* Success Illustration */}
            <div style={{
              position: "relative",
              width: 200,
              height: 200,
              marginBottom: 32,
            }}>
              {/* Outer ring */}
              <div style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "#E8E7E2",
              }} />
              
              {/* Inner checkmark block */}
              <div style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: 100,
                height: 100,
                background: "#1A3A6B",
                borderRadius: 24,
                rotate: "-10deg",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Star decoration */}
              <div style={{
                position: "absolute",
                right: 20,
                top: 20,
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: "#FDE8C8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#F5A623" stroke="none">
                  <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5-6-4.5-6 4.5 2.5-7.5-6-4.5h7.5z" />
                </svg>
              </div>
            </div>

            {/* Success Title */}
            <h1 style={{
              margin: "0 0 16px",
              fontSize: 56,
              fontWeight: 700,
              color: "#1D9E75",
            }}>
              Pengajuan Terkirim!
            </h1>

            {/* Description */}
            <p style={{
              margin: "0 0 40px",
              fontSize: 20,
              lineHeight: 1.5,
              color: "#5F5E5A",
            }}>
              Tim kami akan meninjau berkas Anda dalam{" "}
              <span style={{ color: "#1FA55B", fontWeight: 600 }}>3–5 hari kerja</span>.
              Kami akan memberikan notifikasi jika ada perkembangan terbaru.
            </p>

            {/* Primary Button */}
            <button
              onClick={() => navigate("/partnerships/status")}
              style={{
                width: 400,
                padding: "14px 0",
                background: "#1A3A6B",
                border: "none",
                borderRadius: 40,
                color: "white",
                fontSize: 18,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s",
                marginBottom: 24,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2A5DA8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#1A3A6B")}
            >
              Pantau Status
            </button>

            {/* Secondary Link */}
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                background: "none",
                border: "none",
                fontSize: 20,
                fontWeight: 600,
                color: "#1D9E75",
                cursor: "pointer",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0F6E56")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#1D9E75")}
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PartnershipSuccessPage;