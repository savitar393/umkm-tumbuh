import { useState, useEffect, CSSProperties } from "react";
import { Link } from "react-router-dom";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import background1 from "../../../assets/background1.png";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const StarIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 0.8s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);
const EmptyIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    <circle cx="13" cy="10" r="2.5"/><path d="m15 12 1.5 1.5"/>
  </svg>
);

const thumbSVGs: Record<string, JSX.Element> = {
  thumb: (
    <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  ),
  cash: (
    <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  camera: (
    <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  truck: (
    <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  leaf: (
    <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 19.34a1 1 0 0 0 1.49 1.3C7 19 9 17 11 17c4 0 7-3 7-3"/>
      <path d="M2 22c2-2 5-4 10-4s8 2 10 4"/>
    </svg>
  ),
  bulb: (
    <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  ),
  shop: (
    <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  shield: (
    <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
};

type Level = "Pemula" | "Menengah" | "Lanjutan" | "Semua Level";
type Category = "Semua Pelatihan" | "Pemasaran Digital" | "Manajemen Keuangan" | "Produksi & Operasional" | "Legalitas & Sertifikasi";

interface Training {
  id: number;
  title: string;
  description: string;
  instructor: string;
  hours: number;
  level: Level;
  category: Category;
  popular?: boolean;
  thumbColor: string;
  thumbKey: string;
  avatarColor: string;
  avatarInitial: string;
}

const trainings: Training[] = [
  { id: 1, title: "Strategi Pemasaran Digital untuk Pemula", description: "Tingkatkan penjualan Anda dengan teknik pemasaran digital yang terbukti efektif untuk UMKM.", instructor: "Budi Santoso", hours: 12, level: "Pemula", category: "Pemasaran Digital", popular: true, thumbColor: "#1e40af", thumbKey: "thumb", avatarColor: "#1a3fa4", avatarInitial: "BS" },
  { id: 2, title: "Manajemen Arus Kas Bisnis Ritel", description: "Kuasai pencatatan keuangan dan kelola perputaran modal agar bisnis selalu sehat dan berkembang.", instructor: "Siti Aminah", hours: 8, level: "Menengah", category: "Manajemen Keuangan", thumbColor: "#0f766e", thumbKey: "cash", avatarColor: "#0d9488", avatarInitial: "SA" },
  { id: 3, title: "Fotografi Produk dengan Smartphone", description: "Hasilkan foto produk katalog yang profesional hanya dengan modal smartphone dan pencahayaan sederhana.", instructor: "Raka Wijaya", hours: 15, level: "Semua Level", category: "Pemasaran Digital", thumbColor: "#6d28d9", thumbKey: "camera", avatarColor: "#7c3aed", avatarInitial: "RW" },
  { id: 4, title: "Optimasi Rantai Pasok UMKM", description: "Efisiensi pengadaan bahan baku hingga distribusi untuk menekan biaya dan meningkatkan margin.", instructor: "Dr. Hendra Saputra", hours: 10, level: "Lanjutan", category: "Produksi & Operasional", thumbColor: "#0284c7", thumbKey: "truck", avatarColor: "#0ea5e9", avatarInitial: "HS" },
  { id: 5, title: "Branding Berbasis Keberlanjutan", description: "Cara membangun citra brand ramah lingkungan yang diminati konsumen milenial dan Gen Z.", instructor: "Maya Lestari", hours: 6, level: "Pemula", category: "Pemasaran Digital", thumbColor: "#15803d", thumbKey: "leaf", avatarColor: "#16a34a", avatarInitial: "ML" },
  { id: 6, title: "Kepemimpinan dan Budaya Kerja UMKM", description: "Membangun tim yang solid, loyal, dan berkinerja tinggi untuk pertumbuhan bisnis berkelanjutan.", instructor: "Doni Pratama", hours: 12, level: "Semua Level", category: "Produksi & Operasional", thumbColor: "#d97706", thumbKey: "bulb", avatarColor: "#f59e0b", avatarInitial: "DP" },
  { id: 7, title: "Integrasi E-Commerce Multi-Platform", description: "Mengelola pesanan dari berbagai platform marketplace secara terpusat dan otomatis tanpa repot.", instructor: "Andi Wijaya", hours: 18, level: "Lanjutan", category: "Pemasaran Digital", thumbColor: "#be185d", thumbKey: "shop", avatarColor: "#ec4899", avatarInitial: "AW" },
  { id: 8, title: "Legalitas Usaha dan Izin Edar", description: "Panduan praktis mengurus NIB, P-IRT, hingga sertifikasi Halal untuk memperluas pasar Anda.", instructor: "Ratna Dewi", hours: 5, level: "Pemula", category: "Legalitas & Sertifikasi", thumbColor: "#475569", thumbKey: "shield", avatarColor: "#64748b", avatarInitial: "RD" },
];

const categories: Category[] = ["Semua Pelatihan", "Pemasaran Digital", "Manajemen Keuangan", "Produksi & Operasional", "Legalitas & Sertifikasi"];

const levelColors: Record<Level, { bg: string; text: string }> = {
  Pemula:        { bg: "#d1fae5", text: "#065f46" },
  Menengah:      { bg: "#fef3c7", text: "#92400e" },
  Lanjutan:      { bg: "#dbeafe", text: "#1e40af" },
  "Semua Level": { bg: "#ede9fe", text: "#5b21b6" },
};

function TrainingCard({ t, idx }: { t: Training; idx: number }) {
  const [hovered, setHovered] = useState(false);
  const lc = levelColors[t.level];

  const cardStyle: CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #eee",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: hovered ? "0 12px 36px rgba(0,0,0,0.13)" : "0 2px 8px rgba(0,0,0,0.06)",
    transform: hovered ? "translateY(-4px)" : "translateY(0)",
    transition: "box-shadow 0.3s, transform 0.3s",
    cursor: "pointer",
    animation: "fadeSlideUp 0.45s ease both",
    animationDelay: `${idx * 80}ms`,
  };

  return (
    <div style={cardStyle} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ height: 172, background: `linear-gradient(135deg, ${t.thumbColor}ee, ${t.thumbColor}99)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        {t.popular && (
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.92)", borderRadius: 20, padding: "4px 9px", display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "#1a3fa4", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
            <StarIcon />TERPOPULER
          </div>
        )}
        <div style={{ transition: "transform 0.3s", transform: hovered ? "scale(1.1)" : "scale(1)" }}>
          {thumbSVGs[t.thumbKey]}
        </div>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, background: "#f3f4f6", color: "#555", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20 }}>
            <ClockIcon />{t.hours} Jam
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: lc.bg, color: lc.text }}>
            {t.level}
          </span>
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: hovered ? "#1a3fa4" : "#1a1a2e", lineHeight: 1.45, margin: 0, transition: "color 0.2s" }}>
          {t.title}
        </h3>
        <p style={{ fontSize: 12, color: "#777", lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>
          {t.description}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #f5f5f5", marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: t.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
              {t.avatarInitial}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#555" }}>{t.instructor}</span>
          </div>
          <Link
            to={`/umkm/trainings/${t.id}`}
            style={{ width: 30, height: 30, borderRadius: "50%", background: hovered ? "#1a3fa4" : "rgba(26,63,164,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: hovered ? "#fff" : "#1a3fa4", textDecoration: "none", transition: "background 0.2s, color 0.2s", flexShrink: 0 }}
          >
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TrainingListPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("Semua Pelatihan");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(8);
  const [isLoading, setIsLoading] = useState(false);

  const filtered = trainings.filter((t) => {
    const matchCat = activeCategory === "Semua Pelatihan" || t.category === activeCategory;
    const matchSearch = search === "" || t.title.toLowerCase().includes(search.toLowerCase()) || t.instructor.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const visible = filtered.slice(0, visibleCount);

  const handleLoadMore = () => {
    setIsLoading(true);
    setTimeout(() => { setVisibleCount((p) => p + 4); setIsLoading(false); }, 600);
  };

  useEffect(() => { setVisibleCount(8); }, [activeCategory, search]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#f5f7fa", // solid bg untuk header & footer area
    }}>
      <Header />

      {/* ── Hero: warna solid biru, TANPA background image ── */}
      <section style={{
        minHeight: 260,
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(105deg, #1a3fa4 0%, #1e4fd4 60%, #2563eb 100%)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Dekoratif lingkaran blur supaya tidak polos */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, right: 200, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 1280, margin: "0 auto", padding: "56px 24px", width: "100%" }}>
          <div style={{ maxWidth: 520 }}>
            <h1 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, color: "#fff", lineHeight: 1.25, margin: "0 0 10px", letterSpacing: "-0.5px", animation: "fadeSlideUp 0.45s ease both" }}>
              Eskalasi Bisnis Anda dengan<br />Pelatihan Terkurasi
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.82)", margin: "0 0 24px", lineHeight: 1.6, animation: "fadeSlideUp 0.45s 0.1s ease both", animationFillMode: "both" }}>
              Akses materi eksklusif dari praktisi berpengalaman untuk mengakselerasi pertumbuhan UMKM Anda.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 12, padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.18)", animation: "fadeSlideUp 0.45s 0.2s ease both", animationFillMode: "both" }}>
              <span style={{ color: "#aaa", display: "flex", flexShrink: 0 }}><SearchIcon /></span>
              <input
                type="text"
                placeholder="Cari topik pelatihan, pemateri, atau modul..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#333", background: "transparent", minWidth: 0 }}
              />
              <button style={{ background: "#1a3fa4", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                Cari
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Tabs ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", position: "sticky", top: 64, zIndex: 30 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 0", scrollbarWidth: "none" }}>
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{ whiteSpace: "nowrap", flexShrink: 0, padding: "8px 18px", borderRadius: 24, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: active ? "#1a3fa4" : "transparent", color: active ? "#fff" : "#555", boxShadow: active ? "0 2px 10px rgba(26,63,164,0.28)" : "none", transition: "all 0.2s" }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main / Grid: background1 HANYA di sini ── */}
      <main style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* background1 di belakang grid card saja */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${background1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "local",
        }} />
        {/* Overlay tipis — opacity rendah supaya bg kelihatan */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(245, 247, 250, 0.55)",
        }} />

        {/* Konten grid di atas background */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "40px 24px", boxSizing: "border-box" }}>
          {visible.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12, color: "#bbb" }}>
              <EmptyIcon />
              <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: "#aaa" }}>Tidak ada pelatihan ditemukan</p>
              <p style={{ fontSize: 13, margin: 0 }}>Coba kata kunci atau kategori lain</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 20 }}>
              {visible.map((t, i) => <TrainingCard key={t.id} t={t} idx={i} />)}
            </div>
          )}

          {visible.length < filtered.length && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 48 }}>
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", color: "#444", border: "1px solid #ddd", borderRadius: 12, padding: "12px 28px", fontSize: 13, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", opacity: isLoading ? 0.6 : 1, transition: "box-shadow 0.2s" }}
              >
                {isLoading ? <SpinnerIcon /> : <ChevronDownIcon />}
                {isLoading ? "Memuat..." : "Lihat Lebih Banyak Pelatihan"}
              </button>
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                Menampilkan {visible.length} dari {filtered.length} pelatihan tersedia
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}