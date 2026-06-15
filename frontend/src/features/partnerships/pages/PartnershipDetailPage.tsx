import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { partnershipsApi } from "../api";
import type { PartnershipRequest, PartnershipStatus } from "../types";

// ─── Logo Components ──────────────────────────────────────────────────────────

const LogoNusantara: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div style={{
    width: size,
    height: size,
    background: "#1A3A6B",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#F5A623",
    fontWeight: "bold",
    fontSize: size * 0.4,
  }}>
    NV
  </div>
);

// ─── Star Rating Component ────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {[...Array(5)].map((_, i) => (
        <span key={i} style={{ 
          color: i < fullStars ? "#F5A623" : (i === fullStars && hasHalfStar ? "#F5A623" : "#E8E7E2"), 
          fontSize: 16 
        }}>
          {i < fullStars ? "★" : (i === fullStars && hasHalfStar ? "½" : "☆")}
        </span>
      ))}
      <span style={{ fontSize: 13, color: "#888780", marginLeft: 6 }}>{rating.toFixed(1)}</span>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PartnershipDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [partnership, setPartnership] = useState<PartnershipRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDownloadAlert, setShowDownloadAlert] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPartnership(id);
    }
  }, [id]);

  const fetchPartnership = async (partnershipId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await partnershipsApi.getDetail(partnershipId);
      
      if (response.status === "success" && response.data) {
        setPartnership(response.data as PartnershipRequest);
      } else {
        setError(response.message || "Gagal memuat detail kemitraan");
      }
    } catch (err) {
      console.error("Error fetching partnership:", err);
      setError("Terjadi kesalahan saat memuat data");
      
      // Mock data for demo
      setPartnership({
        id: partnershipId,
        request_code: "PKS-2026-00000001",
        requester_id: "user1",
        receiver_id: "mitra1",
        requester_role: "UMKM",
        receiver_role: "MITRA",
        category: "Pendanaan",
        proposal_title: "Pengajuan Kerjasama Pendanaan",
        proposal_description: "Mengajukan kerjasama pendanaan untuk pengembangan produk",
        business_name: "UMKM Sari Roti",
        contact_person: "+628123456789",
        product_description: "Produk roti tradisional",
        reason_for_partnership: "Membutuhkan modal pengembangan",
        nib_ktp_file: "nib.pdf",
        proposal_file: "proposal.pdf",
        status: "SUBMITTED",
        submitted_at: "2026-06-08T10:00:00Z",
        created_at: "2026-06-08T10:00:00Z",
        updated_at: "2026-06-08T10:00:00Z",
        requester_name: "UMKM Sari Roti",
        receiver_name: "Nusantara Ventures",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleDownloadTemplate = () => {
    setShowDownloadAlert(true);
    setTimeout(() => setShowDownloadAlert(false), 3000);
    // In production: window.open('/template/pengajuan-kemitraan.pdf', '_blank');
  };

  const handleAjukanKemitraan = () => {
    navigate(`/partnerships/create?receiver_id=${partnership?.receiver_id || id}&receiver_name=Nusantara%20Ventures`);
  };

  const handleBack = () => {
    navigate("/partnerships");
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#F5F4F0",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            display: "inline-block",
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "3px solid #E8E7E2",
            borderTopColor: "#1A3A6B",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: 16, color: "#888780" }}>Memuat detail mitra...</p>
        </div>
      </div>
    );
  }

  if (error || !partnership) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#F5F4F0",
      }}>
        <div style={{
          background: "white",
          borderRadius: 16,
          padding: "40px",
          textAlign: "center",
          maxWidth: 400,
        }}>
          <div style={{
            width: 64,
            height: 64,
            background: "#FEF2F2",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 20, color: "#2C2C2A" }}>Data Tidak Ditemukan</h3>
          <p style={{ margin: "0 0 24px", color: "#888780" }}>{error || "Detail kemitraan tidak tersedia"}</p>
          <button
            onClick={handleBack}
            style={{
              padding: "10px 24px",
              background: "#1A3A6B",
              border: "none",
              borderRadius: 8,
              color: "white",
              cursor: "pointer",
            }}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 1200,
      margin: "0 auto",
      padding: "40px 24px",
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      background: "#F5F4F0",
      minHeight: "100vh",
    }}>
      {/* Download Alert Toast */}
      {showDownloadAlert && (
        <div style={{
          position: "fixed",
          top: 80,
          right: 24,
          background: "#1D9E75",
          color: "white",
          padding: "12px 20px",
          borderRadius: 12,
          fontSize: 14,
          zIndex: 1000,
          animation: "slideIn 0.3s ease",
        }}>
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
          📄 Template pengajuan sedang diunduh...
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={handleBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          color: "#1A3A6B",
          cursor: "pointer",
          marginBottom: 24,
          fontSize: 14,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Kembali ke Daftar
      </button>

      {/* Main Content - Two Columns */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 32,
      }}>
        {/* LEFT COLUMN - Company Profile */}
        <div>
          {/* Header with Logo and Company Name */}
          <div style={{
            background: "white",
            borderRadius: 20,
            padding: "32px",
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
              <LogoNusantara size={64} />
              <div>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#1A3A6B" }}>
                  Nusantara Ventures
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                  <StarRating rating={4.8} />
                  <span style={{ fontSize: 13, color: "#888780" }}>• 120+ Kemitraan</span>
                  <span style={{ fontSize: 13, color: "#1D9E75" }}>• 85% Sukses</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: "#5F5E5A",
              marginBottom: 24,
            }}>
              Nusantara Ventures adalah perusahaan modal ventura terkemuka yang berdedikasi untuk 
              memberdayakan UMKM pengrajin dan kreatif di Indonesia. Kami tidak hanya memberikan 
              pendanaan, tetapi juga ekosistem pendukung yang kuat untuk membantu bisnis Anda 
              naik kelas ke pasar internasional.
            </p>

            <p style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: "#5F5E5A",
              marginBottom: 24,
            }}>
              Memiliki lebih dari 120+ kerja sama dengan pasar internasional maupun nasional. 
              Memiliki tingkat kesuksesan 85% dalam bermitra. Kami lebih berfokus pada produk 
              kriya dan fashion, kuliner olahan berkelanjutan dan teknologi rantai pasok.
            </p>

            {/* Criteria Section */}
            <div style={{
              background: "#F0FAF6",
              borderRadius: 16,
              padding: "20px",
              marginBottom: 24,
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#1D9E75" }}>
                Kriteria Bermitra
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#5F5E5A", fontSize: 14, lineHeight: 1.8 }}>
                <li>Beroperasi minimal 12 bulan</li>
                <li>Memiliki laporan keuangan dasar</li>
                <li>Potensi skalabilitas tinggi</li>
              </ul>
            </div>

            {/* Benefits Section */}
            <div>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#1A3A6B" }}>
                Keuntungan Bermitra
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#5F5E5A", fontSize: 14, lineHeight: 1.8 }}>
                <li>Akses pendanaan</li>
                <li>Mentoring dari para ahli</li>
                <li>Jejaring global</li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Action Card */}
        <div>
          {/* Ajukan Kemitraan Card */}
          <div style={{
            background: "white",
            borderRadius: 20,
            padding: "28px",
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            position: "sticky",
            top: 24,
          }}>
            <h2 style={{
              margin: "0 0 8px",
              fontSize: 22,
              fontWeight: 700,
              color: "#1A3A6B",
            }}>
              Ajukan Kemitraan
            </h2>
            <p style={{
              fontSize: 13,
              color: "#888780",
              marginBottom: 24,
            }}>
              Bergabung dengan ekosistem kami
            </p>

            {/* Download Template Button */}
            <button
              onClick={handleDownloadTemplate}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "14px 0",
                background: "#F5F4F0",
                border: "1px solid #E8E7E2",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                color: "#1A3A6B",
                cursor: "pointer",
                marginBottom: 20,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#E8E7E2")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#F5F4F0")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Unduh Template Pengajuan Kemitraan (PDF)
            </button>

            {/* Divider */}
            <div style={{
              height: 1,
              background: "#E8E7E2",
              margin: "20px 0",
            }} />

            {/* Ajukan Sekarang Button */}
            <button
              onClick={handleAjukanKemitraan}
              style={{
                width: "100%",
                padding: "14px 0",
                background: "#1A3A6B",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: "white",
                cursor: "pointer",
                marginBottom: 24,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2A5DA8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#1A3A6B")}
            >
              Ajukan Sekarang
            </button>

            {/* Contact Info */}
            <div>
              <h3 style={{
                margin: "0 0 12px",
                fontSize: 14,
                fontWeight: 600,
                color: "#2C2C2A",
              }}>
                Informasi Kontak
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <a
                  href="mailto:partnership@nusantara.vc"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                    color: "#1A3A6B",
                    textDecoration: "none",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 7L2 7" />
                  </svg>
                  partnership@nusantara.vc
                </a>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#5F5E5A" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  +62 21 555 0123
                </div>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div style={{
            background: "linear-gradient(135deg, #1A3A6B 0%, #2A5DA8 100%)",
            borderRadius: 20,
            padding: "24px",
            color: "white",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, opacity: 0.7 }}>TOTAL KEMITRAAN</p>
                <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700 }}>120+</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, opacity: 0.7 }}>TINGKAT SUKSES</p>
                <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700 }}>85%</p>
              </div>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: "85%", height: "100%", background: "#F5A623", borderRadius: 2 }} />
            </div>
            <p style={{ margin: "16px 0 0", fontSize: 12, opacity: 0.8, textAlign: "center" }}>
              Bergabung dengan 120+ mitra UMKM lainnya
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnershipDetailPage;