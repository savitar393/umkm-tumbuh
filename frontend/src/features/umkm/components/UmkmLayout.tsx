import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Building2,
  Gauge,
  Handshake,
  LogOut,
  Settings,
  Bell,
  Package,
  ClipboardList,
} from "lucide-react";
import { clearAuthStorage, getCurrentUser } from "../../../shared/auth/currentUser";

type UmkmLayoutProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

const navItems = [
  { label: "Dashboard", to: "/umkm", icon: Gauge },
  { label: "Pelatihan Saya", to: "/umkm/trainings", icon: BookOpen },
  { label: "Kelola Informasi", to: "/umkm/profile", icon: Building2 },
  { label: "Kelola Produk", to: "/umkm/products", icon: Package },
  { label: "Catatan Transaksi", to: "/umkm/sales", icon: ClipboardList },
  { label: "Pengajuan Kemitraan", to: "/umkm/partnerships", icon: Handshake },
  { label: "Pengaturan", to: "/umkm/settings", icon: Settings },
];

export default function UmkmLayout({ children, title, subtitle }: UmkmLayoutProps) {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const logout = () => {
    clearAuthStorage();
    navigate("/login");
  };

  return (
    <div className="umkm-shell">
      <aside className="umkm-sidebar">
        <Link to="/umkm" className="umkm-brand">
          <img src="/tumbuh.png" alt="UMKM Tumbuh" />
        </Link>

        <nav className="umkm-nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/umkm"}
                className={({ isActive }) =>
                  `umkm-nav-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button className="umkm-logout" onClick={logout}>
          <LogOut size={18} />
          <span>Keluar</span>
        </button>
      </aside>

      <section className="umkm-main">
        <header className="umkm-topbar">
          <div>
            <div className="umkm-breadcrumb">Informasi UMKM</div>
            {title ? <h1>{title}</h1> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>

          <div className="umkm-topbar-right">
            <button className="umkm-icon-btn" type="button" aria-label="Notifikasi">
              <Bell size={18} />
            </button>

            <div className="umkm-user-chip">
              <div>
                <strong>{user?.full_name ?? "User"}</strong>
                <span>{user?.role === "UMKM" ? "Owner UMKM" : user?.role}</span>
              </div>
              <div className="umkm-avatar">
                {user?.full_name?.[0]?.toUpperCase() ?? "U"}
              </div>
            </div>
          </div>
        </header>

        <div className="umkm-content">{children}</div>
      </section>
    </div>
  );
}
