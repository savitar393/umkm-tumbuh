import { Link } from "react-router-dom";
import kentrianImg from "../../assets/kementrian.png";

const WebIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

export default function Footer() {
  return (
    <footer style={{ background: "#1a3fa4", color: "#fff" }}>
      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "40px 48px",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 64,
        alignItems: "start",
      }}>

        {/* Kolom 1: Hanya gambar kementrian, diperbesar */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src={kentrianImg}
            alt="Logo Kementerian UMKM"
            style={{ width: 150, height: 90, objectFit: "contain" }}
          />
        </div>

        {/* Kolom 2: Brand + Deskripsi */}
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px", color: "#fff" }}>UMKM Tumbuh</p>
          <p style={{ fontSize: 13, lineHeight: 1.75, color: "rgba(255,255,255,0.65)", margin: 0, maxWidth: 320 }}>
            Platform pemberdayaan ekonomi terpadu untuk mengakselerasi pertumbuhan UMKM di seluruh pelosok Indonesia.
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "28px 0 0" }}>
            © 2026 UMKM Tumbuh. All rights reserved.
          </p>
        </div>

        {/* Kolom 3: Legal + Ikuti Kami */}
        <div style={{ display: "flex", gap: 48, alignItems: "start" }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 14px" }}>Legal</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Kebijakan Privasi", "Syarat & Ketentuan"].map((t) => (
                <Link key={t} to="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", textDecoration: "none" }}>{t}</Link>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 14px" }}>Ikuti Kami</p>
            <div style={{ display: "flex", gap: 10 }}>
              {[<WebIcon />, <ChatIcon />].map((icon, i) => (
                <a key={i} href="#" style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", textDecoration: "none",
                }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}