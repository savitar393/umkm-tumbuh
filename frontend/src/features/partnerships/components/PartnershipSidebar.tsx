import { NavLink, useNavigate } from "react-router-dom";
import {
  Gauge,
  Users,
  Handshake,
  ClipboardList,
  Bell,
  LogOut,
} from "lucide-react";
import { clearAuthStorage, getCurrentUser } from "../../../shared/auth/currentUser";

export default function PartnershipSidebar() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isMitra = user?.role === "MITRA";
  const base = isMitra ? "/mitra/partnerships" : "/umkm/partnerships";
  const dashPath = isMitra ? "/mitra" : "/umkm";

  const navItems = [
    { label: "Dashboard", to: dashPath, icon: Gauge },
    { label: isMitra ? "Cari UMKM" : "Temukan Mitra", to: base, icon: Users },
    { label: "Ajukan Kemitraan", to: `${base}/create`, icon: Handshake },
    { label: "Status Pengajuan", to: `${base}/status`, icon: ClipboardList },
    { label: "Notifikasi", to: `${base}/incoming`, icon: Bell },
  ];

  function logout() {
    clearAuthStorage();
    navigate("/login");
  }

  return (
    <aside className="umkm-sidebar">
      <NavLink to="/umkm" className="umkm-brand">
        <img src="/tumbuh.png" alt="UMKM Tumbuh" />
        <span>UMKM Tumbuh</span>
      </NavLink>

      <nav className="umkm-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === base || item.to === dashPath}
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

      <div className="umkm-sidebar-spacer" />

      <button className="umkm-logout" onClick={logout}>
        <LogOut size={18} />
        <span>Keluar</span>
      </button>
    </aside>
  );
}
