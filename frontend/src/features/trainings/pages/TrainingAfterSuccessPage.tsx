import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const relatedContent = [
  {
    id: 1,
    title: "Strategic Decision Making",
    duration: "6 Hours",
    level: "Advanced",
    badge: "DIREKOMENDASI KAN",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
  },
  {
    id: 2,
    title: "Machine Learning for Managers",
    duration: "8 Hours",
    level: "Intermediate",
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=250&fit=crop",
  },
  {
    id: 3,
    title: "Cybersecurity Governance",
    duration: "10 Hours",
    level: "Professional",
    thumbnail: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=250&fit=crop",
  },
];

const timelineSteps = [
  {
    status: "completed",
    title: "Diajukan",
    date: "24 Okt 2023, 10:45 WIB",
  },
  {
    status: "current",
    title: "Dalam Validasi",
    description: "Sedang dalam proses review teknis",
  },
  {
    status: "pending",
    title: "Terbit",
    description: "Menunggu tanggal selesainya",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrainingAfterSuccessPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const progress = 65;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
      <Header />

      {/* ── Main Content ────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "48px 32px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* ── Top Section: Verification Status ──────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "32px", marginBottom: "56px" }}>
            {/* LEFT: Waiting Status */}
            <div style={{ background: "#fff", borderRadius: "20px", padding: "48px 40px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", textAlign: "center" }}>
              {/* Hourglass Icon */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
                <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon icon="mdi:timer-sand" style={{ fontSize: "60px", color: "#ec4899" }} />
                </div>
              </div>

              <h1 style={{ margin: "0 0 16px", fontSize: "28px", fontWeight: "800", color: "#0f172a", lineHeight: "1.2" }}>
                Menunggu Verifikasi
              </h1>
              <p style={{ margin: "0 0 40px", fontSize: "15px", color: "#64748b", lineHeight: "1.7", maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}>
                Pengajuan pelatihan Anda sedang ditinjau oleh mentor ahli kami. Sertifikat digital akan diterbitkan segera setelah materi Anda disetujui.
              </p>

              {/* Progress Bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Progress Validasi
                  </span>
                  <span style={{ fontSize: "20px", fontWeight: "800", color: "#1a3fa4" }}>{progress}%</span>
                </div>
                <div style={{ width: "100%", height: "10px", background: "#e0e7ff", borderRadius: "5px", overflow: "hidden" }}>
                  <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)", borderRadius: "5px", transition: "width 0.5s ease" }} />
                </div>
                <p style={{ margin: "12px 0 0", fontSize: "13px", color: "#94a3b8" }}>
                  Estimasi waktu penyelesaian: 1-2 hari kerja
                </p>
              </div>
            </div>

            {/* RIGHT: Course Info & Timeline */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Informasi Kursus Card */}
              <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1a3fa4 100%)", borderRadius: "16px", padding: "24px", color: "#fff", boxShadow: "0 4px 16px rgba(26,63,164,0.25)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                  <Icon icon="mdi:information-outline" style={{ fontSize: "22px" }} />
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Informasi Kursus</h3>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: "600", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Pelatihan
                  </p>
                  <p style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#fff" }}>
                    Strategi Data Lanjutan
                  </p>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: "600", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    ID Pendaftaran
                  </p>
                  <p style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#fff", fontFamily: "monospace" }}>
                    UPS-{id || "7829"}-XL
                  </p>
                </div>

                <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.1)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <Icon icon="mdi:shield-check" style={{ fontSize: "24px", color: "#93c5fd" }} />
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: "700", color: "#fff" }}>
                      Sertifikat Terverifikasi
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>
                      Terbit otomatis via Blockchain
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline Proses */}
              <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "17px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon icon="mdi:timeline-clock-outline" style={{ fontSize: "22px", color: "#1a3fa4" }} />
                  Timeline Proses
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {timelineSteps.map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: step.status === "completed" ? "#10b981" : step.status === "current" ? "#3b82f6" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", border: step.status === "current" ? "3px solid #bfdbfe" : "none" }}>
                          {step.status === "completed" && <Icon icon="mdi:check" style={{ fontSize: "18px", color: "#fff" }} />}
                          {step.status === "current" && <div style={{ width: "10px", height: "10px", background: "#fff", borderRadius: "50%" }} />}
                          {step.status === "pending" && <div style={{ width: "8px", height: "8px", background: "#cbd5e1", borderRadius: "50%" }} />}
                        </div>
                        {i < timelineSteps.length - 1 && (
                          <div style={{ width: "2px", height: "32px", background: step.status === "completed" ? "#10b981" : "#e2e8f0", marginTop: "4px" }} />
                        )}
                      </div>
                      <div style={{ flex: 1, paddingTop: "4px" }}>
                        <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: step.status === "current" ? "#3b82f6" : step.status === "completed" ? "#0f172a" : "#94a3b8" }}>
                          {step.title}
                        </p>
                        {(step.date || step.description) && (
                          <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
                            {step.date || step.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Section: Related Content ────────────────────────── */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>
                Jelajahi Konten Terkait
              </h2>
              <button
                onClick={() => navigate("/umkm/trainings/list")}
                style={{ padding: "10px 20px", background: "transparent", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", fontWeight: "600", color: "#1a3fa4", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
                }}
              >
                Lihat Semua
                <Icon icon="mdi:arrow-right" style={{ fontSize: "16px" }} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
              {relatedContent.map((content) => (
                <div
                  key={content.id}
                  style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", cursor: "pointer", transition: "all 0.2s" }}
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
                  <div style={{ position: "relative", width: "100%", height: "180px", overflow: "hidden" }}>
                    <img src={content.thumbnail} alt={content.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {content.badge && (
                      <div style={{ position: "absolute", top: "12px", left: "12px", padding: "6px 12px", background: "#1a3fa4", color: "#fff", fontSize: "10px", fontWeight: "700", borderRadius: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {content.badge}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "20px" }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: "17px", fontWeight: "700", color: "#0f172a", lineHeight: "1.3" }}>
                      {content.title}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "13px", color: "#64748b" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon icon="mdi:clock-outline" style={{ fontSize: "16px" }} />
                        <span>{content.duration}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon icon="mdi:signal" style={{ fontSize: "16px" }} />
                        <span>{content.level}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
