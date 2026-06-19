import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { getCurrentUser, clearAuthStorage } from "../../../shared/auth/currentUser";

const navItems = [
  { label: "Beranda Nasional", to: "/admin" },
  { label: "User Management", to: "/admin/users" },
];

const trainingSubMenus = [
  { label: "Dashboard Pelatihan", to: "/admin/training/dashboard" },
  { label: "Daftar Pelatihan", to: "/admin/training/list" },
  { label: "Sertifikat", to: "/admin/training/certificates" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isTrainingActive = location.pathname.startsWith("/admin/training");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function logout() {
    clearAuthStorage();
    navigate("/login");
  }

  return (
    <div className="admin-layout-v2">
      {/* NAVBAR ATAS */}
      <header className="admin-navbar">
        {/* Kiri: Logo */}
        <div className="navbar-left">
          <img src="/tumbuh.png" alt="UMKM Tumbuh" className="navbar-logo" />
        </div>

        {/* Tengah: Menu navigasi */}
        <nav className="navbar-menu">
          <Link
            to={navItems[0].to}
            className={`navbar-link ${location.pathname === navItems[0].to ? "active" : ""}`}
          >
            {navItems[0].label}
          </Link>

          {/* Dropdown Pelatihan */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setOpen((p) => !p)}
              className={`navbar-link ${isTrainingActive ? "active" : ""}`}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "inherit", lineHeight: "inherit",
              }}
            >
              Pelatihan
              <ChevronDown
                size={14}
                style={{
                  transition: "transform 0.2s",
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {open && (
              <div
                style={{
                  position: "absolute", top: "100%", left: 0, marginTop: 4,
                  background: "#fff", borderRadius: 10, boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                  border: "1px solid #e2e8f0", minWidth: 200, overflow: "hidden",
                  zIndex: 100,
                }}
              >
                {trainingSubMenus.map((sub) => (
                  <Link
                    key={sub.to}
                    to={sub.to}
                    onClick={() => setOpen(false)}
                    style={{
                      display: "block", padding: "10px 16px", textDecoration: "none",
                      fontSize: 13, fontWeight: location.pathname === sub.to ? 700 : 500,
                      color: location.pathname === sub.to ? "#1a3fa4" : "#334155",
                      background: location.pathname === sub.to ? "#eef2ff" : "transparent",
                      transition: "all 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (location.pathname !== sub.to) {
                        (e.currentTarget as HTMLElement).style.background = "#f8fafc";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (location.pathname !== sub.to) {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }
                    }}
                  >
                    {sub.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to={navItems[1].to}
            className={`navbar-link ${location.pathname === navItems[1].to ? "active" : ""}`}
          >
            {navItems[1].label}
          </Link>
        </nav>

        {/* Kanan: User info */}
        <div className="navbar-right">
          <span className="navbar-username">Halo, {user?.full_name ?? "Admin"}</span>
          <div className="navbar-avatar" title={user?.full_name ?? "Admin"}>
            {user?.full_name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <button className="navbar-logout-btn" onClick={logout} title="Keluar">
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="admin-body">
        {/* Sub-header biru */}
        <div className="admin-subheader">
          <div>
            <div className="subheader-title">Dashboard Strategi Nasional</div>
            <div className="subheader-sub">Monitoring dan analisis data UMKM di seluruh Indonesia</div>
          </div>
        </div>

        {/* Konten halaman */}
        <div className="admin-content-v2">
          {children}
        </div>
      </main>
    </div>
  );
}
