import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { getCurrentUser, clearAuthStorage } from "../../../shared/auth/currentUser";
import { logout as logoutApi } from "../../auth/api";

const trainingSubMenus = [
  { label: "Dashboard Pelatihan", to: "/admin/training" },
  { label: "Buat Pelatihan Baru", to: "/admin/training/new" },
  { label: "Evaluasi Pelatihan", to: "/admin/training/evaluation" },
  { label: "Verifikasi Sertifikat", to: "/admin/training/certificates" },
];

const userSubMenus = [
  { label: "Validasi Pendaftaran", to: "/admin/registrations" },
  { label: "Manajemen Akun", to: "/admin/users" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [openTraining, setOpenTraining] = useState(false);
  const [openUsers, setOpenUsers] = useState(false);

  const trainingRef = useRef<HTMLDivElement>(null);
  const usersRef = useRef<HTMLDivElement>(null);

  const isDashboardActive = location.pathname === "/admin";
  const isTrainingActive = location.pathname.startsWith("/admin/training");
  const isUserAreaActive =
    location.pathname.startsWith("/admin/registrations") ||
    location.pathname.startsWith("/admin/users");

  const hideSubheader = isUserAreaActive;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (trainingRef.current && !trainingRef.current.contains(target)) {
        setOpenTraining(false);
      }

      if (usersRef.current && !usersRef.current.contains(target)) {
        setOpenUsers(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function logout() {
    try {
      await logoutApi();
    } catch {
      // local logout should still continue
    } finally {
      clearAuthStorage();
      navigate("/login", { replace: true });
    }
  }

  function renderDropdown(items: { label: string; to: string }[], close: () => void) {
    return (
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          marginTop: 4,
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
          border: "1px solid #e2e8f0",
          minWidth: 220,
          overflow: "hidden",
          zIndex: 100,
        }}
      >
        {items.map((item) => {
          const active =
            location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={close}
              style={{
                display: "block",
                padding: "12px 16px",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: active ? 800 : 600,
                color: active ? "#1a3fa4" : "#334155",
                background: active ? "#eef2ff" : "transparent",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="admin-layout-v2">
      <header className="admin-navbar">
        <div className="navbar-left">
          <img src="/tumbuh.png" alt="UMKM Tumbuh" className="navbar-logo" />
        </div>

        <nav className="navbar-menu">
          <Link
            to="/admin"
            className={`navbar-link ${isDashboardActive ? "active" : ""}`}
          >
            Beranda Nasional
          </Link>

          <div ref={trainingRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => {
                setOpenTraining((value) => !value);
                setOpenUsers(false);
              }}
              className={`navbar-link ${isTrainingActive ? "active" : ""}`}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                lineHeight: "inherit",
              }}
            >
              Pelatihan
              <ChevronDown
                size={14}
                style={{
                  transition: "transform 0.2s",
                  transform: openTraining ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {openTraining && renderDropdown(trainingSubMenus, () => setOpenTraining(false))}
          </div>

          <div ref={usersRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => {
                setOpenUsers((value) => !value);
                setOpenTraining(false);
              }}
              className={`navbar-link ${isUserAreaActive ? "active" : ""}`}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                lineHeight: "inherit",
              }}
            >
              User Management
              <ChevronDown
                size={14}
                style={{
                  transition: "transform 0.2s",
                  transform: openUsers ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {openUsers && renderDropdown(userSubMenus, () => setOpenUsers(false))}
          </div>
        </nav>

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

      <main className="admin-body">
        {!hideSubheader && (
          <div className="admin-subheader">
            <div>
              <div className="subheader-title">Dashboard Strategi Nasional</div>
              <div className="subheader-sub">
                Monitoring dan analisis data UMKM di seluruh Indonesia
              </div>
            </div>
          </div>
        )}

        <div className="admin-content-v2">{children}</div>
      </main>
    </div>
  );
}
