import Sidebar from "../../../shared/components/Sidebar";
import backgroundImg from "../../../assets/background1.png";

// ── Dummy Data ────────────────────────────────────────────────
const stats = [
  { label: "TOTAL PELATIHAN", value: 5, unit: "Kelas", sub: "2 BULAN TERAKHIR", subIcon: "trending-up", accent: false },
  { label: "SELESAI", value: 3, unit: "Topik", progress: 60, accent: true },
  { label: "SERTIFIKAT", value: 3, unit: "Diterbitkan", sub: "Siap Diunduh", subIcon: "check-circle", accent: false },
];

const ongoingTrainings = [
  {
    id: 1,
    category: "PEMASARAN DIGITAL",
    title: "Optimasi Iklan Facebook untuk Pemula",
    timeLeft: "2 Jam Tersisa",
    modules: "4/6 Modul",
    progress: 75,
    color: "#f59e0b",
    img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=160&h=160&fit=crop",
  },
  {
    id: 2,
    category: "KEUANGAN",
    title: "Manajemen Arus Kas UMKM",
    timeLeft: "45 Menit Tersisa",
    modules: "7/8 Modul",
    progress: 92,
    color: "#3b82f6",
    img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=160&h=160&fit=crop",
  },
];

const completedTrainings = [
  { id: 1, category: "OPERASIONAL", title: "Packing & Pengiriman", iconBg: "#e0f2fe", iconColor: "#0369a1" },
  { id: 2, category: "PELANGGAN",   title: "Service Excellence",   iconBg: "#dbeafe", iconColor: "#1d4ed8" },
];

const certificates = [
  { id: 1, title: "Marketing Master",   date: "Diterbitkan 12 Des 2023" },
  { id: 2, title: "Financial Literacy", date: "Diterbitkan 05 Nov 2023" },
  { id: 3, title: "HR Management",      date: "Diterbitkan 20 Okt 2023" },
];

// ── SVG Icons ─────────────────────────────────────────────────
function IconTrendingUp({ size = 13, color = "#16a34a" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
function IconCheckCircle({ size = 13, color = "#1565c0" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1565c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconBox({ size = 28, color = "#0369a1" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" opacity="0.4"/>
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
      <path fillRule="evenodd" d="M3.5 7.75L12 12.5l8.5-4.75V17L12 21.5 3.5 17V7.75z" fill={color}/>
    </svg>
  );
}
function IconUsers({ size = 28, color = "#1d4ed8" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <circle cx="9" cy="7" r="3" opacity="0.5"/>
      <path d="M3 21v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1" opacity="0.5"/>
      <circle cx="17" cy="7" r="2.5"/>
      <path d="M19.5 21v-1a5 5 0 0 0-5-5"/>
    </svg>
  );
}
function IconCertificate() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M12 12v9"/><path d="M8.5 18.5 12 21l3.5-2.5"/>
      <rect x="3" y="3" width="18" height="14" rx="2" opacity="0.3" fill="white" stroke="none"/>
      <path d="M7 8h2M15 8h2M7 11h4"/>
    </svg>
  );
}

// ── Shared card style ─────────────────────────────────────────
const card = {
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderRadius: 16,
  boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
  border: "1px solid rgba(255,255,255,0.7)",
};

// ── Main Component ────────────────────────────────────────────
export default function TrainingDashboardPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif", position: "relative" }}>

      {/* CSS keyframes + hover helpers */}
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-header   { animation: fadeSlideDown 0.45s ease both; }
        .anim-s0       { animation: fadeSlideUp 0.45s ease both; animation-delay: 0s; }
        .anim-s1       { animation: fadeSlideUp 0.45s ease both; animation-delay: 0.1s; }
        .anim-s2       { animation: fadeSlideUp 0.45s ease both; animation-delay: 0.2s; }
        .anim-t0       { animation: fadeSlideUp 0.45s ease both; animation-delay: 0.3s; }
        .anim-t1       { animation: fadeSlideUp 0.45s ease both; animation-delay: 0.4s; }
        .anim-right    { animation: fadeSlideUp 0.45s ease both; animation-delay: 0.35s; }

        .hover-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          cursor: pointer;
        }
        .hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.13) !important;
        }
        .hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.11) !important;
        }
        .btn-primary {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .btn-primary:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 8px 28px rgba(21,101,192,0.5) !important;
        }
        .btn-primary:active { transform: scale(0.97); }

        .btn-dl {
          transition: background 0.15s, transform 0.15s;
          background: none; border: none; cursor: pointer;
          color: #1565c0; padding: 6px; border-radius: 8px;
          display: flex; align-items: center;
        }
        .btn-dl:hover { background: #e3f2fd; transform: translateY(-1px); }
        .btn-dl:active { transform: scale(0.9); }

        .cert-icon {
          transition: transform 0.25s ease;
        }
        .hover-lift:hover .cert-icon {
          transform: rotate(12deg) scale(1.08);
        }

        .img-zoom { transition: transform 0.3s ease; }
        .hover-card:hover .img-zoom { transform: scale(1.08); }
      `}</style>

      {/* Background PNG */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: "cover", backgroundPosition: "center top", backgroundRepeat: "no-repeat",
      }} />
      {/* Overlay tipis */}
      <div style={{ position: "fixed", inset: 0, zIndex: 1, background: "rgba(240,244,255,0.25)", pointerEvents: "none" }} />

      {/* Sidebar */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <Sidebar activeLabel="Pelatihan Saya" />
      </div>

      {/* Main Content */}
      <main style={{ marginLeft: 230, flex: 1, padding: "36px 40px", minHeight: "100vh", position: "relative", zIndex: 5 }}>

        {/* Header */}
        <div className="anim-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0d1b6e", margin: 0, letterSpacing: -0.5 }}>Selamat Datang,</h1>
            <p style={{ margin: "4px 0 0", color: "#475569", fontSize: 14.5 }}>Mari tingkatkan kualitas UMKM Anda hari ini.</p>
          </div>
          <button
            className="btn-primary"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 22px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #1a237e, #1565c0)",
              color: "#fff", fontWeight: 700, fontSize: 14,
              boxShadow: "0 4px 20px rgba(21,101,192,0.4)",
            }}
          >
            <IconPlus /> Mulai Pelatihan Baru
          </button>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 36 }}>
          {stats.map((s, i) => (
            <div
              key={i}
              className={`hover-card anim-s${i}`}
              style={{
                ...card,
                background: s.accent ? "linear-gradient(135deg, #1a237e, #1565c0)" : "rgba(255,255,255,0.82)",
                boxShadow: s.accent ? "0 8px 32px rgba(21,101,192,0.3)" : "0 2px 16px rgba(0,0,0,0.07)",
                border: s.accent ? "none" : "1px solid rgba(255,255,255,0.7)",
                borderRadius: 18, padding: "24px 28px",
                color: s.accent ? "#fff" : "#0d1b6e",
              }}
            >
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: s.accent ? "rgba(255,255,255,0.75)" : "#64748b" }}>
                {s.label}
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: 15, fontWeight: 500, opacity: 0.7 }}>{s.unit}</span>
              </div>
              {s.progress !== undefined && (
                <div style={{ marginTop: 14, background: "rgba(255,255,255,0.25)", borderRadius: 99, height: 5 }}>
                  <div style={{ width: `${s.progress}%`, background: "#fff", borderRadius: 99, height: 5, transition: "width 0.7s ease" }} />
                </div>
              )}
              {s.sub && (
                <p style={{ margin: "10px 0 0", fontSize: 12, fontWeight: 600, opacity: 0.7, display: "flex", alignItems: "center", gap: 5 }}>
                  {s.subIcon === "trending-up"
                    ? <IconTrendingUp color={s.accent ? "#fff" : "#16a34a"} />
                    : <IconCheckCircle color={s.accent ? "#fff" : "#1565c0"} />
                  }
                  {s.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>

          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Pelatihan Berjalan */}
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0d1b6e" }}>Pelatihan Berjalan</h2>
                <button style={{ background: "none", border: "none", color: "#1565c0", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
                  Lihat Semua
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {ongoingTrainings.map((t, i) => (
                  <div
                    key={t.id}
                    className={`hover-card anim-t${i}`}
                    style={{ ...card, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}
                  >
                    {/* Gambar dengan overflow hidden untuk zoom effect */}
                    <div style={{ width: 70, height: 70, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                      <img
                        className="img-zoom"
                        src={t.img}
                        alt={t.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: "inline-block", fontSize: 10, fontWeight: 800, letterSpacing: 1,
                        color: "#1565c0", background: "#e3f2fd", borderRadius: 6, padding: "3px 8px", marginBottom: 6,
                      }}>{t.category}</span>
                      <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 14.5, color: "#0d1b6e", lineHeight: 1.3 }}>{t.title}</p>
                      <div style={{ display: "flex", gap: 14, color: "#64748b", fontSize: 12, marginBottom: 10, alignItems: "center" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><IconClock /> {t.timeLeft}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><IconBook /> {t.modules}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, background: "#e2e8f0", borderRadius: 99, height: 6 }}>
                          <div style={{ width: `${t.progress}%`, background: t.color, borderRadius: 99, height: 6, transition: "width 0.7s ease" }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: t.color, whiteSpace: "nowrap" }}>{t.progress}% Selesai</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Pelatihan Selesai */}
            <section>
              <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 800, color: "#0d1b6e" }}>Pelatihan Selesai</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {completedTrainings.map((t) => (
                  <div key={t.id} className="hover-card" style={{ ...card, padding: "20px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, background: t.iconBg,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {t.id === 1 ? <IconBox size={28} color={t.iconColor} /> : <IconUsers size={28} color={t.iconColor} />}
                    </div>
                    <div>
                      <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#64748b" }}>{t.category}</p>
                      <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 14, color: "#0d1b6e" }}>{t.title}</p>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, color: "#16a34a", background: "#dcfce7", borderRadius: 6, padding: "3px 8px" }}>
                        SELESAI
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right — Sertifikat */}
          <section className="anim-right">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0d1b6e" }}>Sertifikat Saya</h2>
              <button style={{ background: "none", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer" }}>···</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {certificates.map((c, i) => (
                <div
                  key={c.id}
                  className="hover-lift"
                  style={{
                    ...card,
                    padding: "16px 18px",
                    display: "flex", alignItems: "center", gap: 14,
                    animation: "fadeSlideUp 0.45s ease both",
                    animationDelay: `${0.45 + i * 0.08}s`,
                  }}
                >
                  <div
                    className="cert-icon"
                    style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: "linear-gradient(135deg, #1a237e, #1565c0)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, boxShadow: "0 4px 12px rgba(21,101,192,0.3)",
                    }}
                  >
                    <IconCertificate />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: "#0d1b6e" }}>{c.title}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{c.date}</p>
                  </div>
                  <button className="btn-dl"><IconDownload /></button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}