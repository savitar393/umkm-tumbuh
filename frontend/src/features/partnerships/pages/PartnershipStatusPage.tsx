import React, { useState, useEffect } from "react";
import { partnershipsApi } from "../api";
import PartnershipSidebar from "../components/PartnershipSidebar";





// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: "#FFF3CD", text: "#856404" },
  { bg: "#D1ECF1", text: "#0C5460" },
  { bg: "#F8D7DA", text: "#721C24" },
  { bg: "#D4EDDA", text: "#155724" },
  { bg: "#E2D9F3", text: "#432874" },
  { bg: "#FDEBD0", text: "#784212" },
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT:              { label: "Draft",               bg: "#F3F4F6", text: "#4B5563" },
  DIAJUKAN:           { label: "DIAJUKAN",            bg: "#FEF3CD", text: "#856404" },
  SUBMITTED:          { label: "DIAJUKAN",            bg: "#FEF3CD", text: "#856404" },
  DITINJAU:           { label: "DITINJAU",            bg: "#FFF3E0", text: "#E65100" },
  REVIEWED:           { label: "DITINJAU",            bg: "#FFF3E0", text: "#E65100" },
  MENUNGGU_DOKUMEN_TTD: { label: "MENUNGGU DOKUMEN",  bg: "#FEF3CD", text: "#92400E" },
  WAITING_DOCUMENT:   { label: "MENUNGGU DOKUMEN",    bg: "#FEF3CD", text: "#92400E" },
  AKTIF:              { label: "AKTIF",               bg: "#D1FAE5", text: "#065F46" },
  ACTIVE:             { label: "AKTIF",               bg: "#D1FAE5", text: "#065F46" },
  DITOLAK:            { label: "DITOLAK",             bg: "#FEE2E2", text: "#B91C1C" },
  REJECTED:           { label: "DITOLAK",             bg: "#FEE2E2", text: "#B91C1C" },
  SELESAI:            { label: "SELESAI",             bg: "#E0E7FF", text: "#3730A3" },
  COMPLETED:          { label: "SELESAI",             bg: "#E0E7FF", text: "#3730A3" },
  DIBATALKAN:         { label: "DIBATALKAN",          bg: "#F3F4F6", text: "#4B5563" },
  CANCELLED:          { label: "DIBATALKAN",          bg: "#F3F4F6", text: "#4B5563" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: "#F1EFE8", text: "#5F5E5A" };
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 12px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: cfg.bg,
      color: cfg.text,
      letterSpacing: 0.4,
    }}>
      {cfg.label}
    </span>
  );
}



const TopBar: React.FC = () => {
  return null; // placeholder
};

const PartnershipStatusPage: React.FC = () => {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ bermitra: number; menunggu: number; ditolak: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchSummary = async () => {
    try {
      const response = await partnershipsApi.getSummary();
      if (response.success === true && response.data?.summary) {
        setSummary(response.data.summary);
      }
    } catch {
      // summary is optional fallback
    }
  };

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await partnershipsApi.getStatus({ 
        page: currentPage, 
        limit: itemsPerPage,
        status: statusFilter || undefined,
      });
      if (response.success === true) {
        setStatusData(response.data);
      } else {
        setError(response.message || "Gagal memuat data");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
      setStatusData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => { fetchStatus(); }, [currentPage, itemsPerPage, statusFilter]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  const allItems: any[] = statusData?.pengajuan ?? [];

  const filtered = allItems.filter((item) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return item.mitraUmkmTujuan.toLowerCase().includes(q) || item.pengajuanID.toLowerCase().includes(q);
  });

  const totalPages = statusData?.pagination?.totalPages ?? 1;
  const pageItems = filtered;

  const stats = summary || {
    bermitra: 0,
    menunggu: 0,
    ditolak: 0,
  };

  const cardBase: React.CSSProperties = {
    background: "white",
    borderRadius: 12,
    padding: "20px 24px",
    border: "1px solid #E8E7E2",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  };

  const iconBox = (bg: string): React.CSSProperties => ({
    width: 36,
    height: 36,
    borderRadius: 8,
    background: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  });

  // Pagination range helper
  const pageRange = () => {
    const pages: (number | "…")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("…");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("…");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", position: "relative" }}>
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundImage: "url(/background.png)", backgroundSize: "cover", backgroundPosition: "center", zIndex: 0, opacity: 0.7 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", width: "100%" }}>
      <PartnershipSidebar />

      <main style={{ marginLeft: 260, flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar />

        <div style={{ padding: "32px 36px" }}>
          {/* Page title */}
          <h1 style={{ margin: "0 0 28px", fontSize: 28, fontWeight: 700, color: "#1A3A6B" }}>
            Status Pengajuan
          </h1>

          {/* ── Stats row ─────────────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>

            {/* Bermitra */}
            <div style={{ ...cardBase, borderLeft: "4px solid #1D9E75" }}>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#888780", letterSpacing: 0.5 }}>Bermitra</p>
                <p style={{ margin: "0 0 6px", fontSize: 32, fontWeight: 700, color: "#2C2C2A", lineHeight: 1 }}>{stats.bermitra}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#1D9E75", display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  +2 Bulan ini
                </p>
              </div>
              <div style={iconBox("#D4EDDA")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#155724" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>

            {/* Menunggu */}
            <div style={{ ...cardBase, borderLeft: "4px solid #F5A623" }}>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#888780", letterSpacing: 0.5 }}>Menunggu</p>
                <p style={{ margin: "0 0 6px", fontSize: 32, fontWeight: 700, color: "#2C2C2A", lineHeight: 1 }}>{stats.menunggu}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#856404" }}>Memerlukan verifikasi lanjutan</p>
              </div>
              <div style={iconBox("#FFF3CD")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#856404" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>

            {/* Ditolak */}
            <div style={{ ...cardBase, borderLeft: "4px solid #E24B4A" }}>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#888780", letterSpacing: 0.5 }}>Ditolak</p>
                <p style={{ margin: "0 0 6px", fontSize: 32, fontWeight: 700, color: "#2C2C2A", lineHeight: 1 }}>{stats.ditolak}</p>
              </div>
              <div style={iconBox("#F8D7DA")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#721C24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
            </div>

            {/* Growth Pulse */}
            <div style={{
              background: "#1A3A6B",
              borderRadius: 12,
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1 }}>GROWTH PULSE</p>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
              <div>
                <p style={{ margin: "10px 0 4px", fontSize: 30, fontWeight: 700, color: "white", lineHeight: 1 }}>24.8%</p>
                <p style={{ margin: "0 0 12px", fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                  Peningkatan efisiensi pengajuan kemitraan baru.
                </p>
                <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ width: "24.8%", height: "100%", background: "#F5A623", borderRadius: 4 }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Search + Filter ───────────────────────────────────────────── */}
          <div style={{
            background: "white",
            borderRadius: 14,
            border: "1px solid #E8E7E2",
            overflow: "hidden",
          }}>
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #F1EFE8" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#B4B2A9" }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari nama mitra atau ID pengajuan..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  style={{
                    width: "100%",
                    padding: "9px 14px 9px 36px",
                    border: "1px solid #E8E7E2",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                    color: "#2C2C2A",
                    background: "#FAFAF8",
                  }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                style={{
                  padding: "9px 14px",
                  border: "1px solid #D3D1C7",
                  borderRadius: 8,
                  fontSize: 13,
                  color: statusFilter ? "#2C2C2A" : "#888780",
                  background: "white",
                  cursor: "pointer",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                <option value="">Semua Status</option>
                <option value="DIAJUKAN">Diajukan</option>
                <option value="DITINJAU">Ditinjau</option>
                <option value="MENUNGGU_DOKUMEN_TTD">Menunggu Dokumen</option>
                <option value="AKTIF">Aktif</option>
                <option value="SELESAI">Selesai</option>
                <option value="DITOLAK">Ditolak</option>
                <option value="DIBATALKAN">Dibatalkan</option>
              </select>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{
                  padding: "9px 10px",
                  border: "1px solid #D3D1C7",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#2C2C2A",
                  background: "white",
                  cursor: "pointer",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* ── Table ─────────────────────────────────────────────────────── */}
            {loading ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: "#888780" }}>
                <div style={{
                  display: "inline-block", width: 28, height: 28, borderRadius: "50%",
                  border: "3px solid #E8E7E2", borderTopColor: "#1A3A6B",
                  animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ marginTop: 12, fontSize: 13 }}>Memuat data status...</p>
              </div>
            ) : error ? (
              <div style={{ padding: "48px 20px", textAlign: "center" }}>
                <p style={{ color: "#E24B4A", fontSize: 14, margin: "0 0 16px" }}>{error}</p>
                <button
                  onClick={fetchStatus}
                  style={{
                    padding: "8px 20px",
                    background: "#1A3A6B",
                    border: "none",
                    borderRadius: 8,
                    color: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Coba Lagi
                </button>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FAFAF8" }}>
                    {["MITRA UMKM", "ID PENGAJUAN", "TANGGAL", "STATUS"].map((h) => (
                      <th key={h} style={{
                        padding: "11px 20px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#888780",
                        letterSpacing: 0.8,
                        borderBottom: "1px solid #F1EFE8",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "40px 20px", textAlign: "center", color: "#888780", fontSize: 14 }}>
                        Tidak ada pengajuan ditemukan.
                      </td>
                    </tr>
                  ) : pageItems.map((item: any, idx: number) => {
                    const av = avatarColor(item.mitraUmkmTujuan);
                    return (
                      <tr key={item.pengajuanID} style={{
                        borderBottom: idx < pageItems.length - 1 ? "1px solid #F5F4F0" : "none",
                        transition: "background 0.1s",
                      }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAF8")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* Mitra UMKM */}
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: 10,
                              background: av.bg, color: av.text,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 13, fontWeight: 700, flexShrink: 0,
                            }}>
                              {initials(item.mitraUmkmTujuan)}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#2C2C2A" }}>
                                {item.mitraUmkmTujuan}
                              </p>
                              <p style={{ margin: 0, fontSize: 12, color: "#888780" }}>
                                {item.proposalTitle || item.category || "Produk"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* ID */}
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ fontSize: 13, color: "#5F5E5A", fontFamily: "monospace" }}>
                            #{item.pengajuanID}
                          </span>
                        </td>

                        {/* Tanggal */}
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ fontSize: 13, color: "#888780" }}>{formatDate(item.tanggalPengajuan)}</span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "14px 20px" }}>
                          <StatusBadge status={item.statusPengajuan} />
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* ── Pagination ────────────────────────────────────────────────── */}
            {!loading && totalPages > 0 && (
              <div style={{
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid #F1EFE8",
              }}>
                <p style={{ margin: 0, fontSize: 12, color: "#888780" }}>
                  Menampilkan {Math.min(currentPage * itemsPerPage, statusData?.pagination?.total ?? filtered.length)} dari {statusData?.pagination?.total ?? filtered.length} pengajuan
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {/* Prev */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: "1px solid #E8E7E2",
                      background: "white", cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      opacity: currentPage === 1 ? 0.4 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#5F5E5A",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  {pageRange().map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} style={{ width: 32, textAlign: "center", fontSize: 13, color: "#888780" }}>…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          border: currentPage === p ? "none" : "1px solid #E8E7E2",
                          background: currentPage === p ? "#1A3A6B" : "white",
                          color: currentPage === p ? "white" : "#5F5E5A",
                          fontSize: 13, fontWeight: currentPage === p ? 700 : 400,
                          cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {p}
                      </button>
                    )
                  )}

                  {/* Next */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: "1px solid #E8E7E2",
                      background: "white", cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      opacity: currentPage === totalPages ? 0.4 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#5F5E5A",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
    </div>
  );
};

export default PartnershipStatusPage;
