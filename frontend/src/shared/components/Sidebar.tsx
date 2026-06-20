import { NavLink, useNavigate } from "react-router-dom";
import {
  Gauge,
  BookOpen,
  Building2,
  Package,
  Receipt,
  Handshake,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { clearAuthStorage } from "../auth/currentUser";

const navItems = [
  { label: "Dashboard", to: "/umkm", icon: Gauge },
  { label: "Pelatihan Saya", to: "/umkm/trainings", icon: BookOpen },
  { label: "Kelola Informasi", to: "/umkm/profile", icon: Building2 },
  { label: "Kelola Produk", to: "/umkm/products", icon: Package },
  { label: "Catatan Transaksi", to: "/umkm/sales", icon: Receipt },
  { label: "Pengajuan Kemitraan", to: "/umkm/partnerships", icon: Handshake },
  { label: "Pengaturan", to: "/umkm/settings", icon: Settings },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();

  function logout() {
    clearAuthStorage();
    navigate("/login");
  }

  return (
    <aside className={`umkm-sidebar ${collapsed ? "collapsed" : ""}`}>
      <button
        className="umkm-sidebar-toggle"
        onClick={onToggle}
        aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <NavLink to="/umkm" className="umkm-brand">
        <img src="/tumbuh.png" alt="UMKM Tumbuh" />
        {!collapsed && <span>UMKM Tumbuh</span>}
      </NavLink>

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
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="umkm-sidebar-spacer" />

      <button className="umkm-logout" onClick={logout}>
        <LogOut size={18} />
        {!collapsed && <span>Keluar</span>}
      </button>
    </aside>
  );
}
