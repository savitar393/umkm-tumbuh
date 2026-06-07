import { useState } from "react";
import umkmLogo from "../../assets/umkm-tumbuh.webp";

// ── Types ─────────────────────────────────────────────────────
interface NavItem {
  label: string;
  icon: React.FC;
  path?: string;
}

interface SidebarProps {
  activeLabel?: string;
  onNavigate?: (label: string) => void;
}

// ── Icons ─────────────────────────────────────────────────────
function GradCapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function UserGroupIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      <path d="M16 3.13a4 4 0 010 7.75" />
      <path d="M21 21v-2a4 4 0 00-3-3.87" />
    </svg>
  );
}

function ChartBarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

function HandshakeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h3l3-3 4 6 3-3h3" />
      <rect x="2" y="8" width="4" height="8" rx="1" />
      <rect x="18" y="8" width="4" height="8" rx="1" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ── Nav Items ─────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { label: "Pelatihan Saya", icon: GradCapIcon, path: "/umkm/trainings" },
  { label: "Kelola Informasi", icon: UserGroupIcon, path: "/umkm/users" },
  { label: "Dashboard", icon: ChartBarIcon, path: "/umkm/dashboard" },
  { label: "Pengajuan Kemitraan", icon: HandshakeIcon, path: "/umkm/partnerships" },
  { label: "Pengaturan", icon: GearIcon, path: "/umkm/settings" },
];

// ── Sidebar Component ─────────────────────────────────────────
export default function Sidebar({ activeLabel, onNavigate }: SidebarProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <aside style={{
      width: 230,
      minHeight: "100vh",
      background: "linear-gradient(180deg, #1a237e 0%, #1a3a9e 60%, #1565c0 100%)",
      display: "flex",
      flexDirection: "column",
      padding: "28px 14px 24px",
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 100,
      boxShadow: "4px 0 32px rgba(21, 69, 180, 0.25)",
    }}>

      {/* ── Logo ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 36,
        paddingLeft: 4,
      }}>
        <img
          src={umkmLogo}
          alt="UMKM Tumbuh"
          style={{ width: 36, height: 36, objectFit: "contain" }}
        />
        <span style={{
          fontWeight: 800,
          fontSize: 16,
          color: "#fff",
          letterSpacing: -0.3,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          UMKM Tumbuh
        </span>
      </div>

      {/* ── Nav Items ── */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_ITEMS.map(({ label, icon: Icon }) => {
          const isActive = activeLabel === label;
          const isHovered = hovered === label;

          return (
            <button
              key={label}
              onClick={() => onNavigate?.(label)}
              onMouseEnter={() => setHovered(label)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 16px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: isActive
                  ? "linear-gradient(135deg, #f5b800, #f59e0b)"
                  : isHovered
                  ? "rgba(255,255,255,0.1)"
                  : "transparent",
                color: isActive ? "#1a237e" : "#fff",
                fontWeight: isActive ? 800 : 500,
                fontSize: 14,
                textAlign: "left",
                width: "100%",
                transition: "all 0.18s ease",
                boxShadow: isActive ? "0 4px 16px rgba(245,184,0,0.35)" : "none",
                letterSpacing: -0.1,
              }}
            >
              <span style={{
                opacity: isActive ? 1 : 0.85,
                display: "flex",
                alignItems: "center",
                color: isActive ? "#1a237e" : "#fff",
              }}>
                <Icon />
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      {/* ── Keluar ── */}
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 16px",
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          background: "transparent",
          color: "#ef5350",
          fontWeight: 600,
          fontSize: 14,
          textAlign: "left",
          width: "100%",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,83,80,0.1)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <LogoutIcon />
        Keluar
      </button>
    </aside>
  );
}