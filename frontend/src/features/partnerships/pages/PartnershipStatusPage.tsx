import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { partnershipsApi } from "../api";

// ─── Logo components ──────────────────────────────────────────────────────────

const LogoUMKMTumbuh: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#F5A623" />
    <path d="M8 28 L14 16 L20 22 L26 12 L32 28 Z" fill="#1A3A6B" strokeLinejoin="round" />
    <circle cx="26" cy="12" r="3" fill="#1A3A6B" />
  </svg>
);

// const LogoKementrian: React.FC<{ size?: number }> = ({ size = 34 }) => (
//   <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <circle cx="18" cy="18" r="17" stroke="white" strokeWidth="1.5" fill="none" />
//     <path d="M18 6 L20 13 L27 13 L21.5 17.5 L23.5 24.5 L18 20 L12.5 24.5 L14.5 17.5 L9 13 L16 13 Z" fill="white" />
//     <text x="18" y="32" textAnchor="middle" fill="white" fontSize="5" fontFamily="serif" fontWeight="bold">KEMENKOP</text>
//   </svg>
// );

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
  DRAFT:            { label: "Draft",            bg: "#F1EFE8", text: "#5F5E5A" },
  SUBMITTED:        { label: "MENUNGGU",         bg: "#FFF3CD", text: "#856404" },
  REVIEWED:         { label: "DITINJAU",         bg: "#D1ECF1", text: "#0C5460" },
  APPROVED:         { label: "DISETUJUI",        bg: "#D4EDDA", text: "#155724" },
  REJECTED:         { label: "DITOLAK",          bg: "#F8D7DA", text: "#721C24" },
  ACTIVE:           { label: "BERMITRA",         bg: "#D4EDDA", text: "#155724" },
  COMPLETED:        { label: "SELESAI",          bg: "#E2D9F3", text: "#432874" },
  CANCELLED:        { label: "DIBATALKAN",       bg: "#F1EFE8", text: "#5F5E5A" },
  WAITING_DOCUMENT: { label: "MENUNGGU DOKUMEN", bg: "#FDEBD0", text: "#784212" },
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    label: "Monitoring Perkembangan Usaha",
    path: "/dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    label: "Pengajuan Kemitraan",
    path: "/partnerships/status",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    label: "Kelola Informasi UMKM",
    path: "/umkm",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
  },
];

const Sidebar: React.FC<{ activePath: string }> = ({ activePath }) => {
  const navigate = useNavigate();
  const [dotsOpen, setDotsOpen] = useState(false);
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dotsRef.current && !dotsRef.current.contains(e.target as Node)) {
        setDotsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <aside style={{
      width: 200,
      minWidth: 200,
      background: "#1A3A6B",
      display: "flex",
      flexDirection: "column",
      padding: "24px 0",
      position: "fixed",
      top: 0,
      left: 0,
      height: "100vh",
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoUMKMTumbuh size={36} />
          <span style={{ color: "#F5A623", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
            UMKM<br />Tumbuh
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 0" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activePath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                width: "100%",
                padding: "10px 20px",
                background: isActive ? "#F5A623" : "transparent",
                border: "none",
                borderRadius: isActive ? "0 20px 20px 0" : 0,
                color: isActive ? "#1A3A6B" : "rgba(255,255,255,0.75)",
                fontSize: 13,
                fontWeight: isActive ? 700 : 400,
                cursor: "pointer",
                textAlign: "left",
                lineHeight: 1.4,
                transition: "background 0.15s, color 0.15s",
                paddingRight: isActive ? 12 : 20,
              }}
            >
              <span style={{ marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Three-dot menu (hover/click to reveal extra actions) */}
      <div ref={dotsRef} style={{ padding: "0 20px 12px", position: "relative" }}>
        <button
          onClick={() => setDotsOpen((p) => !p)}
          onMouseEnter={() => setDotsOpen(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.5)",
            padding: "6px 4px",
            borderRadius: 6,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            transition: "color 0.15s",
          }}
          aria-label="More options"
        >
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              display: "block",
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "currentColor",
            }} />
          ))}
        </button>

        {/* Popup panel */}
        {dotsOpen && (
          <div
            onMouseLeave={() => setDotsOpen(false)}
            style={{
              position: "absolute",
              bottom: "100%",
              left: 16,
              background: "white",
              borderRadius: 10,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              padding: "8px 0",
              minWidth: 160,
              zIndex: 200,
            }}
          >
            {[
              { label: "Pengaturan Akun", icon: "⚙️" },
              { label: "Bantuan & FAQ", icon: "❓" },
              { label: "Hubungi Support", icon: "💬" },
            ].map((opt) => (
              <button
                key={opt.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "9px 16px",
                  background: "none",
                  border: "none",
                  fontSize: 13,
                  color: "#2C2C2A",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F4F0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
            <div style={{ margin: "6px 0", borderTop: "1px solid #E8E7E2" }} />
            <button
              onClick={() => navigate("/logout")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 16px",
                background: "none",
                border: "none",
                fontSize: 13,
                color: "#E24B4A",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Keluar
            </button>
          </div>
        )}
      </div>

      {/* Keluar at bottom */}
      <div style={{ padding: "0 20px 16px", borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 12 }}>
        <button
          onClick={() => navigate("/logout")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            color: "#E24B4A",
            fontSize: 13,
            cursor: "pointer",
            padding: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Keluar
        </button>
      </div>
    </aside>
  );
};

// ─── Top Bar ──────────────────────────────────────────────────────────────────

const TopBar: React.FC = () => (
  <header style={{
    background: "white",
    borderBottom: "1px solid #E8E7E2",
    padding: "0 32px",
    height: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 16,
    position: "sticky",
    top: 0,
    zIndex: 50,
  }}>
    <button style={{ background: "none", border: "none", cursor: "pointer", color: "#888780", padding: 4 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    </button>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ textAlign: "right" }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1A7A5E" }}>Nusantara Ventures</p>
        <p style={{ margin: 0, fontSize: 11, color: "#888780" }}>MITRA</p>
      </div>
      {/* logo.png from components folder */}
      <img
        src="/src/features/partnerships/components/logo.png"
        alt="Nusantara Ventures"
        style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }}
        onError={(e) => {
          const t = e.currentTarget;
          t.style.display = "none";
          const fallback = t.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      {/* Fallback if image fails */}
      <div style={{
        display: "none",
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "#1A7A5E",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        color: "white",
      }}>N</div>
    </div>
  </header>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const MOCK_DATA = [
  { pengajuanID: "REQ-2024-089", statusPengajuan: "ACTIVE",     tanggalPengajuan: "2024-10-12", mitraUmkmTujuan: "Warisan Kopi Nusantara", proposalTitle: "Produk Minuman" },
  { pengajuanID: "REQ-2024-092", statusPengajuan: "SUBMITTED",  tanggalPengajuan: "2024-10-15", mitraUmkmTujuan: "Tanah Liat Studio",      proposalTitle: "Kerajinan Tangan" },
  { pengajuanID: "REQ-2024-081", statusPengajuan: "REJECTED",   tanggalPengajuan: "2024-10-08", mitraUmkmTujuan: "Sari Jamu Tradisional",  proposalTitle: "Kesehatan" },
  { pengajuanID: "REQ-2024-095", statusPengajuan: "SUBMITTED",  tanggalPengajuan: "2024-10-18", mitraUmkmTujuan: "Batik Srawung",          proposalTitle: "Fashion & Tekstil" },
];

const PartnershipStatusPage: React.FC = () => {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await partnershipsApi.getStatus({ page: 1, limit: 50 });
      if (response.status === "success") {
        setStatusData(response.data);
      } else {
        setStatusData({ pengajuan: MOCK_DATA, pagination: { total: 19, totalPages: 2 } });
      }
    } catch {
      setStatusData({ pengajuan: MOCK_DATA, pagination: { total: 19, totalPages: 2 } });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  const allItems: any[] = statusData?.pengajuan ?? [];

  const filtered = allItems.filter((item) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return item.mitraUmkmTujuan.toLowerCase().includes(q) || item.pengajuanID.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil((statusData?.pagination?.total ?? filtered.length) / itemsPerPage);
  const pageItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    bermitra: allItems.filter((p) => p.statusPengajuan === "APPROVED" || p.statusPengajuan === "ACTIVE").length,
    menunggu: allItems.filter((p) => p.statusPengajuan === "SUBMITTED" || p.statusPengajuan === "REVIEWED").length,
    ditolak:  allItems.filter((p) => p.statusPengajuan === "REJECTED").length,
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
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#F5F4F0" }}>
      <Sidebar activePath="/partnerships/status" />

      <main style={{ marginLeft: 200, flex: 1, display: "flex", flexDirection: "column" }}>
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
                <button style={{ background: "none", border: "none", padding: 0, fontSize: 12, color: "#E24B4A", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                  Lihat Alasan
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
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
              {[
                { label: "Filter", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> },
                { label: "Export", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
              ].map((btn) => (
                <button key={btn.label} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 16px", background: "white", border: "1px solid #D3D1C7",
                  borderRadius: 8, fontSize: 13, color: "#5F5E5A", cursor: "pointer", fontWeight: 500,
                }}>
                  {btn.icon}{btn.label}
                </button>
              ))}
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
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FAFAF8" }}>
                    {["MITRA UMKM", "ID PENGAJUAN", "TANGGAL", "STATUS", "AKSI"].map((h, i) => (
                      <th key={h} style={{
                        padding: "11px 20px",
                        textAlign: i === 4 ? "right" : "left",
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
                      <td colSpan={5} style={{ padding: "40px 20px", textAlign: "center", color: "#888780", fontSize: 14 }}>
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

                        {/* Aksi */}
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <Link
                            to={`/partnerships/${item.pengajuanID}`}
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#1A3A6B",
                              textDecoration: "none",
                              padding: "5px 14px",
                              border: "1px solid #B5D4F4",
                              borderRadius: 6,
                              background: "#E6F1FB",
                              transition: "background 0.1s",
                            }}
                          >
                            Detail
                          </Link>
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
                  Menampilkan {pageItems.length} dari {statusData?.pagination?.total ?? filtered.length} pengajuan
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
  );
};

export default PartnershipStatusPage;