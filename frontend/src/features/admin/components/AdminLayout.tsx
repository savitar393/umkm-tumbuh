import { Link, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { getCurrentUser, clearAuthStorage } from "../../../shared/auth/currentUser";

const navItems = [
  { label: "Beranda Nasional", to: "/admin" },
  { label: "User Management", to: "/admin/users" },
  { label: "Pelatihan", to: "/admin/training" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();

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
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`navbar-link ${location.pathname === item.to ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
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
