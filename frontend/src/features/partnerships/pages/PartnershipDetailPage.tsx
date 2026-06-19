import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { partnershipsApi } from "../api";
import type { PartnershipRequest } from "../types";
import PartnershipSidebar from "../components/PartnershipSidebar";

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
  const user = getCurrentUser();
  const isMitra = user?.role === "MITRA";
  const basePath = isMitra ? "/mitra/partnerships" : "/umkm/partnerships";

  const [detail, setDetail] = useState<UMKMDetail | MitraDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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


  const handleDownloadTemplate = () => {
    setShowDownloadAlert(true);
    setTimeout(() => setShowDownloadAlert(false), 3000);
    // In production: window.open('/template/pengajuan-kemitraan.pdf', '_blank');
  };

  const handleAjukanKemitraan = () => {
    navigate(`${basePath}/create?receiver_id=${id}`);
  };

  const downloadTemplate = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Template Pengajuan Kemitraan UMKM Tumbuh</title>
<style>
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; margin: 2.5cm; line-height: 1.5; }
  h1 { text-align: center; font-size: 16pt; margin-bottom: 30pt; }
  h2 { font-size: 14pt; margin-top: 20pt; }
  table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
  td { padding: 6pt 10pt; border: 1px solid #000; vertical-align: top; }
  .label { font-weight: bold; width: 35%; }
  .field { min-height: 20pt; color: #888; }
  ol { margin-top: 0; }
</style>
</head>
<body>

<h1>SURAT PENGAJUAN KEMITRAAN<br>UMKM Tumbuh</h1>

<table>
  <tr><td class="label">Nama Usaha</td><td class="field">............................</td></tr>
  <tr><td class="label">Nama Pemilik</td><td class="field">............................</td></tr>
  <tr><td class="label">Jenis Usaha</td><td class="field">............................</td></tr>
  <tr><td class="label">Alamat</td><td class="field">............................</td></tr>
  <tr><td class="label">Kota/Kabupaten</td><td class="field">............................</td></tr>
  <tr><td class="label">Provinsi</td><td class="field">............................</td></tr>
  <tr><td class="label">No. Telepon/WhatsApp</td><td class="field">............................</td></tr>
  <tr><td class="label">Email</td><td class="field">............................</td></tr>
  <tr><td class="label">Tahun Berdiri</td><td class="field">............................</td></tr>
  <tr><td class="label">NIB (jika ada)</td><td class="field">............................</td></tr>
</table>

<h2>Deskripsi Usaha</h2>
<p>............................<br>............................<br>............................</p>

<h2>Produk Unggulan</h2>
<ol>
  <li>............................</li>
  <li>............................</li>
  <li>............................</li>
</ol>

<h2>Alasan Bermitra</h2>
<p>............................<br>............................<br>............................</p>

<h2>Bentuk Dukungan yang Diharapkan</h2>
<p>............................<br>............................<br>............................</p>

<br><br>
<table>
  <tr>
    <td style="border: none; width: 50%; text-align: center;">
      <br><br><br>
      (............................)<br>
      <em>Tanda Tangan &amp; Nama Lengkap</em>
    </td>
    <td style="border: none; width: 50%; text-align: center;">
      <br><br><br>
      (............................)<br>
      <em>Tanggal</em>
    </td>
  </tr>
</table>

</body>
</html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Template_Pengajuan_Kemitraan.doc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const d = detail as UMKMDetail & MitraDetail;
  const hasDescription = d?.description && d.description.trim().length > 0;
  const hasYear = typeof d?.year_established === "number" && d.year_established > 0;
  const bgLayers = (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundImage: "url(/background.png)", backgroundSize: "cover", backgroundPosition: "center", zIndex: 0, opacity: 0.7 }} />
  );

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
        {bgLayers}
        <div style={{ position: "relative", zIndex: 1, display: "flex", width: "100%" }}>
          <PartnershipSidebar />
          <main style={{ marginLeft: 260, flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "inline-block", width: 40, height: 40, borderRadius: "50%", border: "3px solid #E8E7E2", borderTopColor: "#1A3A6B", animation: "spin 0.8s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ marginTop: 16, color: "#888780" }}>Memuat detail...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
        {bgLayers}
        <div style={{ position: "relative", zIndex: 1, display: "flex", width: "100%" }}>
          <PartnershipSidebar />
          <main style={{ marginLeft: 260, flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", borderRadius: 16, padding: "40px", textAlign: "center", maxWidth: 400 }}>
              <div style={{ width: 64, height: 64, background: "#FEF2F2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 20, color: "#2C2C2A" }}>{isMitra ? "UMKM Tidak Ditemukan" : "Mitra Tidak Ditemukan"}</h3>
              <p style={{ margin: "0 0 24px", color: "#888780" }}>{error || "Data tidak tersedia"}</p>
              <button onClick={() => navigate(basePath)} style={{ padding: "10px 24px", background: "#1A3A6B", border: "none", borderRadius: 8, color: "white", cursor: "pointer" }}>Kembali</button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif", position: "relative" }}>
      {bgLayers}
      <div style={{ position: "relative", zIndex: 1, display: "flex", width: "100%" }}>
        <PartnershipSidebar />
        <main style={{ marginLeft: 260, flex: 1, display: "flex", justifyContent: "center", padding: "32px 40px", boxSizing: "border-box" }}>
          <div style={{ width: "100%", maxWidth: 1400 }}>

            {/* Breadcrumb */}
            <button onClick={() => navigate(basePath)}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#1A3A6B", cursor: "pointer", marginBottom: 24, fontSize: 14, padding: "6px 12px", whiteSpace: "nowrap", borderRadius: 8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              Kembali ke Daftar
            </button>

            {/* Two-column layout */}
            <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>

              {/* ── LEFT COLUMN: Profile ─────────────────────────────────────────── */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", padding: 32 }}>
                  {/* Avatar + Name Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 20, background: "#1A3A6B", display: "flex", alignItems: "center", justifyContent: "center", color: "#F5A623", fontWeight: "bold", fontSize: 32, flexShrink: 0 }}>
                      {d.name.charAt(0)}
                    </div>
                    <div>
                      <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 700, color: "#1A3A6B" }}>{d.name}</h1>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        {d.type && <span style={{ fontSize: 12, color: "#1D9E75", background: "#E8F5F0", padding: "3px 12px", borderRadius: 20, fontWeight: 600 }}>{d.type}</span>}
                        {(d.city || d.province) && <span style={{ fontSize: 13, color: "#888780" }}>{d.city}{d.city && d.province ? `, ${d.province}` : d.province}</span>}
                        {hasYear && <span style={{ fontSize: 13, color: "#888780" }}>• Berdiri {d.year_established}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {hasDescription && (
                    <>
                      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A3A6B", margin: "0 0 12px", paddingBottom: 8, borderBottom: "2px solid #F5A623", display: "inline-block" }}>
                        Deskripsi {isMitra ? "UMKM" : "Mitra"}
                      </h2>
                      <p style={{ fontSize: 14, lineHeight: 1.7, color: "#5F5E5A", margin: "0 0 20px", whiteSpace: "pre-wrap" }}>{d.description}</p>
                    </>
                  )}


                </div>
              </div>

              {/* ── RIGHT COLUMN: Action Card ──────────────────────────────────── */}
              <div style={{ width: 340, flexShrink: 0 }}>
                <div style={{
                  background: "white",
                  borderRadius: 16,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                  border: "1px solid #E8E7E2"
                }}>
                  {/* Header */}
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid #E8E7E2", textAlign: "center", background: "#FAFAF8" }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1A3A6B" }}>Ajukan Kemitraan</h3>
                  </div>

                  {/* Download Template */}
                  <div style={{ padding: "16px 24px", borderBottom: "1px solid #E8E7E2" }}>
                    <button
                      onClick={downloadTemplate}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        color: "#1A3A6B",
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                        cursor: "pointer",
                        padding: "10px 14px",
                        borderRadius: 8,
                        background: "#F5F4F0",
                        border: "none",
                        transition: "all 0.2s",
                        justifyContent: "center"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#EDEBE4"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#F5F4F0"; }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download Template Pengajuan
                    </button>
                  </div>

                  {/* Informasi Kemitraan */}
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid #E8E7E2" }}>
                    <h4 style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 700, color: "#888780", letterSpacing: 0.5, textTransform: "uppercase" }}>
                      Informasi Kemitraan
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#888780" }}>Jenis</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2A" }}>{d.type || "-"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#888780" }}>Lokasi</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2A", textAlign: "right" }}>
                          {d.city || "-"}{d.city && d.province ? `, ${d.province}` : d.province ? d.province : ""}
                        </span>
                      </div>
                      {hasYear && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, color: "#888780" }}>Berdiri</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2C2A" }}>{d.year_established}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#888780" }}>Status</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1D9E75", background: "#E8F5F0", padding: "2px 10px", borderRadius: 12 }}>Terverifikasi</span>
                      </div>
                    </div>
                  </div>



                  {/* Ajukan Button */}
                  <div style={{ padding: "16px 24px 20px" }}>
                    <button
                      onClick={handleAjukanKemitraan}
                      style={{
                        width: "100%",
                        padding: "14px 0",
                        background: "#1D9E75",
                        border: "none",
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 600,
                        color: "white",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: "0 4px 14px rgba(29, 158, 117, 0.3)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#0F6E56";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(29, 158, 117, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#1D9E75";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 14px rgba(29, 158, 117, 0.3)";
                      }}
                    >
                      Ajukan Kemitraan
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PartnershipDetailPage;