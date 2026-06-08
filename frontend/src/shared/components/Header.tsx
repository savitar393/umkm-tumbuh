import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logoImg from "../../assets/umkm-tumbuh.webp";

const HelpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const UserCircleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

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

        {/* Logo - menggunakan gambar umkm-tumbuh.webp dengan warna asli */}
        <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img 
            src={logoImg} 
            alt="UMKM Tumbuh" 
            style={{ 
              height: 40, 
              width: "auto",
              display: "block",
              // HAPUS filter: "brightness(0) invert(1)" - biar warna asli
            }} 
          />
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

        {/* Right: help icon + user */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "none", background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff",
            transition: "background 0.2s",
          }}>
            <HelpIcon />
          </button>

          <button style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "none", background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff",
            transition: "background 0.2s",
          }}>
            <UserCircleIcon />
          </button>

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