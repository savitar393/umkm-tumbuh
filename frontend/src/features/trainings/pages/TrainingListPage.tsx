import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { useTrainings } from "../hooks";
import type { TrainingProgram } from "../types";

const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const ClockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const StarIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 0.8s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
const EmptyIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <circle cx="13" cy="10" r="2.5" /><path d="m15 12 1.5 1.5" />
  </svg>
);

const thumbColors = [
  "#1e40af", "#0f766e", "#6d28d9", "#0284c7",
  "#15803d", "#d97706", "#be185d", "#475569",
  "#2563eb", "#059669", "#7c3aed", "#0891b2",
];

const defaultThumbnails = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=250&fit=crop",
];

const levelColors: Record<string, { bg: string; text: string }> = {
  Pemula: { bg: "#d1fae5", text: "#065f46" },
  Menengah: { bg: "#fef3c7", text: "#92400e" },
  Lanjutan: { bg: "#dbeafe", text: "#1e40af" },
};

function getLevel(hours: number): string {
  if (hours <= 5) return "Pemula";
  if (hours <= 12) return "Menengah";
  return "Lanjutan";
}

function getInitial(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2);
}

function TrainingCard({ t, idx }: { t: TrainingProgram; idx: number }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const level = getLevel(t.durasi_jam);
  const lc = levelColors[level] || { bg: "#ede9fe", text: "#5b21b6" };
  const color = thumbColors[idx % thumbColors.length];
  const thumbSrc = t.thumbnail_url || defaultThumbnails[idx % defaultThumbnails.length];

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
    <div style={cardStyle} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/umkm/trainings/${t.pelatihan_id}`)}>
      <div style={{
        height: 172, position: "relative", overflow: "hidden",
        background: imgError ? `linear-gradient(135deg, ${color}ee, ${color}99)` : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {imgError ? (
          <div style={{
            width: 70, height: 70, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,0.85)",
            transition: "transform 0.3s", transform: hovered ? "scale(1.1)" : "scale(1)",
          }}>
            {t.judul_pelatihan.charAt(0)}
          </div>
        ) : (
          <img
            src={thumbSrc}
            alt={t.judul_pelatihan}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transition: "transform 0.3s", transform: hovered ? "scale(1.08)" : "scale(1)",
            }}
            onError={() => setImgError(true)}
          />
        )}
        {t.rating_rata_rata && t.rating_rata_rata >= 4.5 && (
          <div style={{
            position: "absolute", top: 10, left: 10,
            background: "rgba(255,255,255,0.92)", borderRadius: 20,
            padding: "4px 9px", display: "flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 700, color: "#1a3fa4", boxShadow: "0 1px 4px rgba(0,0,0,0.1)"
          }}>
            <StarIcon />TERPOPULER
          </div>
        )}
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, background: "#f3f4f6", color: "#555", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20 }}>
            <ClockIcon />{t.durasi_jam} Jam
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: lc.bg, color: lc.text }}>
            {level}
          </span>
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: hovered ? "#1a3fa4" : "#1a1a2e", lineHeight: 1.45, margin: 0, transition: "color 0.2s" }}>
          {t.judul_pelatihan}
        </h3>
        <p style={{ fontSize: 12, color: "#777", lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>
          {t.deskripsi_pelatihan || "Tidak ada deskripsi"}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #f5f5f5", marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
              {getInitial(t.mentor_nama)}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#555" }}>{t.mentor_nama || "Instruktur"}</span>
          </div>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: hovered ? "#1a3fa4" : "rgba(26,63,164,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: hovered ? "#fff" : "#1a3fa4", transition: "background 0.2s, color 0.2s", flexShrink: 0 }}>
            <ArrowRightIcon />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrainingListPage() {
  const { data: trainings, isLoading, error } = useTrainings();
  const [activeCategory, setActiveCategory] = useState("Semua Pelatihan");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(false);

  const categories = ["Semua Pelatihan", ...new Set((trainings || []).map((t) => t.jenis_pelatihan))];

  const filtered = (trainings || []).filter((t) => {
    const matchCat = activeCategory === "Semua Pelatihan" || t.jenis_pelatihan === activeCategory;
    const matchSearch = search === "" ||
      t.judul_pelatihan.toLowerCase().includes(search.toLowerCase()) ||
      (t.mentor_nama || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const visible = filtered.slice(0, visibleCount);

  const handleLoadMore = () => {
    setLoading(true);
    setTimeout(() => { setVisibleCount((p) => p + 4); setLoading(false); }, 600);
  };

  useEffect(() => { setVisibleCount(8); }, [activeCategory, search]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f5f7fa" }}>
      <Header />

      <section style={{
        minHeight: 260, display: "flex", alignItems: "center",
        background: "linear-gradient(105deg, #1a3fa4 0%, #1e4fd4 60%, #2563eb 100%)",
        position: "relative", overflow: "hidden",
      }}>
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
                type="text" placeholder="Cari topik pelatihan, pemateri, atau modul..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#333", background: "transparent", minWidth: 0 }}
              />
              <button style={{ background: "#1a3fa4", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                Cari
              </button>
            </div>
          </div>
        </div>
      </section>

      <div style={{ background: "#fff", borderBottom: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", position: "sticky", top: 64, zIndex: 30 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 0", scrollbarWidth: "none" }}>
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{ whiteSpace: "nowrap", flexShrink: 0, padding: "8px 18px", borderRadius: 24, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: active ? "#1a3fa4" : "transparent", color: active ? "#fff" : "#555", boxShadow: active ? "0 2px 10px rgba(26,63,164,0.28)" : "none", transition: "all 0.2s" }}>
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "40px 24px", boxSizing: "border-box" }}>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12, color: "#bbb" }}>
              <SpinnerIcon />
              <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: "#aaa" }}>Memuat data pelatihan...</p>
            </div>
          ) : error ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12, color: "#bbb" }}>
              <EmptyIcon />
              <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: "#ef4444" }}>Gagal memuat data pelatihan</p>
              <p style={{ fontSize: 13, margin: 0, color: "#aaa" }}>Coba refresh halaman atau periksa koneksi backend</p>
            </div>
          ) : visible.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12, color: "#bbb" }}>
              <EmptyIcon />
              <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: "#aaa" }}>Tidak ada pelatihan ditemukan</p>
              <p style={{ fontSize: 13, margin: 0 }}>Coba kata kunci atau kategori lain</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 20 }}>
              {visible.map((t, i) => <TrainingCard key={t.pelatihan_id} t={t} idx={i} />)}
            </div>
          )}

          {visible.length < filtered.length && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 48 }}>
              <button onClick={handleLoadMore} disabled={loading}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", color: "#444", border: "1px solid #ddd", borderRadius: 12, padding: "12px 28px", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", opacity: loading ? 0.6 : 1, transition: "box-shadow 0.2s" }}>
                {loading ? <SpinnerIcon /> : <ChevronDownIcon />}
                {loading ? "Memuat..." : "Lihat Lebih Banyak Pelatihan"}
              </button>
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Menampilkan {visible.length} dari {filtered.length} pelatihan tersedia</p>
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
