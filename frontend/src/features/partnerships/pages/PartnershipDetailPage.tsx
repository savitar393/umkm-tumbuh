import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { partnershipsApi } from "../api";
import type { UMKMDetail, MitraDetail } from "../api";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import PartnershipSidebar from "../components/PartnershipSidebar";

const PartnershipDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isMitra = user?.role === "MITRA";
  const basePath = isMitra ? "/mitra/partnerships" : "/umkm/partnerships";

  const [detail, setDetail] = useState<UMKMDetail | MitraDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isMitra) {
          const resp = await partnershipsApi.getUMKMDetail(id);
          if (resp.success === true && resp.data?.umkm) {
            setDetail(resp.data.umkm);
          } else {
            setError("UMKM tidak ditemukan");
          }
        } else {
          const resp = await partnershipsApi.getMitraDetail(id);
          if (resp.success === true && resp.data?.mitra) {
            setDetail(resp.data.mitra);
          } else {
            setError("Mitra tidak ditemukan");
          }
        }
      } catch {
        setError("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, isMitra]);

  const handleAjukanKemitraan = () => {
    navigate(`${basePath}/create?receiver_id=${id}`);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#F5F4F0" }}>
        <PartnershipSidebar />
        <main style={{
          marginLeft: isMitra ? 260 : 220,
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
            <p style={{ marginTop: 16, color: "#888780" }}>Memuat detail...</p>
          </div>
        </main>
      </div>
    );
  }

  // ── Error / empty state ────────────────────────────────────────────────────
  if (error || !detail) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#F5F4F0" }}>
        <PartnershipSidebar />
        <main style={{
          marginLeft: isMitra ? 260 : 220,
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
            <h3 style={{ margin: "0 0 8px", fontSize: 20, color: "#2C2C2A" }}>
              {isMitra ? "UMKM Tidak Ditemukan" : "Mitra Tidak Ditemukan"}
            </h3>
            <p style={{ margin: "0 0 24px", color: "#888780" }}>{error || "Data tidak tersedia"}</p>
            <button
              onClick={() => navigate(basePath)}
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
        </main>
      </div>
    );
  }

  // ── Detail view ────────────────────────────────────────────────────────────
  const d = detail as UMKMDetail & MitraDetail;
  const hasDescription = d.description && d.description.trim().length > 0;
  const hasProducts = d.products && d.products.trim().length > 0;
  const hasAddress = d.address && d.address.trim().length > 0;
  const hasYear = typeof d.year_established === "number" && d.year_established > 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif", background: "#F5F4F0" }}>
      <PartnershipSidebar />
      <main style={{
        marginLeft: isMitra ? 260 : 220,
        flex: 1,
        padding: "32px 40px",
        maxWidth: 1100,
        width: "100%",
        boxSizing: "border-box",
      }}>
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(basePath)}
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
            padding: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Kembali ke Daftar
        </button>

        {/* Hero Card */}
        <div style={{
          background: "white",
          borderRadius: 20,
          padding: "32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: 24,
        }}>
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
              flexShrink: 0,
            }}>
              {d.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#1A3A6B" }}>
                {d.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                {d.type && (
                  <span style={{
                    fontSize: 13,
                    color: "#1D9E75",
                    background: "#E8F5F0",
                    padding: "4px 12px",
                    borderRadius: 20,
                  }}>
                    {d.type}
                  </span>
                )}
                {(d.city || d.province) && (
                  <span style={{ fontSize: 13, color: "#888780" }}>
                    {d.city}{d.city && d.province ? ", " : ""}{d.province}
                  </span>
                )}
                {hasYear && (
                  <span style={{ fontSize: 13, color: "#888780" }}>
                    Berdiri {d.year_established}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {hasDescription && (
            <>
              <h2 style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#1A3A6B",
                margin: "0 0 16px 0",
                paddingBottom: 8,
                borderBottom: "2px solid #F5A623",
                display: "inline-block",
              }}>
                Deskripsi {isMitra ? "UMKM" : "Mitra"}
              </h2>
              <p style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: "#5F5E5A",
                marginBottom: 24,
                marginTop: 16,
                whiteSpace: "pre-wrap",
              }}>
                {d.description}
              </p>
            </>
          )}

          {/* Products */}
          {hasProducts && (
            <div style={{
              background: "#F0FAF6",
              borderRadius: 16,
              padding: "20px",
              marginBottom: 24,
            }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#1D9E75" }}>
                Produk Unggulan
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: "#5F5E5A", whiteSpace: "pre-wrap" }}>
                {d.products}
              </p>
            </div>
          )}

          {/* Address */}
          {hasAddress && (
            <div style={{
              background: "#F5F4F0",
              borderRadius: 16,
              padding: "20px",
              marginBottom: 24,
            }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#1A3A6B" }}>
                Alamat
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: "#5F5E5A" }}>
                {d.address}
              </p>
            </div>
          )}

          {/* Operational Area (Mitra only) */}
          {!isMitra && d.operational_area && d.operational_area.trim().length > 0 && (
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
                {d.operational_area}
              </p>
            </div>
          )}

          {/* Contact (Mitra only) */}
          {!isMitra && (d.email || d.phone_number) && (
            <div style={{
              background: "#FFF8E7",
              borderRadius: 16,
              padding: "20px",
              marginBottom: 24,
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#E07B30" }}>
                Kontak
              </h3>
              {d.email && (
                <p style={{ margin: "0 0 4px", fontSize: 14, color: "#5F5E5A" }}>
                  Email: {d.email}
                </p>
              )}
              {d.phone_number && (
                <p style={{ margin: 0, fontSize: 14, color: "#5F5E5A" }}>
                  Telepon: {d.phone_number}
                </p>
              )}
            </div>
          )}

          {/* Owner (UMKM only) */}
          {isMitra && d.owner_name && (
            <div style={{
              background: "#FFF8E7",
              borderRadius: 16,
              padding: "20px",
              marginBottom: 24,
            }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#E07B30" }}>
                Pemilik Usaha
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: "#5F5E5A" }}>
                {d.owner_name}
              </p>
            </div>
          )}

          {/* Ajukan Kemitraan Button */}
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
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2A5DA8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1A3A6B")}
          >
            Ajukan Kemitraan
          </button>
        </div>
      </main>
    </div>
  );
};

export default PartnershipDetailPage;
