import { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { getCurrentUser, clearAuthStorage } from "../../../shared/auth/currentUser";

type NavItem =
  | { label: string; to: string }
  | { label: string; children: { label: string; to: string }[] };

const navItems: NavItem[] = [
  { label: "Beranda Nasional", to: "/admin" },
  {
    label: "Pelatihan",
    children: [
      { label: "Dashboard", to: "/admin/training/dashboard" },
      { label: "Sertifikat", to: "/admin/training/certificates" },
      { label: "Pelatihan", to: "/admin/training/list" },
    ],
  },
  { label: "User Management", to: "/admin/registrations" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleOpen(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(label);
  }

  function handleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 200);
  }

  function isChildActive(children: { to: string }[]): boolean {
    return children.some((c) => location.pathname.startsWith(c.to));
  }

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
          {navItems.map((item) => {
            if ("children" in item) {
              const active = isChildActive(item.children);
              return (
                <div
                    key={item.label}
                    className={`navbar-dropdown ${active ? "active" : ""}`}
                    onMouseEnter={() => handleOpen(item.label)}
                    onMouseLeave={handleClose}
                  >
                    <span className="navbar-link drop-trigger">
                      {item.label} <span style={{ fontSize: 10, marginLeft: 4 }}>▼</span>
                    </span>
                    {openMenu === item.label && (
                      <div className="dropdown-menu" onMouseEnter={() => handleOpen(item.label)} onMouseLeave={handleClose}>
                        {item.children.map((child) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            className={`dropdown-item ${location.pathname === child.to ? "active" : ""}`}
                            onClick={() => setOpenMenu(null)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`navbar-link ${location.pathname === item.to ? "active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Kanan: User info */}
        <div className="navbar-right">
          <span className="navbar-username">Halo, {user?.full_name ?? "Admin"}</span>
          <div className="navbar-avatar" onClick={logout} title="Logout">
            {user?.full_name?.[0]?.toUpperCase() ?? "A"}
          </div>
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
