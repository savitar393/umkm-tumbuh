import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import logoImg from "../../assets/umkm-tumbuh.webp";
import { getCurrentUser, clearAuthStorage } from "../../shared/auth/currentUser";

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const navLinks = [
  { label: "Beranda", to: "/" },
  { label: "Tentang Kami", to: "/tentang" },
  { label: "Pelatihan", to: "/umkm/trainings/list" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuthStorage();
    navigate("/login");
  };

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "#1a3fa4", // Warna biru
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      borderBottom: "none",
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto", padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64,
      }}>

        {/* Logo + Teks Emas */}
        <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", gap: 10 }}>
          <img 
            src={logoImg} 
            alt="UMKM Tumbuh" 
            style={{ 
              height: 40, 
              width: "auto",
              display: "block",
            }} 
          />
          <span style={{
            fontWeight: 800,
            fontSize: 18,
            color: "#FFD700",
            letterSpacing: -0.3,
            fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
          }}>
            UMKM Tumbuh
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 32 }} className="hidden-mobile">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  color: active ? "#fff" : "rgba(255,255,255,0.85)",
                  fontWeight: 500, fontSize: 14,
                  textDecoration: "none",
                  position: "relative", paddingBottom: 4,
                  borderBottom: active ? "2px solid #FFD700" : "2px solid transparent",
                  transition: "all 0.2s",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: user profile dropdown + mobile hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div ref={profileRef} style={{ position: "relative" }} className="hidden-mobile">
            <div
              onClick={() => setProfileOpen(!profileOpen)}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, #FFD700, #f59e0b)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(255,215,0,0.4)",
              }}>
                <Icon icon="mdi:account" style={{ fontSize: 20, color: "#1a3fa4" }} />
              </div>
              <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
                {user?.full_name || "User UMKM"}
              </span>
              <Icon icon={profileOpen ? "mdi:chevron-up" : "mdi:chevron-down"} style={{ fontSize: 16, color: "rgba(255,255,255,0.6)" }} />
            </div>

            {profileOpen && (
              <div style={{
                position: "absolute", top: "100%", right: 0, marginTop: 10,
                background: "#fff", borderRadius: 14, minWidth: 230,
                boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
                padding: "8px 0", zIndex: 200, overflow: "hidden",
                animation: "fadeSlideDown 0.2s ease",
              }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{user?.full_name || "User UMKM"}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>{user?.email || "user@example.com"}</p>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#1a3fa4", background: "#e0e7ff", padding: "2px 10px", borderRadius: 6, display: "inline-block", marginTop: 7 }}>
                    {user?.role || "UMKM"}
                  </span>
                </div>

                <div style={{ padding: "4px 0" }}>
                  <button
                    onClick={() => { navigate("/umkm/trainings"); setProfileOpen(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", border: "none", background: "none", width: "100%", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#334155", textAlign: "left", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <Icon icon="mdi:view-dashboard" style={{ fontSize: 18, color: "#1a3fa4" }} />
                    Dashboard UMKM
                  </button>
                </div>

                <div style={{ borderTop: "1px solid #f1f5f9", padding: "4px 0" }}>
                  <button
                    onClick={handleLogout}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", border: "none", background: "none", width: "100%", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#ef4444", textAlign: "left", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <Icon icon="mdi:logout" style={{ fontSize: 18 }} />
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: 36, height: 36, borderRadius: 8,
              border: "none", background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff",
            }}
            className="show-mobile"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          background: "#1a3fa4",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          padding: "12px 24px",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block", padding: "8px 12px", borderRadius: 8,
                  background: active ? "rgba(255,255,255,0.15)" : "transparent",
                  color: active ? "#FFD700" : "rgba(255,255,255,0.85)",
                  fontWeight: 500, fontSize: 14, textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 768px) { .show-mobile { display: none !important; } }
        @media (max-width: 767px) { .hidden-mobile { display: none !important; } }
      `}</style>
    </header>
  );
}