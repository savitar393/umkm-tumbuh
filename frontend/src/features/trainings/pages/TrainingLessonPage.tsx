import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useTrainingDetail, useUpdateProgress, useUserEnrollments } from "../hooks";
import { useTrainingStore } from "../store";
import { getCurrentUser, clearAuthStorage } from "../../../shared/auth/currentUser";

export default function TrainingLessonPage() {
  const navigate = useNavigate();
  const { id, lessonId } = useParams<{ id: string; lessonId: string }>();
  const { data: detail, isLoading } = useTrainingDetail(id || "");
  const updateProgress = useUpdateProgress();
  const umkmId = useTrainingStore((s) => s.umkmId);
  const { data: enrollments } = useUserEnrollments(umkmId);

  const enrollment = (enrollments || []).find((e) => e.pelatihan_id === id);
  const modules = detail?.modules || [];
  const currentIndex = modules.findIndex((m) => m.modul_id === lessonId);
  const currentModule = modules[currentIndex] || modules[0];

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuthStorage();
    navigate("/login");
  };

  const completedModules = useTrainingStore((s) => s.lessonState.completedModules);
  const markModuleCompleted = useTrainingStore((s) => s.markModuleCompleted);
  const setCompletedModules = useTrainingStore((s) => s.setCompletedModules);

  const trainingModuleIds = modules.map((m) => m.modul_id);
  const trainingCompleted = completedModules.filter((id) => trainingModuleIds.includes(id));

  useEffect(() => {
    if (enrollment && enrollment.modul_selesai > 0 && modules.length > 0) {
      const apiModuleIds = modules.slice(0, enrollment.modul_selesai).map((m) => m.modul_id);
      const otherModuleIds = completedModules.filter((id) => !trainingModuleIds.includes(id));
      const merged = [...new Set([...otherModuleIds, ...apiModuleIds])];
      if (merged.length !== completedModules.length || !merged.every((id) => completedModules.includes(id))) {
        setCompletedModules(merged);
      }
    }
  }, [enrollment, modules, completedModules, setCompletedModules, trainingModuleIds]);

  const handleComplete = () => {
    if (!currentModule || !enrollment) return;
    const moduleId = currentModule.modul_id;
    const newCompleted = [...new Set([...trainingCompleted, moduleId])];
    updateProgress.mutate(
      {
        pendaftaran_pelatihan_id: enrollment.pendaftaran_pelatihan_id,
        modul_selesai: newCompleted.length,
        total_modul: modules.length,
      },
      {
        onSuccess: () => {
          markModuleCompleted(moduleId);
        },
        onError: () => {
          alert("Gagal menyimpan progress. Silakan coba lagi.");
        },
      }
    );
  };

  const isCompleted = (moduleId: string) => trainingCompleted.includes(moduleId);
  const isCurrent = (moduleId: string) => moduleId === (lessonId || modules[0]?.modul_id);

  const progressPercent = modules.length > 0 ? Math.min(100, Math.round((trainingCompleted.length / modules.length) * 100)) : 0;

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f8fafc" }}>
        <p style={{ fontSize: 16, color: "#64748b" }}>Memuat materi pembelajaran...</p>
      </div>
    );
  }

  if (!detail || modules.length === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f8fafc", flexDirection: "column", gap: 12 }}>
        <Icon icon="mdi:alert-circle" style={{ fontSize: 48, color: "#ef4444" }} />
        <p style={{ fontSize: 16, color: "#ef4444", fontWeight: 600 }}>Materi tidak ditemukan</p>
        <button onClick={() => navigate("/umkm/trainings")} style={{ padding: "10px 24px", background: "#1a3fa4", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ width: 280, background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)", color: "#fff", display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
            {detail.training.judul_pelatihan}
          </h3>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{detail.training.durasi_jam} Jam • {modules.length} Modul</p>
        </div>

        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: "#94a3b8" }}>
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 6 }}>
            <div style={{ width: `${progressPercent}%`, background: "#3b82f6", borderRadius: 99, height: 6, transition: "width 0.5s" }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          {modules.map((mod) => {
            const done = isCompleted(mod.modul_id);
            const curr = isCurrent(mod.modul_id);
            const locked = !done && !curr && !modules.slice(0, modules.indexOf(mod)).every((m) => isCompleted(m.modul_id) || m.modul_id === lessonId);

            return (
              <div
                key={mod.modul_id}
                onClick={() => !locked && navigate(`/umkm/trainings/${id}/lesson/${mod.modul_id}`)}
                style={{
                  padding: "14px 20px", cursor: locked ? "not-allowed" : "pointer",
                  background: curr ? "rgba(59,130,246,0.15)" : "transparent",
                  borderLeft: curr ? "3px solid #3b82f6" : "3px solid transparent",
                  opacity: locked ? 0.4 : 1, transition: "background 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: done ? "#16a34a" : curr ? "#3b82f6" : "rgba(255,255,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {done ? <Icon icon="mdi:check" style={{ fontSize: 14, color: "#fff" }} /> :
                      curr ? <Icon icon="mdi:play" style={{ fontSize: 12, color: "#fff" }} /> :
                        <Icon icon="mdi:lock" style={{ fontSize: 12, color: "#94a3b8" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: curr ? 700 : 500, color: "#fff", lineHeight: 1.3 }}>{mod.judul_modul}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{mod.durasi_menit} Menit</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={() => {
              useTrainingStore.getState().resetLessonState();
              navigate("/umkm/trainings");
            }}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13, padding: 0 }}
          >
            <Icon icon="mdi:logout" style={{ fontSize: 18 }} />
            Keluar
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => navigate("/umkm/trainings")} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
              <Icon icon="mdi:arrow-left" style={{ fontSize: 20 }} />
            </button>
            <span style={{ fontSize: 13, color: "#64748b" }}>Pelatihan</span>
            <Icon icon="mdi:chevron-right" style={{ fontSize: 16, color: "#cbd5e1" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{currentModule?.judul_modul || "Materi"}</span>
          </div>
          <div ref={profileRef} style={{ position: "relative" }}>
            <div
              onClick={() => setProfileOpen(!profileOpen)}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
            >
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #FFD700, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(255,215,0,0.3)" }}>
                <Icon icon="mdi:account" style={{ fontSize: 18, color: "#1a3fa4" }} />
              </div>
              <span style={{ color: "#0f172a", fontWeight: 600, fontSize: 13 }}>{user?.full_name || "User UMKM"}</span>
              <Icon icon={profileOpen ? "mdi:chevron-up" : "mdi:chevron-down"} style={{ fontSize: 16, color: "#94a3b8" }} />
            </div>

            {profileOpen && (
              <div style={{
                position: "absolute", top: "100%", right: 0, marginTop: 8,
                background: "#fff", borderRadius: 14, minWidth: 220,
                boxShadow: "0 12px 48px rgba(0,0,0,0.18)", zIndex: 200,
                padding: "8px 0", overflow: "hidden",
              }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{user?.full_name || "User UMKM"}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>{user?.email || "user@example.com"}</p>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#1a3fa4", background: "#e0e7ff", padding: "2px 10px", borderRadius: 6, display: "inline-block", marginTop: 7 }}>{user?.role || "UMKM"}</span>
                </div>
                <div style={{ padding: "4px 0" }}>
                  <button onClick={() => { navigate("/umkm/trainings"); setProfileOpen(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", border: "none", background: "none", width: "100%", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#334155", textAlign: "left" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    <Icon icon="mdi:view-dashboard" style={{ fontSize: 18, color: "#1a3fa4" }} />
                    Dashboard UMKM
                  </button>
                </div>
                <div style={{ borderTop: "1px solid #f1f5f9", padding: "4px 0" }}>
                  <button onClick={handleLogout}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", border: "none", background: "none", width: "100%", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#ef4444", textAlign: "left" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    <Icon icon="mdi:logout" style={{ fontSize: 18 }} />
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, padding: "40px 48px", overflowY: "auto" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 24px" }}>
            {currentModule?.judul_modul || "Materi"}
          </h1>

          {currentModule?.deskripsi_modul && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>
                {currentModule.deskripsi_modul}
              </p>
            </div>
          )}

          {currentModule?.materi_url && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>Materi Pendukung</h3>
              <a href={currentModule.materi_url} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#eff6ff", color: "#1a3fa4", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                <Icon icon="mdi:open-in-new" style={{ fontSize: 18 }} />
                Buka Materi
              </a>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32 }}>
            <div>
              {currentIndex > 0 && (
                <button
                  onClick={() => {
                    const prev = modules[currentIndex - 1];
                    navigate(`/umkm/trainings/${id}/lesson/${prev.modul_id}`);
                  }}
                  style={{ padding: "10px 20px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Icon icon="mdi:arrow-left" /> Sebelumnya
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleComplete}
                disabled={isCompleted(currentModule?.modul_id || "")}
                style={{
                  padding: "12px 28px", border: "none", borderRadius: 10,
                  background: isCompleted(currentModule?.modul_id || "") ? "#e2e8f0" : "#1a3fa4",
                  color: isCompleted(currentModule?.modul_id || "") ? "#94a3b8" : "#fff",
                  fontSize: 14, fontWeight: 700, cursor: isCompleted(currentModule?.modul_id || "") ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {isCompleted(currentModule?.modul_id || "") ? "Selesai" : "Tandai Selesai"}
                <Icon icon="mdi:check" style={{ fontSize: 18 }} />
              </button>
              {currentIndex < modules.length - 1 && (
                <button
                  onClick={() => {
                    const next = modules[currentIndex + 1];
                    navigate(`/umkm/trainings/${id}/lesson/${next.modul_id}`);
                  }}
                  style={{ padding: "12px 28px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                >
                  Selanjutnya <Icon icon="mdi:arrow-right" />
                </button>
              )}
              {currentIndex === modules.length - 1 && (
                <button
                  onClick={() => navigate(`/umkm/trainings/${id}/evaluation`)}
                  style={{ padding: "12px 28px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                >
                  Lanjut ke Evaluasi
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
