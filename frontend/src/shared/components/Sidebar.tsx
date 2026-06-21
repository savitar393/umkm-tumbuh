import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  Inbox,
  ClipboardList,
  Search,
} from "lucide-react";
import { clearAuthStorage, getCurrentUser } from "../auth/currentUser";

type NavChild = {
  label: string;
  to: string;
  icon: React.ElementType;
};

type NavItem = {
  label: string;
  to: string;
  icon: React.ElementType;
  children?: NavChild[];
};

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

function getNavItems(role?: string): NavItem[] {
  if (role === "MITRA") {
    return [
      { label: "Dashboard", to: "/mitra", icon: Gauge },
      {
        label: "Kemitraan",
        to: "/mitra/partnerships",
        icon: Handshake,
        children: [
          { label: "Direktori UMKM", to: "/mitra/partnerships", icon: Search },
          { label: "Status", to: "/mitra/partnerships/status", icon: ClipboardList },
          { label: "Inbox", to: "/mitra/partnerships/inbox", icon: Inbox },
        ],
      },
      { label: "Kelola Informasi", to: "/mitra/profile", icon: Building2 },
    ];
  }

  return [
    { label: "Dashboard", to: "/umkm", icon: Gauge },
    { label: "Pelatihan Saya", to: "/umkm/trainings", icon: BookOpen },
    { label: "Kelola Informasi", to: "/umkm/profile", icon: Building2 },
    { label: "Kelola Produk", to: "/umkm/products", icon: Package },
    { label: "Catatan Transaksi", to: "/umkm/sales", icon: Receipt },
    {
      label: "Pengajuan Kemitraan",
      to: "/umkm/partnerships",
      icon: Handshake,
      children: [
        { label: "Direktori Mitra", to: "/umkm/partnerships", icon: Search },
        { label: "Status", to: "/umkm/partnerships/status", icon: ClipboardList },
        { label: "Inbox", to: "/umkm/partnerships/inbox", icon: Inbox },
      ],
    },
    { label: "Pengaturan", to: "/umkm/settings", icon: Settings },
  ];
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const role = user?.role;
  const homePath = role === "MITRA" ? "/mitra" : "/umkm";
  const navItems = getNavItems(role);

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

      <NavLink to={homePath} className="umkm-brand">
        <img src="/tumbuh.png" alt="UMKM Tumbuh" />
        {!collapsed && <span>UMKM Tumbuh</span>}
      </NavLink>

      <nav className="umkm-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isGroupActive =
            location.pathname === item.to ||
            location.pathname.startsWith(`${item.to}/`);

          return (
            <div
              key={item.to}
              className={`umkm-nav-group ${isGroupActive ? "active" : ""}`}
            >
              <NavLink
                to={item.to}
                end={item.to === homePath}
                className={({ isActive }) =>
                  `umkm-nav-link ${isActive || isGroupActive ? "active" : ""}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>

              {!collapsed && item.children && isGroupActive ? (
                <div className="umkm-nav-sublist">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        end={child.to === item.to}
                        className={({ isActive }) =>
                          `umkm-nav-sub-link ${isActive ? "active" : ""}`
                        }
                      >
                        <ChildIcon size={14} />
                        <span>{child.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              ) : null}
            </div>
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
