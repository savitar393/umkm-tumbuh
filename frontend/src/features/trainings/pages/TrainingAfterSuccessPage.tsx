import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { useTrainingStore } from "../store";
import { useUserCertificates, useRequestCertificate } from "../../certificates/hooks";
import { getCertificateDownloadUrl } from "../../certificates/api";
import { useUserEnrollments } from "../hooks";

const relatedContent = [
  {
    id: 1, title: "Strategic Decision Making", duration: "6 Hours", level: "Advanced",
    badge: "DIREKOMENDASIKAN",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
  },
  {
    id: 2, title: "Machine Learning for Managers", duration: "8 Hours", level: "Intermediate",
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=250&fit=crop",
  },
  {
    id: 3, title: "Cybersecurity Governance", duration: "10 Hours", level: "Professional",
    thumbnail: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=250&fit=crop",
  },
];

function getTimelineSteps(certStatus?: string, certDate?: string, certDesc?: string) {
  return [
    {
      status: certStatus ? "completed" : "current",
      title: "Diajukan",
      date: certDate || "Baru diajukan",
    },
    {
      status: certStatus === "TERBIT" ? "completed" : certStatus === "DIAJUKAN" ? "current" : "pending",
      title: "Dalam Validasi",
      description: certStatus === "DIAJUKAN" ? "Sedang dalam proses review" : certDesc || "Menunggu pengajuan",
    },
    {
      status: certStatus === "TERBIT" ? "completed" : "pending",
      title: "Terbit",
      description: certStatus === "TERBIT" ? `Terbit ${certDate}` : "Menunggu validasi",
    },
  ];
}

export default function TrainingAfterSuccessPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const umkmId = useTrainingStore((s) => s.umkmId);
  const { data: certificates } = useUserCertificates(umkmId);
  const { data: enrollments } = useUserEnrollments(umkmId);

  const requestCertMutation = useRequestCertificate();
  const requestedRef = useRef(false);

  const cert = (certificates || []).find((c) => c.pelatihan_id === id);
  const enrollment = (enrollments || []).find((e) => e.pelatihan_id === id);
  const progress = enrollment?.progress_persen || 65;
  const timelineSteps = getTimelineSteps(cert?.status_sertifikat_id, cert?.tanggal_terbit || undefined, cert?.catatan_validasi || undefined);

  useEffect(() => {
    if (!requestedRef.current && enrollment && enrollment.status_pendaftaran === "SELESAI") {
      requestedRef.current = true;
      requestCertMutation.mutate(enrollment.pendaftaran_pelatihan_id);
    }
  }, [enrollment]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
      <Header />
      <main style={{ flex: 1, maxWidth: 1100, margin: "0 auto", padding: "48px 24px", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32 }}>
          <div>
            <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: requestCertMutation.isPending ? "#e0e7ff" : "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  {requestCertMutation.isPending ? (
                    <Icon icon="mdi:loading" style={{ fontSize: 40, color: "#1a3fa4" }} />
                  ) : cert?.status_sertifikat_id === "TERBIT" ? (
                    <Icon icon="mdi:check-circle" style={{ fontSize: 40, color: "#16a34a" }} />
                  ) : (
                    <Icon icon="mdi:clock-outline" style={{ fontSize: 40, color: "#d97706" }} />
                  )}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                  {requestCertMutation.isPending ? "Menerbitkan Sertifikat..." : cert?.status_sertifikat_id === "TERBIT" ? "Sertifikat Terbit" : "Menunggu Verifikasi"}
                </h2>
                <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                  {requestCertMutation.isPending ? "Mohon tunggu, sertifikat sedang diproses..." : cert?.status_sertifikat_id === "TERBIT" ? "Selamat! Sertifikat Anda telah diterbitkan." : "Evaluasi Anda sedang dalam proses review oleh tim kurator"}
                </p>
              </div>

              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#64748b" }}>
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div style={{ background: "#e2e8f0", borderRadius: 99, height: 8 }}>
                  <div style={{ width: `${progress}%`, background: "linear-gradient(90deg, #3b82f6, #1a3fa4)", borderRadius: 99, height: 8, transition: "width 0.7s" }} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {timelineSteps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, position: "relative", paddingBottom: i < timelineSteps.length - 1 ? 32 : 0 }}>
                    {i < timelineSteps.length - 1 && (
                      <div style={{ position: "absolute", left: 15, top: 32, width: 2, height: 40, background: step.status === "completed" ? "#16a34a" : "#e2e8f0" }} />
                    )}
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      background: step.status === "completed" ? "#16a34a" : step.status === "current" ? "#3b82f6" : "#e2e8f0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {step.status === "completed" ? (
                        <Icon icon="mdi:check" style={{ fontSize: 18, color: "#fff" }} />
                      ) : step.status === "current" ? (
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff" }} />
                      ) : (
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#94a3b8" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, paddingTop: 4 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: step.status === "pending" ? "#94a3b8" : "#0f172a" }}>
                        {step.title}
                      </p>
                      {step.date && <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{step.date}</p>}
                      {step.description && !step.date && <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{step.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon icon="mdi:book-open-page-variant" style={{ fontSize: 24, color: "#3b82f6" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    {enrollment?.judul_pelatihan || "Pelatihan"}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                    ID: {enrollment?.pendaftaran_pelatihan_id || "-"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#f0fdf4", borderRadius: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon icon="mdi:certificate-outline" style={{ fontSize: 20, color: "#16a34a" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Sertifikat</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                    {cert?.nomor_sertifikat ? `No: ${cert.nomor_sertifikat}` : "Terbit otomatis via Blockchain"}
                  </p>
                </div>
              </div>
              {cert?.nomor_sertifikat && (
                <p style={{ fontSize: 11, color: "#94a3b8", margin: "8px 0 0" }}>
                  Status: {cert.nama_status_sertifikat}
                </p>
              )}
              {cert?.status_sertifikat_id === "TERBIT" && (
                <button
                  onClick={() => window.open(getCertificateDownloadUrl(cert.sertifikat_id), "_blank")}
                  style={{
                    marginTop: 12, width: "100%", padding: "10px 16px",
                    background: "linear-gradient(135deg, #1a3fa4, #1e3a8a)", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <Icon icon="mdi:download" style={{ fontSize: 18 }} />
                  Download Sertifikat PDF
                </button>
              )}
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Akses Cepat</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => navigate("/umkm/trainings")}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#475569", fontWeight: 600 }}>
                  <Icon icon="mdi:view-dashboard" style={{ fontSize: 18 }} />
                  Dashboard Pelatihan
                </button>
                <button onClick={() => navigate(`/umkm/trainings/${id}`)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#475569", fontWeight: 600 }}>
                  <Icon icon="mdi:book-open" style={{ fontSize: 18 }} />
                  Detail Pelatihan
                </button>
              </div>
            </div>
          </div>
        </div>

        <section style={{ marginTop: 48 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 20px" }}>Jelajahi Konten Terkait</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {relatedContent.map((item) => (
              <div key={item.id} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", cursor: "pointer" }}>
                <img src={item.thumbnail} alt={item.title} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                <div style={{ padding: 16 }}>
                  {item.badge && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#1a3fa4", background: "#e0e7ff", padding: "2px 8px", borderRadius: 4, display: "inline-block", marginBottom: 6 }}>
                      {item.badge}
                    </span>
                  )}
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>{item.title}</h4>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{item.duration} • {item.level}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
