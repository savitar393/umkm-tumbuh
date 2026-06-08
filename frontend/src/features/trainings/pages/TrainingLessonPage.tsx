import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lesson {
  id: number;
  title: string;
  duration: string;
  status: "completed" | "current" | "locked";
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const lessons: Lesson[] = [
  { id: 1, title: "01. Penganalan Data UMKM", duration: "12 Menit • Selesai", status: "completed" },
  { id: 2, title: "02. Koleksi Data Strategis", duration: "25 Menit • Selesai", status: "completed" },
  { id: 3, title: "03. Struktur Data Modern", duration: "Sedang Dipelajari", status: "current" },
  { id: 4, title: "04. Proyek Akhir", duration: "5 Menit • Belum Tersedia", status: "locked" },
];

const keyPoints = [
  "Identifikasi jenis data pelanggan.",
  "Penggunaan alat analitik yang efisien.",
  "Keamanan dan privasi data konsumen.",
];

const whyImportant = [
  {
    title: "Segmentasi Pelanggan:",
    description: "Pisahkan data berdasarkan perilaku pembelian, frekuensi kunjungan, dan preferensi produk.",
  },
  {
    title: "Optimasi Inventaris:",
    description: "Gunakan data penjualan untuk memprediksi kapan Anda harus memesan stok baru agar tidak terjadi penumpukan atau kekurangan.",
  },
  {
    title: "Personalisasi Pemasaran:",
    description: "Kirimkan penawaran yang relevan kepada pelanggan yang tepat berdasarkan riwayat transaksi mereka.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrainingLessonPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [progress] = useState(75);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f7fa" }}>
      {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
      <aside style={{ width: "280px", background: "#1a3fa4", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }}>
          {/* Progress */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#fff" }}>Progres Anda</span>
              <span style={{ fontSize: "12px", fontWeight: "700", background: "#fbbf24", color: "#1a3fa4", padding: "4px 12px", borderRadius: "6px" }}>
                {progress}% SELESAI
              </span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.2)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "#fff", borderRadius: "4px", transition: "width 0.3s" }} />
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>6 dari 8 materi telah diselesaikan</p>
          </div>

          {/* Daftar Materi Card */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>Daftar Materi</h3>
              <Icon icon="mdi:format-list-bulleted" style={{ fontSize: "20px", color: "#64748b" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {lessons.map((lesson) => (
                <div key={lesson.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: lesson.status === "locked" ? "not-allowed" : "pointer", opacity: lesson.status === "locked" ? 0.5 : 1, transition: "opacity 0.2s" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: lesson.status === "completed" ? "#10b981" : lesson.status === "current" ? "#3b82f6" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                    {lesson.status === "completed" && <Icon icon="mdi:check" style={{ fontSize: "14px", color: "#fff" }} />}
                    {lesson.status === "current" && <div style={{ width: "10px", height: "10px", background: "#fff", borderRadius: "50%" }} />}
                    {lesson.status === "locked" && <Icon icon="mdi:lock" style={{ fontSize: "12px", color: "#94a3b8" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: lesson.status === "current" ? "700" : "600", color: lesson.status === "current" ? "#3b82f6" : "#0f172a", lineHeight: "1.4" }}>{lesson.title}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.3" }}>{lesson.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Logout */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <button onClick={() => navigate("/")} style={{ width: "100%", padding: "12px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-start", transition: "all 0.2s" }}>
            <Icon icon="mdi:logout" style={{ fontSize: "20px" }} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
        {/* Top Bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b" }}>
            <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>Courses</span>
            <Icon icon="mdi:chevron-right" style={{ fontSize: "16px" }} />
            <span style={{ cursor: "pointer" }} onClick={() => navigate("/umkm/trainings")}>Guided Data Training</span>
            <Icon icon="mdi:chevron-right" style={{ fontSize: "16px" }} />
            <span style={{ color: "#1a3fa4", fontWeight: "600" }}>Pendalaman Data Strategi</span>
          </div>

          <div style={{ position: "relative", flex: 1, maxWidth: "420px" }}>
            <Icon icon="mdi:magnify" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "20px", color: "#94a3b8" }} />
            <input type="text" placeholder="Search lessons, resources..." style={{ width: "100%", padding: "10px 14px 10px 44px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
              <Icon icon="mdi:bell-outline" style={{ fontSize: "20px" }} />
            </button>
            <button style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
              <Icon icon="mdi:help-circle-outline" style={{ fontSize: "20px" }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "6px" }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#0f172a", lineHeight: "1.2" }}>Budi Santoso</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b", lineHeight: "1.2" }}>Professional Student</p>
              </div>
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "15px" }}>BS</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px" }}>
          <div style={{ maxWidth: "920px", margin: "0 auto" }}>
            <h1 style={{ margin: "0 0 18px", fontSize: "32px", fontWeight: "800", color: "#0f172a", lineHeight: "1.2" }}>Pendalaman Strategi Data</h1>
            <p style={{ margin: "0 0 32px", fontSize: "15px", color: "#475569", lineHeight: "1.75" }}>
              Dalam lanskap bisnis digital saat ini, data bukan lagi sekadar informasi tambahan, melainkan aset strategis utama yang dapat menentukan arah pertumbuhan usaha Mikro, Kecil, dan Menengah (UMKM). Memahami struktur data modern memungkinkan Anda untuk membuat keputusan yang berbasis bukti (evidence-based decision making).
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "40px" }}>
              <div style={{ background: "#f0f9ff", border: "3px solid #1a3fa4", borderRadius: "16px", padding: "26px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                  <Icon icon="mdi:lightbulb-on-outline" style={{ fontSize: "24px", color: "#1a3fa4" }} />
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>Poin Utama Pembelajaran</h3>
                </div>
                <ol style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {keyPoints.map((point, i) => (
                    <li key={i} style={{ fontSize: "14px", color: "#334155", lineHeight: "1.6", fontWeight: "500" }}>{point}</li>
                  ))}
                </ol>
              </div>
              <div style={{ background: "#7d9a9e", borderRadius: "16px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop" alt="Data Analytics" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }} />
              </div>
            </div>

            <h2 style={{ margin: "0 0 20px", fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>Mengapa Struktur Data Itu Penting?</h2>
            <p style={{ margin: "0 0 24px", fontSize: "15px", color: "#475569", lineHeight: "1.75" }}>
              Seringkali, UMKM mengumpulkan data tetapi tidak tahu cara menyusunnya. Tanpa struktur yang jelas, data tersebut menjadi tumpukan angka yang tidak bermakna. Berikut adalah beberapa langkah untuk memulai:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "48px" }}>
              {whyImportant.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "18px 20px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                    <Icon icon="mdi:check" style={{ fontSize: "18px", color: "#0284c7" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>{item.title}</p>
                    <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.65" }}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
              <button onClick={() => navigate(-1)} style={{ padding: "14px 28px", background: "#fff", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", fontWeight: "600", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}>
                <Icon icon="mdi:arrow-left" style={{ fontSize: "18px" }} />
                Materi Sebelumnya
              </button>
              <button onClick={() => navigate(`/umkm/trainings/${id}/lesson/4`)} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #1a3fa4 0%, #1e3a8a 100%)", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(26,63,164,0.3)", transition: "all 0.2s" }}>
                Materi Berikutnya
                <Icon icon="mdi:arrow-right" style={{ fontSize: "18px" }} />
              </button>
            </div>
          </div>
        </div>
      </main>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
