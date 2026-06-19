import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "../../../shared/auth/currentUser";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const PartnershipSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const isMitra = user?.role === "MITRA";
  const base = isMitra ? "/mitra/partnerships" : "/umkm/partnerships";
  const dashPath = isMitra ? "/mitra" : "/umkm";

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      path: dashPath,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      label: isMitra ? "Cari UMKM" : "Temukan Mitra",
      path: base,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
    {
      label: "Ajukan Kemitraan",
      path: `${base}/create`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      label: "Status Pengajuan",
      path: `${base}/status`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      label: "Notifikasi",
      path: `${base}/incoming`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      ),
    },
  ];

  return (
    <aside style={{
      width: 260,
      minWidth: 260,
      background: "#1A3A6B",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      top: 0,
      left: 0,
      height: "100vh",
      zIndex: 100,
    }}>
      <div style={{ padding: "28px 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="logo" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <span style={{ color: "#F5A623", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
            UMKM<br />Tumbuh
          </span>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "12px 0" }}>
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path + "/"));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "12px 20px",
                background: isActive ? "rgba(245, 166, 35, 0.15)" : "transparent",
                border: "none",
                borderRight: isActive ? "3px solid #F5A623" : "3px solid transparent",
                color: isActive ? "#F5A623" : "rgba(255,255,255,0.7)",
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button
          onClick={() => navigate("/login")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            color: "#E24B4A",
            fontSize: 13,
            cursor: "pointer",
            padding: "4px 0",
            width: "100%",
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

export default PartnershipSidebar;
