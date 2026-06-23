import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  navItems: NavItem[];
  userName?: string;
  userRole?: string;
  sidebarWidth?: number;
}

const LogoUMKMTumbuh: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#F5A623" />
    <path d="M8 28 L14 16 L20 22 L26 12 L32 28 Z" fill="#1A3A6B" strokeLinejoin="round" />
    <circle cx="26" cy="12" r="3" fill="#1A3A6B" />
  </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ navItems, userName = "User", userRole = "UMKM", sidebarWidth = 260 }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === location.pathname) return true;
    if (path !== "/" && location.pathname.startsWith(path + "/")) return true;
    return false;
  };

  return (
    <aside style={{
      width: sidebarWidth,
      minWidth: sidebarWidth,
      background: "#1A3A6B",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      top: 0,
      left: 0,
      height: "100vh",
      zIndex: 100,
    }}>
      {/* Logo + Brand */}
      <div style={{ padding: "24px 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoUMKMTumbuh size={36} />
          <span style={{ color: "#F5A623", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
            UMKM<br />Tumbuh
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "16px 0" }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 20px",
                background: active ? "#F5A623" : "transparent",
                border: "none",
                borderRadius: active ? "0 20px 20px 0" : 0,
                marginRight: active ? 12 : 0,
                color: active ? "#1A3A6B" : "rgba(255,255,255,0.75)",
                fontSize: 13,
                fontWeight: active ? 700 : 400,
                cursor: "pointer",
                textAlign: "left",
                lineHeight: 1.4,
                transition: "background 0.15s, color 0.15s",
                position: "relative",
              }}
            >
              <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span style={{
                  background: active ? "#1A3A6B" : "#E24B4A",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 20,
                  minWidth: 18,
                  textAlign: "center",
                  lineHeight: "14px",
                }}>
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile + Logout */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#F5A623",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1A3A6B",
            fontWeight: "bold",
            fontSize: 14,
            flexShrink: 0,
          }}>
            {userName.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#888780" }}>{userRole}</p>
          </div>
        </div>
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

export default Sidebar;