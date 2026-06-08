import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import TermsModal from "./TermsModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Module {
  id: number;
  title: string;
  description: string;
}

interface Training {
  id: string;
  level: string;
  duration: string;
  title: string;
  mentor: string;
  rating: number;
  alumni: string;
  description: string[];
  price: number | null; // null = GRATIS
  originalPrice: number;
  benefits: string[];
  modules: Module[];
  requirements: string[];
  outcomes: string[];
  heroImage?: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const trainingData: Training = {
  id: "manajemen-keuangan-umkm",
  level: "INTERMEDIATE",
  duration: "10 JAM BELAJAR",
  title: "Manajemen Keuangan UMKM",
  mentor: "Budi Santoso",
  rating: 4.9,
  alumni: "2.4k",
  description: [
    "Kuasai seni mengelola arus kas dan perencanaan keuangan yang dirancang khusus untuk pemilik usaha kecil dan menengah. Pelatihan ini tidak hanya mengajarkan teori, tetapi memberikan alat praktis yang dapat langsung Anda terapkan di bisnis Anda.",
    "Pelajari cara memisahkan keuangan pribadi dan bisnis, menghitung harga pokok penjualan yang akurat, hingga membaca laporan laba rugi untuk pengambilan keputusan strategis yang lebih cerdas.",
  ],
  price: null,
  originalPrice: 750000,
  benefits: [
    "Akses seumur hidup ke modul pembelajaran",
    "15+ File template & materi pendukung",
  ],
  modules: [
    {
      id: 1,
      title: "Dasar-dasar Akuntansi UMKM",
      description: "Memahami konsep debit, kredit, dan persamaan akuntansi dasar.",
    },
    {
      id: 2,
      title: "Manajemen Arus Kas (Cash Flow)",
      description: "Teknik menjaga likuiditas agar bisnis tetap beroperasi setiap hari.",
    },
    {
      id: 3,
      title: "Perpajakan Sederhana",
      description: "Cara menghitung dan melaporkan pajak PPh Final 0.5% untuk UMKM.",
    },
  ],
  requirements: [
    "Memiliki usaha yang sudah berjalan minimal 3 bulan.",
    "Memiliki perangkat komputer/laptop dengan koneksi internet.",
    "Komitmen menyelesaikan tugas di setiap modul.",
  ],
  outcomes: [
    "Mampu menyusun Laporan Laba Rugi bulanan secara mandiri.",
    "Sertifikat Kompetensi Digital yang diakui industri.",
    "Template Excel Manajemen Keuangan Siap Pakai.",
  ],
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function ModuleAccordion({ module, index }: { module: Module; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="module-item"
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px 24px",
        marginBottom: "12px",
        cursor: "pointer",
        background: "#fff",
        transition: "box-shadow 0.2s",
      }}
      onClick={() => setOpen(!open)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
          {/* Number */}
          <span
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#2A7A4B",
              minWidth: "32px",
              lineHeight: 1,
              paddingTop: "2px",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          {/* Text */}
          <div>
            <p
              style={{
                margin: 0,
                fontWeight: "700",
                fontSize: "15px",
                color: "#111827",
                lineHeight: "1.4",
              }}
            >
              {module.title}
            </p>
            {!open && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "13px",
                  color: "#6b7280",
                  lineHeight: "1.5",
                }}
              >
                {module.description}
              </p>
            )}
            {open && (
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "13px",
                  color: "#374151",
                  lineHeight: "1.6",
                }}
              >
                {module.description}
              </p>
            )}
          </div>
        </div>
        <Icon
          icon={open ? "mdi:chevron-up" : "mdi:chevron-down"}
          style={{ fontSize: "22px", color: "#6b7280", flexShrink: 0 }}
        />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TrainingDetailPage() {
  const navigate = useNavigate();
  const training = trainingData;

  // ── Modal state ──────────────────────────────────────────────
  const [showTerms, setShowTerms] = useState(false);

  const handleConfirmRegister = () => {
    setShowTerms(false);
    // TODO: hit registration API endpoint here
    // Navigate to success page
    navigate(`/umkm/trainings/${training.id}/success`);
  };
  // ────────────────────────────────────────────────────────────

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      <Header />

      {/* ── Terms Modal ───────────────────────────────────────────── */}
      <TermsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onConfirm={handleConfirmRegister}
      />

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          width: "100%",
          minHeight: "360px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2a1e 100%)",
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
        }}
      >
        {/* Background decorative grid lines */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "10%",
            right: "15%",
            width: "320px",
            height: "320px",
            background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "80px 32px 48px",
            width: "100%",
          }}
        >
          {/* Badges */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <span
              style={{
                background: "#2563eb",
                color: "#fff",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.08em",
                padding: "4px 12px",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}
            >
              {training.level}
            </span>
            <span
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                fontSize: "11px",
                fontWeight: "600",
                letterSpacing: "0.06em",
                padding: "4px 12px",
                borderRadius: "4px",
              }}
            >
              {training.duration}
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              margin: "0 0 20px",
              fontSize: "clamp(28px, 5vw, 46px)",
              fontWeight: "900",
              color: "#ffffff",
              lineHeight: "1.15",
              letterSpacing: "-0.02em",
              maxWidth: "700px",
            }}
          >
            {training.title}
          </h1>

          {/* Meta */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "rgba(255,255,255,0.85)",
                fontSize: "14px",
              }}
            >
              <Icon icon="mdi:account-circle-outline" style={{ fontSize: "18px" }} />
              Mentor: {training.mentor}
            </span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>•</span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "rgba(255,255,255,0.85)",
                fontSize: "14px",
              }}
            >
              <Icon icon="mdi:star" style={{ fontSize: "16px", color: "#fbbf24" }} />
              {training.rating}
            </span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>•</span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px" }}>
              {training.alumni} Alumni
            </span>
          </div>
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "48px 32px",
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "48px",
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN */}
        <div>
          {/* Deskripsi Pelatihan */}
          <section style={{ marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "800",
                color: "#111827",
                margin: "0 0 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "28px",
                  height: "4px",
                  background: "#2563eb",
                  borderRadius: "2px",
                  flexShrink: 0,
                }}
              />
              Deskripsi Pelatihan
            </h2>
            {training.description.map((para, i) => (
              <p
                key={i}
                style={{
                  margin: "0 0 14px",
                  fontSize: "15px",
                  color: "#374151",
                  lineHeight: "1.75",
                }}
              >
                {para}
              </p>
            ))}
          </section>

          {/* Kurikulum Belajar */}
          <section style={{ marginBottom: "48px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "800",
                  color: "#111827",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "28px",
                    height: "4px",
                    background: "#2563eb",
                    borderRadius: "2px",
                    flexShrink: 0,
                  }}
                />
                Kurikulum Belajar
              </h2>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#2563eb" }}>
                {training.modules.length * 2 + 2} Modul
              </span>
            </div>

            {training.modules.map((mod, i) => (
              <ModuleAccordion key={mod.id} module={mod} index={i} />
            ))}
          </section>

          {/* Syarat & Ketentuan + Hasil Belajar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "40px",
            }}
          >
            {/* Syarat & Ketentuan */}
            <div
              style={{
                background: "linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 100%)",
                borderRadius: "16px",
                padding: "28px",
                color: "#fff",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "800",
                  margin: "0 0 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Icon icon="mdi:shield-check-outline" style={{ fontSize: "20px" }} />
                Syarat &amp; Ketentuan
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {training.requirements.map((req, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      marginBottom: "10px",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    <Icon
                      icon="mdi:check-circle-outline"
                      style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px", color: "#93c5fd" }}
                    />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Hasil Belajar */}
            <div
              style={{
                background: "linear-gradient(145deg, #312e81 0%, #4c1d95 100%)",
                borderRadius: "16px",
                padding: "28px",
                color: "#fff",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "800",
                  margin: "0 0 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Icon icon="ph:sparkle-fill" style={{ fontSize: "20px", color: "#c4b5fd" }} />
                Hasil Belajar
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {training.outcomes.map((outcome, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      marginBottom: "10px",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    <Icon
                      icon="mdi:check-circle-outline"
                      style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px", color: "#c4b5fd" }}
                    />
                    {outcome}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Kembali Button */}
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 24px",
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#374151",
              cursor: "pointer",
              transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#fff";
            }}
          >
            Kembali
          </button>
        </div>

        {/* RIGHT COLUMN – Sticky Card */}
        <aside>
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
              padding: "28px",
              position: "sticky",
              top: "88px",
            }}
          >
            {/* Price */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "900",
                    color: "#111827",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {training.price === null ? "GRATIS" : formatPrice(training.price)}
                </span>
                <span
                  style={{
                    fontSize: "15px",
                    color: "#9ca3af",
                    textDecoration: "line-through",
                    fontWeight: "500",
                  }}
                >
                  {formatPrice(training.originalPrice)}
                </span>
              </div>
            </div>

            {/* Benefits */}
            <div style={{ marginBottom: "24px" }}>
              {training.benefits.map((benefit, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    marginBottom: "8px",
                    fontSize: "13px",
                    color: "#374151",
                    lineHeight: "1.5",
                  }}
                >
                  <Icon
                    icon={i === 0 ? "mdi:infinity" : "mdi:download-outline"}
                    style={{ fontSize: "16px", color: "#2563eb", flexShrink: 0, marginTop: "1px" }}
                  />
                  {benefit}
                </div>
              ))}
            </div>

            {/* CTA Button ── onClick buka TermsModal */}
            <button
              onClick={() => setShowTerms(true)}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "opacity 0.2s, transform 0.15s",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "0.92";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              Daftar Sekarang
            </button>
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  );
}