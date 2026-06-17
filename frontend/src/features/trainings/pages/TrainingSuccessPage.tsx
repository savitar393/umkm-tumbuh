import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { useTrainings } from "../hooks";
import type { Enrollment } from "../types";

const relatedThumbnails = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=250&fit=crop",
];

export default function TrainingSuccessPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const enrollment = (location.state as { enrollment?: Enrollment })?.enrollment;
  const { data: trainings } = useTrainings();

  const related = (trainings || []).filter((t) => t.pelatihan_id !== id).slice(0, 3);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
      <Header />

      <main style={{ flex: 1, padding: "48px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "48px" }}>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon icon="mdi:check-circle" style={{ fontSize: "36px", color: "#16a34a" }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                    Pendaftaran Berhasil!
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748b" }}>
                    Selamat, Anda telah terdaftar di pelatihan ini
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {enrollment && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "13px", color: "#64748b" }}>ID Pendaftaran</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{enrollment.pendaftaran_pelatihan_id}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "13px", color: "#64748b" }}>Status</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#16a34a" }}>{enrollment.status_pendaftaran}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "13px", color: "#64748b" }}>Tanggal Daftar</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                        {new Date(enrollment.tanggal_daftar).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                    </div>
                    {enrollment.akses_berakhir_at && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                        <span style={{ fontSize: "13px", color: "#64748b" }}>Akses Berakhir</span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                          {new Date(enrollment.akses_berakhir_at).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {!enrollment && (
                  <p style={{ fontSize: "14px", color: "#94a3b8" }}>Data pendaftaran tidak tersedia.</p>
                )}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 20px" }}>Modul Pelatihan</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {enrollment && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon icon="mdi:book-open-page-variant" style={{ fontSize: "20px", color: "#0284c7" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{enrollment.judul_pelatihan}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                        {enrollment.total_modul_snapshot} Modul • {enrollment.modul_selesai} Selesai
                      </p>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#f0fdf4", borderRadius: "8px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon icon="mdi:certificate-outline" style={{ fontSize: "20px", color: "#16a34a" }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Sertifikat</p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                      Dapatkan setelah menyelesaikan semua modul
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <section>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 20px" }}>Jelajahi Konten Terkait</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
                {related.map((t, i) => (
                  <div
                    key={t.pelatihan_id}
                    onClick={() => navigate(`/umkm/trainings/${t.pelatihan_id}`)}
                    style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", cursor: "pointer", transition: "transform 0.2s" }}
                  >
                    <div style={{ height: "160px", background: "linear-gradient(135deg, #1a3fa4, #2563eb)", position: "relative" }}>
                      <img src={t.thumbnail_url || relatedThumbnails[i % relatedThumbnails.length]} alt={t.judul_pelatihan}
                        style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    <div style={{ padding: "16px" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>{t.judul_pelatihan}</h4>
                      <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{t.durasi_jam} Jam • {t.jenis_pelatihan}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div style={{ textAlign: "center", marginTop: "48px" }}>
            <button
              onClick={() => navigate("/umkm/trainings")}
              style={{ padding: "14px 32px", background: "#1a3fa4", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(26,63,164,0.3)" }}
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
