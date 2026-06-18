import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../shared/components/Sidebar";
import backgroundImg from "../../../assets/background1.png";
import { useTrainingStore } from "../store";
import { useCertificateDashboard, useUserCertificates, useRequestCertificate } from "../../certificates/hooks";
import { useUserEnrollments } from "../hooks";
import { getTrainingDetail } from "../api";
import { downloadCertificate } from "../../certificates/api";
import { getMyProfile } from "../../../shared/api/profile";

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
      <path d="M12 2L2 7l10 5 10-5-10-5z" opacity="0.4" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      <path fillRule="evenodd" d="M3.5 7.75L12 12.5l8.5-4.75V17L12 21.5 3.5 17V7.75z" fill={color} />
    </svg>
  );
}
function IconCertificate() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M12 12v9" /><path d="M8.5 18.5 12 21l3.5-2.5" />
      <rect x="3" y="3" width="18" height="14" rx="2" opacity="0.3" fill="white" stroke="none" />
      <path d="M7 8h2M15 8h2M7 11h4" />
    </svg>
  );
}

const card = {
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderRadius: 16,
  boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
  border: "1px solid rgba(255,255,255,0.7)",
};

export default function TrainingDashboardPage() {
  const navigate = useNavigate();
  const umkmId = useTrainingStore((s) => s.umkmId);
  const setUmkmId = useTrainingStore((s) => s.setUmkmId);

  useEffect(() => {
    if (!umkmId) {
      getMyProfile().then((profile) => {
        if (profile?.id) setUmkmId(profile.id);
      });
    }
  }, [umkmId, setUmkmId]);

  const { data: dashboard, isLoading: dashLoading } = useCertificateDashboard(umkmId);
  const { data: enrollments, isLoading: enrollLoading } = useUserEnrollments(umkmId);
  const { data: certificates, isLoading: certLoading } = useUserCertificates(umkmId);

  const ongoing = (enrollments || []).filter(
    (e) => e.status_pendaftaran !== "SELESAI" && !e.tanggal_selesai
  );
  const completed = (enrollments || []).filter(
    (e) => e.status_pendaftaran === "SELESAI" || e.tanggal_selesai
  );
  const certList = certificates || [];
  const requestCertMutation = useRequestCertificate();
  const requestedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!completed.length) return;
    completed.forEach((enrollment) => {
      if (!requestedRef.current.has(enrollment.pendaftaran_pelatihan_id)) {
        requestedRef.current.add(enrollment.pendaftaran_pelatihan_id);
        requestCertMutation.mutate(enrollment.pendaftaran_pelatihan_id);
      }
    });
  }, [completed.length]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif", position: "relative" }}>
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

      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: "cover", backgroundPosition: "center top", backgroundRepeat: "no-repeat",
      }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 1, background: "rgba(240,244,255,0.25)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 10 }}>
        <Sidebar activeLabel="Pelatihan Saya" />
      </div>

      <main style={{ marginLeft: 230, flex: 1, padding: "36px 40px", minHeight: "100vh", position: "relative", zIndex: 5 }}>
        <div className="anim-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0d1b6e", margin: 0, letterSpacing: -0.5 }}>
              Selamat Datang{dashboard ? `, ${dashboard.pelaku_nama}` : ""},
            </h1>
            <p style={{ margin: "4px 0 0", color: "#475569", fontSize: 14.5 }}>
              {dashLoading ? "Memuat data..." : "Mari tingkatkan kualitas UMKM Anda hari ini."}
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate("/umkm/trainings/list")}
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 36 }}>
          <div className="hover-card anim-s0" style={{ ...card, borderRadius: 18, padding: "24px 28px" }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: "#64748b" }}>
              TOTAL PELATIHAN
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, color: "#0d1b6e" }}>
                {dashLoading ? "-" : dashboard?.total_pelatihan ?? 0}
              </span>
              <span style={{ fontSize: 15, fontWeight: 500, opacity: 0.7, color: "#0d1b6e" }}>Kelas</span>
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 12, fontWeight: 600, opacity: 0.7, display: "flex", alignItems: "center", gap: 5, color: "#16a34a" }}>
              <IconTrendingUp /> Data terbaru
            </p>
          </div>

          <div className="hover-card anim-s1" style={{
            background: "linear-gradient(135deg, #1a237e, #1565c0)",
            borderRadius: 18, padding: "24px 28px",
            boxShadow: "0 8px 32px rgba(21,101,192,0.3)",
          }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: "rgba(255,255,255,0.75)" }}>
              SELESAI
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, color: "#fff" }}>
                {enrollLoading ? "-" : completed.length}
              </span>
              <span style={{ fontSize: 15, fontWeight: 500, opacity: 0.7, color: "#fff" }}>Topik</span>
            </div>
            <div style={{ marginTop: 14, background: "rgba(255,255,255,0.25)", borderRadius: 99, height: 5 }}>
              <div style={{
                width: `${dashboard?.total_pelatihan ? Math.min(100, (completed.length / dashboard.total_pelatihan) * 100) : 0}%`,
                background: "#fff", borderRadius: 99, height: 5, transition: "width 0.7s ease"
              }} />
            </div>
          </div>

          <div className="hover-card anim-s2" style={{ ...card, borderRadius: 18, padding: "24px 28px" }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: "#64748b" }}>
              SERTIFIKAT
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, color: "#0d1b6e" }}>
                {certLoading ? "-" : certList.length}
              </span>
              <span style={{ fontSize: 15, fontWeight: 500, opacity: 0.7 }}>Diterbitkan</span>
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 12, fontWeight: 600, opacity: 0.7, display: "flex", alignItems: "center", gap: 5, color: "#1565c0" }}>
              <IconCheckCircle /> {dashboard?.sertifikat_terbit ?? 0} Sudah Terbit
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0d1b6e" }}>
                  Pelatihan Berjalan
                </h2>
                <button
                  onClick={() => navigate("/umkm/trainings/list")}
                  style={{ background: "none", border: "none", color: "#1565c0", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}
                >
                  Lihat Semua
                </button>
              </div>
              {ongoing.length === 0 ? (
                <div style={{ ...card, padding: "32px 24px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                  Belum ada pelatihan berjalan. Yuk, daftar pelatihan baru!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {ongoing.slice(0, 3).map((e, i) => (
                    <div
                      key={e.pendaftaran_pelatihan_id}
                      className={`hover-card anim-t${i}`}
                      onClick={async () => {
                        try {
                          const detail = await getTrainingDetail(e.pelatihan_id);
                          const nextModule = detail.modules[e.modul_selesai] || detail.modules[0];
                          navigate(`/umkm/trainings/${e.pelatihan_id}/lesson/${nextModule.modul_id}`);
                        } catch {
                          navigate(`/umkm/trainings/${e.pelatihan_id}`);
                        }
                      }}
                      style={{ ...card, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <div style={{
                        width: 70, height: 70, borderRadius: 12, flexShrink: 0,
                        background: "linear-gradient(135deg, #1a237e20, #1565c020)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24, fontWeight: 700, color: "#1a237e",
                      }}>
                        {e.judul_pelatihan?.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 14.5, color: "#0d1b6e", lineHeight: 1.3 }}>
                          {e.judul_pelatihan}
                        </p>
                        <div style={{ display: "flex", gap: 14, color: "#64748b", fontSize: 12, marginBottom: 10, alignItems: "center" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <IconBook /> {e.modul_selesai}/{e.total_modul_snapshot} Modul
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ flex: 1, background: "#e2e8f0", borderRadius: 99, height: 6 }}>
                            <div style={{
                              width: `${e.progress_persen}%`,
                              background: e.progress_persen === 100 ? "#16a34a" : "#f59e0b",
                              borderRadius: 99, height: 6, transition: "width 0.7s ease"
                            }} />
                          </div>
                          <span style={{
                            fontSize: 12, fontWeight: 800,
                            color: e.progress_persen === 100 ? "#16a34a" : "#f59e0b",
                            whiteSpace: "nowrap"
                          }}>
                            {Math.round(e.progress_persen)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 800, color: "#0d1b6e" }}>
                Pelatihan Selesai
              </h2>
              {completed.length === 0 ? (
                <div style={{ ...card, padding: "32px 24px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                  Belum ada pelatihan yang selesai.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {completed.slice(0, 4).map((e) => (
                    <div
                      key={e.pendaftaran_pelatihan_id}
                      className="hover-card"
                      onClick={() => navigate(`/umkm/trainings/${e.pelatihan_id}/verification`)}
                      style={{ ...card, padding: "20px", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 14, background: "#e0f2fe",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <IconBox size={28} color="#0369a1" />
                      </div>
                      <div>
                        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#64748b" }}>
                          {e.judul_pelatihan?.substring(0, 20)}...
                        </p>
                        <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 14, color: "#0d1b6e" }}>
                          {e.judul_pelatihan?.substring(0, 25)}
                        </p>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, color: "#16a34a", background: "#dcfce7", borderRadius: 6, padding: "3px 8px" }}>
                          SELESAI
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="anim-right">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0d1b6e" }}>Sertifikat Saya</h2>
            </div>
            {certList.length === 0 ? (
              <div style={{ ...card, padding: "32px 24px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                Belum ada sertifikat. Selesaikan pelatihan untuk mendapatkan sertifikat.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {certList.slice(0, 5).map((c, i) => (
                  <div
                    key={c.sertifikat_id}
                    className="hover-lift"
                    style={{
                      ...card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14,
                      animation: "fadeSlideUp 0.45s ease both",
                      animationDelay: `${0.45 + i * 0.08}s`,
                    }}
                  >
                    <div className="cert-icon" style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: "linear-gradient(135deg, #1a237e, #1565c0)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, boxShadow: "0 4px 12px rgba(21,101,192,0.3)",
                    }}>
                      <IconCertificate />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: "#0d1b6e" }}>
                        {c.judul_pelatihan}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                        {c.tanggal_terbit
                          ? `Terbit ${new Date(c.tanggal_terbit).toLocaleDateString("id-ID")}`
                          : `Diajukan ${c.tanggal_pengajuan ? new Date(c.tanggal_pengajuan).toLocaleDateString("id-ID") : "-"}`
                        }
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 600, color: c.status_sertifikat_id === "TERBIT" ? "#16a34a" : "#f59e0b" }}>
                        {c.nama_status_sertifikat}
                      </p>
                    </div>
                    {c.status_sertifikat_id === "TERBIT" && (
                      <button
                        className="btn-dl"
                        title={c.nomor_sertifikat || "Download Sertifikat"}
                        onClick={() => downloadCertificate(c.sertifikat_id)}
                      >
                        <IconDownload />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
