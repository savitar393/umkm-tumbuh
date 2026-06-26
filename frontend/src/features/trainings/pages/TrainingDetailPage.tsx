import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import TermsModal from "./TermsModal";
import { useTrainingDetail, useEnrollTraining } from "../hooks";
import { useTrainingStore } from "../store";
import { getMyProfile } from "../../../shared/api/profile";

function ModuleAccordion({ module: mod, index }: { module: { modul_id: string; judul_modul: string; deskripsi_modul: string | null; durasi_menit: number; is_preview: boolean }; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="module-item" style={{
      border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px 24px",
      marginBottom: "12px", cursor: "pointer", background: "#fff", transition: "box-shadow 0.2s",
    }} onClick={() => setOpen(!open)}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
          <span style={{ fontSize: "22px", fontWeight: "700", color: "#2A7A4B", minWidth: "32px", lineHeight: 1, paddingTop: "2px" }}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: "#111827", lineHeight: "1.4" }}>
              {mod.judul_modul}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>
              {mod.durasi_menit} Menit {mod.is_preview ? "• Preview" : ""}
            </p>
            {open && mod.deskripsi_modul && (
              <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#374151", lineHeight: "1.6" }}>
                {mod.deskripsi_modul}
              </p>
            )}
          </div>
        </div>
        <Icon icon={open ? "mdi:chevron-up" : "mdi:chevron-down"} style={{ fontSize: "22px", color: "#6b7280", flexShrink: 0 }} />
      </div>
    </div>
  );
}

export default function TrainingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: detail, isLoading, error } = useTrainingDetail(id || "");
  const enrollMutation = useEnrollTraining();
  const umkmId = useTrainingStore((s) => s.umkmId);
  const setUmkmId = useTrainingStore((s) => s.setUmkmId);

  const [showTerms, setShowTerms] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const thumbnailSrc = detail?.training.thumbnail_url || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop";

  const handleConfirmRegister = async () => {
    setShowTerms(false);
    let currentUmkmId = umkmId;
    if (!currentUmkmId) {
      const profile = await getMyProfile();
      if (profile?.id) {
        setUmkmId(profile.id);
        currentUmkmId = profile.id;
      }
    }
    if (!currentUmkmId || !id) return;

    enrollMutation.mutate(
      { umkm_id: currentUmkmId, pelatihan_id: id },
      {
        onSuccess: (data) => {
          if (data.already_enrolled) {
            toast("Anda sudah terdaftar di pelatihan ini.");
            navigate("/umkm/trainings");
            return;
          }

          toast.success("Berhasil mendaftar pelatihan!");
          navigate(`/umkm/trainings/${id}/success`, { state: { enrollment: data.enrollment } });
        },
        onError: (err) => {
          toast.error(err?.message || "Gagal mendaftar pelatihan");
        },
      }
    );
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price);

  if (isLoading) {
    return (
      <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
        <Header />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <p style={{ fontSize: 16, color: "#64748b" }}>Memuat detail pelatihan...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
        <Header />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", flexDirection: "column", gap: 12 }}>
          <Icon icon="mdi:alert-circle" style={{ fontSize: 48, color: "#ef4444" }} />
          <p style={{ fontSize: 16, color: "#ef4444", fontWeight: 600 }}>Gagal memuat detail pelatihan</p>
          <button onClick={() => navigate("/umkm/trainings/list")}
            style={{ padding: "10px 24px", background: "#1a3fa4", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
            Kembali ke Daftar
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const training = detail.training;
  const modules = detail.modules;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      <Header />

      <style>{`
        .module-item { transition: box-shadow 0.2s; }
        .module-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
      `}</style>

      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
        padding: "48px 80px 56px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
        <div style={{ position: "absolute", bottom: -120, left: "40%", width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.02)" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
            <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, letterSpacing: 0.8 }}>
              {training.jenis_pelatihan.toUpperCase()}
            </span>
            <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, letterSpacing: 0.8 }}>
              {training.durasi_jam} JAM
            </span>
            {training.akses_seumur_hidup && (
              <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, letterSpacing: 0.8 }}>
                SEUMUR HIDUP
              </span>
            )}
          </div>

          <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, color: "#fff", lineHeight: 1.2, margin: "0 0 12px" }}>
            {training.judul_pelatihan}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                {training.mentor_nama ? training.mentor_nama.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase() : "?"}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.1 }}>Mentor</p>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#fff" }}>{training.mentor_nama || "TBA"}</p>
              </div>
            </div>
            {training.rating_rata_rata && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon icon="mdi:star" style={{ fontSize: "18px", color: "#fbbf24" }} />
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>{training.rating_rata_rata.toFixed(1)}</span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>({training.jumlah_alumni} alumni)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "-24px auto 48px", padding: "0 24px", position: "relative", zIndex: 5 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "32px", alignItems: "start" }}>
          <div>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Tentang Pelatihan Ini</h2>
              <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.7", margin: 0, whiteSpace: "pre-line" }}>
                {training.deskripsi_pelatihan || "Tidak ada deskripsi"}
              </p>
            </div>

            <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 20px" }}>
                Kurikulum ({modules.length} Modul)
              </h2>
              {modules.map((mod, i) => (
                <ModuleAccordion key={mod.modul_id} module={mod} index={i} />
              ))}
            </div>

            <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>Syarat & Ketentuan</h2>
              {training.syarat_ketentuan ? (
                <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.7", margin: 0 }}>{training.syarat_ketentuan}</p>
              ) : (
                <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>Tidak ada syarat khusus</p>
              )}
            </div>
          </div>

          <div style={{ position: "sticky", top: 88 }}>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              {training.harga === 0 ? (
                <div style={{ marginBottom: "20px" }}>
                  <span style={{ fontSize: "32px", fontWeight: 900, color: "#0f172a" }}>Gratis</span>
                </div>
              ) : (
                <div style={{ marginBottom: "20px" }}>
                  <span style={{ fontSize: "32px", fontWeight: 900, color: "#0f172a" }}>{formatPrice(training.harga)}</span>
                </div>
              )}

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#475569" }}>
                  <Icon icon="mdi:check-circle" style={{ fontSize: "18px", color: "#16a34a" }} />
                  {training.total_modul} Modul Pembelajaran
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#475569" }}>
                  <Icon icon="mdi:check-circle" style={{ fontSize: "18px", color: "#16a34a" }} />
                  {training.akses_seumur_hidup ? "Akses Seumur Hidup" : `${training.masa_akses_hari || 0} Hari Akses`}
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#475569" }}>
                  <Icon icon="mdi:check-circle" style={{ fontSize: "18px", color: "#16a34a" }} />
                  Sertifikat Kelulusan
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#475569" }}>
                  <Icon icon="mdi:check-circle" style={{ fontSize: "18px", color: "#16a34a" }} />
                  Mentoring oleh {training.mentor_nama || "Praktisi"}
                </li>
              </ul>

              <button
                onClick={() => setShowTerms(true)}
                disabled={enrollMutation.isPending}
                style={{
                  width: "100%", padding: "16px", border: "none", borderRadius: "12px",
                  background: enrollMutation.isPending ? "#94a3b8" : "linear-gradient(135deg, #1a3fa4 0%, #1e3a8a 100%)",
                  color: "#fff", fontSize: "16px", fontWeight: 700, cursor: enrollMutation.isPending ? "not-allowed" : "pointer",
                  boxShadow: enrollMutation.isPending ? "none" : "0 4px 16px rgba(26,63,164,0.35)",
                  transition: "opacity 0.2s",
                }}
              >
                {enrollMutation.isPending ? "Mendaftarkan..." : "Daftar Sekarang"}
              </button>

              {enrollMutation.isError && (
                <p style={{ margin: "12px 0 0", fontSize: "13px", color: "#ef4444", textAlign: "center" }}>
                  {enrollMutation.error?.message || "Gagal mendaftar"}
                </p>
              )}

              {!thumbError && (
                <img src={thumbnailSrc} alt={training.judul_pelatihan}
                  style={{ width: "100%", borderRadius: 12, marginTop: 16 }}
                  onError={() => setThumbError(true)} />
              )}
            </div>
          </div>
        </div>
      </div>

      <TermsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onConfirm={handleConfirmRegister}
      />

      <Footer />
    </div>
  );
}
