import { Link, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { getCurrentUser, clearAuthStorage } from "../../../shared/auth/currentUser";
import type { UserRole } from "../../../shared/auth/currentUser";

type NavItem = { label: string; to: string; icon: string };

const umkmNav: NavItem[] = [
  { label: "Dashboard", to: "/umkm", icon: "📊" },
  { label: "Pelatihan Saya", to: "/umkm/trainings", icon: "🎓" },
  { label: "Kelola Informasi", to: "/umkm/profile", icon: "👤" },
  { label: "Pengajuan Kemitraan", to: "/umkm/partnerships", icon: "🤝" },
  { label: "Pengaturan", to: "/umkm/settings", icon: "⚙️" },
];

const mitraNav: NavItem[] = [
  { label: "Dashboard", to: "/mitra", icon: "📊" },
  { label: "Kelola Informasi", to: "/mitra/profile", icon: "👤" },
  { label: "Kemitraan", to: "/mitra/partnerships", icon: "🤝" },
  { label: "Notifikasi", to: "/mitra/notifications", icon: "🔔" },
  { label: "Pengaturan", to: "/mitra/settings", icon: "⚙️" },
];

type Props = {
  children: ReactNode;
  role: UserRole;
  title?: string;
  subtitle?: string;
};

export default function UserLayout({ children, role, title, subtitle }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const navItems = role === "UMKM" ? umkmNav : mitraNav;
  const brandColor = role === "UMKM" ? "#1f45b6" : "#0f766e";

  function logout() {
    clearAuthStorage();
    navigate("/login");
  }

  return (
    <div className="user-layout">
      {/* SIDEBAR */}
      <aside className="user-sidebar" style={{ background: brandColor }}>
        {/* Logo */}
        <div className="sidebar-logo">
          <img src="/tumbuh.png" alt="UMKM Tumbuh" className="sidebar-logo-img" />
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span className="sidebar-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={logout}>
            🚪 Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="user-main">
        {/* Top bar */}
        <header className="user-topbar">
          {/* Search */}
          <div className="topbar-search">
            <span className="topbar-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Cari laporan atau produk..."
              className="topbar-search-input"
            />
          </div>

          {/* Right side */}
          <div className="topbar-right">
            <button className="topbar-notif" aria-label="Notifikasi">
              🔔
            </button>
            <div className="topbar-divider" />
            <div className="topbar-user">
              <div className="topbar-user-info">
                <span className="topbar-user-name">{user?.full_name ?? "Pengguna"}</span>
                <span className="topbar-user-role">
                  {role === "UMKM" ? "Owner" : "Mitra"}
                </span>
              </div>
              <div className="topbar-avatar" onClick={logout} title="Logout">
                {user?.full_name?.[0]?.toUpperCase() ?? "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Page title area */}
        {(title || subtitle) && (
          <div className="user-page-header">
            {title && <h1 className="user-page-title">{title}</h1>}
            {subtitle && <p className="user-page-subtitle">{subtitle}</p>}
          </div>
        )}

        {/* Content */}
        <div className="user-content">
          {children}
        </div>
      </div>
    </div>
  );
}
