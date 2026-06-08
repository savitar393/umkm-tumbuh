import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const relatedTrainings = [
  {
    id: 1,
    title: "Strategic Decision Making",
    duration: "5 Hours",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
  },
  {
    id: 2,
    title: "Machine Learning for Managers",
    duration: "8 Hours",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
  },
  {
    id: 3,
    title: "Cybersecurity Governance",
    duration: "10 Hours",
    thumbnail: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=250&fit=crop",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrainingSuccessPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
      <Header />

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "48px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* ── Grid Layout: Informasi Kursus + Modul ─────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px",
              marginBottom: "48px",
            }}
          >
            {/* ── LEFT: Informasi Kursus ────────────────────────────────────── */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              {/* Header dengan icon */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                <Icon icon="mdi:file-document-outline" style={{ fontSize: "20px", color: "#1a3fa4" }} />
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                  Informasi Kursus
                </h2>
              </div>

              {/* Thumbnail + Training Info */}
              <div style={{ display: "flex", gap: "20px", marginBottom: "32px" }}>
                {/* Thumbnail */}
                <div
                  style={{
                    width: "120px",
                    height: "90px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=150&fit=crop"
                    alt="Training"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#1a3fa4",
                      lineHeight: "1.3",
                    }}
                  >
                    Strategi Data Lanjutan
                  </h3>
                  <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#64748b" }}>
                    Instruktur: Sarah J. Miller, PhD
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      background: "#dbeafe",
                      color: "#1e40af",
                      fontSize: "11px",
                      fontWeight: "600",
                      borderRadius: "6px",
                    }}
                  >
                    DURASI: 12 MINGGU
                  </span>
                </div>
              </div>

              {/* ID Pendaftaran & Akses Berakhir */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ID Pendaftaran
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: "800",
                      color: "#0f172a",
                      fontFamily: "monospace",
                    }}
                  >
                    UPS-{id || "7829"}-XL
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Akses Berakhir
                  </p>
                  <p style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                    Oct 24, 2025
                  </p>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Modul ──────────────────────────────────────────────── */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                <Icon icon="mdi:star-outline" style={{ fontSize: "20px", color: "#1a3fa4" }} />
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                  Modul
                </h2>
              </div>

              {/* Modul List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  {
                    icon: "mdi:briefcase-outline",
                    title: "24 Kerangka Kerja",
                    color: "#1a3fa4",
                  },
                  {
                    icon: "mdi:certificate-outline",
                    title: "Sertifikat Digital Terverifikasi",
                    color: "#1a3fa4",
                  },
                ].map((modul, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px 16px",
                      background: "#f8fafc",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      }}
                    >
                      <Icon icon={modul.icon} style={{ fontSize: "18px", color: modul.color }} />
                    </div>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#334155" }}>
                      {modul.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Jelajahi Konten Terkait ──────────────────────────────────────── */}
          <section>
            <h2
              style={{
                margin: "0 0 28px",
                fontSize: "22px",
                fontWeight: "800",
                color: "#0f172a",
              }}
            >
              Jelajahi Konten Terkait
            </h2>

            {/* Grid 3 Columns */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "24px",
              }}
            >
              {relatedTrainings.map((training) => (
                <div
                  key={training.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)";
                  }}
                  onClick={() => navigate("/umkm/trainings/list")}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: "100%",
                      height: "180px",
                      background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={training.thumbnail}
                      alt={training.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {/* Badge overlay */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        left: "12px",
                        padding: "6px 12px",
                        background: "#1a3fa4",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: "700",
                        borderRadius: "6px",
                        textTransform: "uppercase",
                      }}
                    >
                      DIREKOMENDASI KAN
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: "20px" }}>
                    <h3
                      style={{
                        margin: "0 0 8px",
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#0f172a",
                        lineHeight: "1.4",
                      }}
                    >
                      {training.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                      {training.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Tombol Kembali ──────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "40px",
            }}
          >
            <button
              onClick={() => navigate("/umkm/trainings/list")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 32px",
                background: "linear-gradient(135deg, #1a3fa4 0%, #3b82f6 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(26, 63, 164, 0.35)",
                transition: "transform 0.2s, box-shadow 0.2s",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 8px 24px rgba(26, 63, 164, 0.45)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 4px 14px rgba(26, 63, 164, 0.35)";
              }}
            >
              <Icon icon="mdi:arrow-left" style={{ fontSize: "18px" }} />
              Kembali ke Daftar Pelatihan
            </button>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}