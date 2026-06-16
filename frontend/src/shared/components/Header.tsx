import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import logoImg from "../../assets/umkm-tumbuh.webp";

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
  const location = useLocation();

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

        {/* Right: user profile + mobile hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="hidden-mobile" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #FFD700, #f59e0b)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(255,215,0,0.4)",
            }}>
              <Icon icon="mdi:account" style={{ fontSize: 20, color: "#1a3fa4" }} />
            </div>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
              User UMKM
            </span>
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
        @media (min-width: 768px) { .show-mobile { display: none !important; } }
        @media (max-width: 767px) { .hidden-mobile { display: none !important; } }
      `}</style>
    </header>
  );
}