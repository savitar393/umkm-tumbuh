// frontend/src/features/partnerships/pages/PartnershipDetailPage.tsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { partnershipsApi } from "../api";

interface MitraDetail {
  id: string;
  name: string;
  type: string;
  city: string;
  province: string;
  description: string;
  operational_area: string;
  email?: string;
  phone?: string;
  website?: string;
  tahun_berdiri?: number;
  jumlah_mitra?: number;
  success_rate?: number;
}

const PartnershipDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [mitra, setMitra] = useState<MitraDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchMitraDetail(id);
    }
  }, [id]);

  const fetchMitraDetail = async (mitraId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Untuk sementara, kita fetch dari list dan cari berdasarkan ID
      // Karena backend belum punya endpoint detail untuk mitra/umkm
      const response = await partnershipsApi.listMitra({ page: 1, limit: 1000 });
      
      const foundMitra = response.mitra?.find(m => m.id === mitraId);
      
      if (foundMitra) {
        setMitra({
          id: foundMitra.id,
          name: foundMitra.name,
          type: foundMitra.type,
          city: foundMitra.city,
          province: foundMitra.province,
          description: foundMitra.description || "Mitra terpercaya untuk pengembangan UMKM di Indonesia",
          operational_area: foundMitra.operational_area || "Nasional",
          email: getEmailFromName(foundMitra.name),
          phone: getPhoneFromName(foundMitra.name),
        });
      } else {
        setError("Mitra tidak ditemukan");
      }
    } catch (err) {
      console.error("Error fetching mitra detail:", err);
      setError("Gagal memuat detail mitra");
    } finally {
      setLoading(false);
    }
  };

  // Helper function untuk generate kontak berdasarkan nama mitra
  const getEmailFromName = (name: string): string => {
    const emailMap: Record<string, string> = {
      "PT Karya Bersama": "karyabersama@example.com",
      "Dinas Akselerasi Digital": "akselerasi@dinas.go.id",
      "Komunitas Sahabat UMKM": "info@sahabatumkm.com",
      "Nusantara Ventures": "partnership@nusantara.vc",
    };
    return emailMap[name] || `info@${name.toLowerCase().replace(/\s/g, "")}.co.id`;
  };

  const getPhoneFromName = (name: string): string => {
    const phoneMap: Record<string, string> = {
      "PT Karya Bersama": "+62 21 555 0123",
      "Dinas Akselerasi Digital": "+62 21 555 0456",
      "Komunitas Sahabat UMKM": "+62 21 555 0789",
      "Nusantara Ventures": "+62 21 555 0123",
    };
    return phoneMap[name] || "+62 21 555 0000";
  };

  const handleBack = () => {
    navigate("/partnerships");
  };

  const handleAjukanKemitraan = () => {
    navigate(`/partnerships/create?receiver_id=${id}`);
  };

  const handleDownloadTemplate = () => {
    // Buat link download template PDF
    const link = document.createElement("a");
    link.href = "/template-pengajuan-kemitraan.pdf";
    link.download = "Template_Pengajuan_Kemitraan.pdf";
    link.click();
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

  if (error || !mitra) {
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
          <p style={{ margin: "0 0 24px", color: "#888780" }}>{error || "Detail mitra tidak tersedia"}</p>
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
          <div style={{
            background: "white",
            borderRadius: 20,
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            {/* Header with Logo and Company Name */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: "#1A3A6B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#F5A623",
                fontWeight: "bold",
                fontSize: 32,
              }}>
                {mitra.name.charAt(0)}
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#1A3A6B" }}>
                  {mitra.name}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                  <span style={{
                    fontSize: 13,
                    color: "#1D9E75",
                    background: "#E8F5F0",
                    padding: "4px 12px",
                    borderRadius: 20,
                  }}>
                    {mitra.type || "Mitra Strategis"}
                  </span>
                  <span style={{ fontSize: 13, color: "#888780" }}>
                    📍 {mitra.city}, {mitra.province}
                  </span>
                </div>
              </div>
            </div>

            {/* Tentang Section */}
            <h2 style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#1A3A6B",
              margin: "0 0 16px 0",
              paddingBottom: 8,
              borderBottom: "2px solid #F5A623",
              display: "inline-block",
            }}>
              Tentang {mitra.name.split(" ")[0]}
            </h2>
            
            <p style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: "#5F5E5A",
              marginBottom: 24,
              marginTop: 16,
            }}>
              {mitra.description}
            </p>

            {/* Operational Area */}
            {mitra.operational_area && (
              <div style={{
                background: "#F0FAF6",
                borderRadius: 16,
                padding: "20px",
                marginBottom: 24,
              }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#1D9E75" }}>
                  Wilayah Operasional
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: "#5F5E5A" }}>
                  {mitra.operational_area}
                </p>
              </div>
            )}

            {/* Criteria & Benefits Section */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#1A3A6B" }}>
                Kriteria Bermitra
              </h3>
              <ul style={{ margin: "0 0 20px 0", paddingLeft: 20, color: "#5F5E5A", fontSize: 14, lineHeight: 1.8 }}>
                <li>Beroperasi minimal 12 bulan</li>
                <li>Memiliki laporan keuangan dasar</li>
                <li>Potensi skalabilitas tinggi</li>
              </ul>

              <h3 style={{ margin: "16px 0 12px", fontSize: 16, fontWeight: 700, color: "#1A3A6B" }}>
                Keuntungan Bermitra
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#5F5E5A", fontSize: 14, lineHeight: 1.8 }}>
                <li>Akses pendanaan</li>
                <li>Mentoring dari para ahli</li>
                <li>Jejaring global</li>
              </ul>
            </div>

            {/* Contact Info at bottom of left column */}
            <div style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: "1px solid #E8E7E2",
            }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1A3A6B" }}>
                Informasi Kontak
              </h3>
              {mitra.email && (
                <a
                  href={`mailto:${mitra.email}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    color: "#1A3A6B",
                    textDecoration: "none",
                    marginBottom: 12,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 7L2 7" />
                  </svg>
                  {mitra.email}
                </a>
              )}
              {mitra.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#5F5E5A" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  {mitra.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Action Card */}
        <div>
          <div style={{
            background: "white",
            borderRadius: 20,
            padding: "28px",
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

            {/* Contact Info Summary */}
            <div>
              <h3 style={{
                margin: "0 0 12px",
                fontSize: 14,
                fontWeight: 600,
                color: "#2C2C2A",
              }}>
                Informasi Kontak
              </h3>
              {mitra.email && (
                <a
                  href={`mailto:${mitra.email}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                    color: "#1A3A6B",
                    textDecoration: "none",
                    marginBottom: 12,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 7L2 7" />
                  </svg>
                  {mitra.email}
                </a>
              )}
              {mitra.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#5F5E5A" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  {mitra.phone}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnershipDetailPage;