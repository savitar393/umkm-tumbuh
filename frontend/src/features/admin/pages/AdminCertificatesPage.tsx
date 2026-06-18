import { useEffect, useState, useCallback, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  listCertificates,
  approveCertificate,
  rejectCertificate,
  getCertificateStats,
  type Certificate,
} from "../api";
import bgImage from "../../../assets/background1.png";

type StatusFilter = "" | "DIAJUKAN" | "TERBIT" | "DITOLAK";
const LIMIT = 20;

const sortableColumns = [
  { key: "pelaku_nama", label: "User" },
  { key: "judul_pelatihan", label: "Pelatihan" },
  { key: "tanggal_pengajuan", label: "Tanggal" },
  { key: "status_sertifikat_id", label: "Status" },
  { key: "progress_persen", label: "Progress" },
];

const filterMeta: Record<string, { label: string; color: string }> = {
  "": { label: "Semua", color: "#1a3fa4" },
  DIAJUKAN: { label: "Diajukan", color: "#f59e0b" },
  TERBIT: { label: "Terbit", color: "#16a34a" },
  DITOLAK: { label: "Ditolak", color: "#dc2626" },
};

const s = {
  btn: (bg: string, color: string, disabled = false): React.CSSProperties => ({
    padding: "7px 16px", borderRadius: 8, border: "none",
    background: disabled ? "#e2e8f0" : bg, color: disabled ? "#94a3b8" : color,
    fontWeight: 600, fontSize: 12, cursor: disabled ? "default" : "pointer",
    transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: 6,
    boxShadow: disabled ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
    opacity: disabled ? 0.6 : 1,
  }),
  btnOutline: (active: boolean, color: string): React.CSSProperties => ({
    padding: "7px 20px", borderRadius: 999, border: active ? "none" : "1px solid #d0d5dd",
    background: active ? color : "rgba(255,255,255,0.9)",
    color: active ? "#fff" : "#344054",
    fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all 0.15s",
    backdropFilter: active ? "none" : "blur(4px)",
    boxShadow: active ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
  }),
  card: (color: string, _icon: string): React.CSSProperties => ({
    flex: 1, padding: "18px 22px", borderRadius: 14,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(8px)",
    border: `1px solid ${color}25`,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    display: "flex", alignItems: "center", gap: 16,
  }),
};

export default function AdminCertificatesPage() {
  const [stats, setStats] = useState({ diajukan: 0, terbit: 0, ditolak: 0 });
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>("DIAJUKAN");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("tanggal_pengajuan");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [rejectModal, setRejectModal] = useState<Certificate | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailModal, setDetailModal] = useState<Certificate | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        listCertificates(filter, page, LIMIT, search, sortBy, sortOrder),
        getCertificateStats(),
      ]);
      setCertificates(listRes.certificates || []);
      setTotal(listRes.total || 0);
      setStats(statsRes);
      setError("");
    } catch {
      setError("Gagal memuat data sertifikat");
    } finally {
      setLoading(false);
    }
  }, [filter, page, search, sortBy, sortOrder]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [filter, search]);

  function handleSearchInput(val: string) {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val), 400);
  }

  function toggleSort(col: string) {
    if (sortBy === col) setSortOrder((p) => (p === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortOrder("desc"); }
  }

  const sortIcon = (col: string) => {
    if (sortBy !== col) return "↕";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  function goToPage(p: number) { if (p >= 1 && p <= totalPages) setPage(p); }

  async function handleApprove(cert: Certificate) {
    setActionId(cert.sertifikat_id);
    try {
      await approveCertificate(cert.sertifikat_id);
      await fetch();
    } catch { setError("Gagal menyetujui sertifikat"); }
    finally { setActionId(null); }
  }

  async function handleReject(cert: Certificate) {
    if (!rejectReason.trim()) return;
    setActionId(cert.sertifikat_id);
    try {
      await rejectCertificate(cert.sertifikat_id, rejectReason);
      setRejectModal(null); setRejectReason("");
      await fetch();
    } catch { setError("Gagal menolak sertifikat"); }
    finally { setActionId(null); }
  }

  const filterKeys = Object.keys(filterMeta) as StatusFilter[];

  return (
    <AdminLayout>
      <style>{`
      .admin-subheader {
        background: rgba(24,57,163,0.85) !important;
        backdrop-filter: blur(8px);
      }
    `}</style>
      <div style={{ position: "relative", minHeight: "100%", padding: 0, margin: 0 }}>
        {/* BACKGROUND LAYER */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0,
          background: "#0f1f6e",
        }} />
        <div style={{
          position: "fixed", inset: 0, zIndex: 1,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.06, pointerEvents: "none",
        }} />
        <div style={{
          position: "fixed", inset: 0, zIndex: 1,
          background: "linear-gradient(180deg, rgba(15,31,110,0.3) 0%, rgba(15,31,110,0.6) 100%)",
          pointerEvents: "none",
        }} />

        {/* CONTENT */}
        <div style={{ position: "relative", zIndex: 1, padding: "20px 0" }}>
          {/* STATS CARDS */}
          <div style={{ display: "flex", gap: 16, marginBottom: 22 }}>
            <div style={s.card("#f59e0b", "")}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>🕐</div>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Diajukan</p>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>{stats.diajukan.toLocaleString()}</p>
              </div>
            </div>
            <div style={s.card("#16a34a", "")}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: "rgba(22,163,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>✓</div>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.5px" }}>Terbit</p>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>{stats.terbit.toLocaleString()}</p>
              </div>
            </div>
            <div style={s.card("#dc2626", "")}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: "rgba(220,38,38,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>✕</div>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ditolak</p>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>{stats.ditolak.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* SEARCH + FILTERS */}
          <div style={{
            display: "flex", gap: 12, alignItems: "center", marginBottom: 18, flexWrap: "wrap",
            background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)",
            borderRadius: 14, padding: "14px 18px",
            border: "1px solid rgba(255,255,255,0.5)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, pointerEvents: "none" }}>🔍</span>
              <input
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Cari nama pelaku atau UMKM..."
                style={{
                  width: "100%", padding: "9px 14px 9px 34px", borderRadius: 999,
                  border: "1px solid #e2e8f0", fontSize: 13, outline: "none",
                  background: "#fff", boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {filterKeys.map((k) => {
                const active = filter === k;
                return (
                  <button key={k} onClick={() => setFilter(k)} style={s.btnOutline(active, filterMeta[k].color)}>
                    {filterMeta[k].label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div style={{ padding: 12, background: "#fef2f2", color: "#dc2626", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* TABLE */}
          <div style={{
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
            borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            overflow: "hidden", border: "1px solid rgba(255,255,255,0.5)",
          }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: 48, color: "#94a3b8", fontSize: 14 }}>Memuat data...</div>
            ) : certificates.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: "#94a3b8", fontSize: 14 }}>
                Tidak ada sertifikat dengan status ini
              </div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#475569", width: 40, fontSize: 12 }}>No</th>
                        {sortableColumns.map((col) => (
                          <th key={col.key} onClick={() => toggleSort(col.key)}
                            style={{
                              padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#475569",
                              cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", fontSize: 12,
                              transition: "color 0.15s",
                            }}
                          >
                            {col.label}{" "}
                            <span style={{
                              color: sortBy === col.key ? "#1a3fa4" : "#cbd5e1",
                              fontSize: 10, marginLeft: 2,
                            }}>{sortIcon(col.key)}</span>
                          </th>
                        ))}
                        <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, color: "#475569", fontSize: 12 }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map((cert, idx) => (
                        <tr key={cert.sertifikat_id}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                        >
                          <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: 12 }}>{(page - 1) * LIMIT + idx + 1}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{cert.pelaku_nama}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{cert.nama_umkm}</div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#334155", fontSize: 13 }}>{cert.judul_pelatihan}</td>
                          <td style={{ padding: "14px 16px", color: "#64748b", whiteSpace: "nowrap", fontSize: 12 }}>
                            {cert.tanggal_pengajuan
                              ? new Date(cert.tanggal_pengajuan).toLocaleDateString("id-ID")
                              : "-"}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                              background: cert.status_sertifikat_id === "TERBIT" ? "#dcfce7"
                                : cert.status_sertifikat_id === "DITOLAK" ? "#fef2f2" : "#fef3c7",
                              color: cert.status_sertifikat_id === "TERBIT" ? "#16a34a"
                                : cert.status_sertifikat_id === "DITOLAK" ? "#dc2626" : "#d97706",
                            }}>
                              <span style={{
                                width: 5, height: 5, borderRadius: "50%",
                                background: cert.status_sertifikat_id === "TERBIT" ? "#16a34a"
                                  : cert.status_sertifikat_id === "DITOLAK" ? "#dc2626" : "#d97706",
                                display: "inline-block",
                              }} />
                              {cert.nama_status_sertifikat}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#64748b", fontSize: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{
                                width: 56, height: 6, borderRadius: 3, background: "#e2e8f0", overflow: "hidden", flexShrink: 0,
                              }}>
                                <div style={{
                                  width: `${Math.min(cert.progress_persen, 100)}%`, height: "100%",
                                  background: "linear-gradient(90deg, #3b82f6, #1a3fa4)", borderRadius: 3,
                                }} />
                              </div>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>{cert.progress_persen}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                              <button onClick={() => setDetailModal(cert)} style={s.btn("#fff", "#344054")}>
                                <span>⋯</span> Detail
                              </button>
                              {cert.status_sertifikat_id === "DIAJUKAN" && (
                                <>
                                  <button onClick={() => handleApprove(cert)} disabled={actionId === cert.sertifikat_id}
                                    style={s.btn(actionId === cert.sertifikat_id ? "#94a3b8" : "#16a34a", "#fff", actionId === cert.sertifikat_id)}>
                                    ✓ Setujui
                                  </button>
                                  <button onClick={() => setRejectModal(cert)} disabled={actionId === cert.sertifikat_id}
                                    style={{
                                      ...s.btn(actionId === cert.sertifikat_id ? "#e2e8f0" : "#fff", actionId === cert.sertifikat_id ? "#94a3b8" : "#dc2626", actionId === cert.sertifikat_id),
                                      border: actionId === cert.sertifikat_id ? "none" : "1px solid #dc2626",
                                      background: actionId === cert.sertifikat_id ? "#e2e8f0" : "transparent",
                                    }}>
                                    ✕ Tolak
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderTop: "1px solid #e2e8f0",
                  background: "rgba(248,250,252,0.8)",
                }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    {total} data — Hal {page} dari {totalPages}
                  </span>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <button onClick={() => goToPage(1)} disabled={page === 1}
                      style={s.btn(page === 1 ? "#e2e8f0" : "#fff", page === 1 ? "#94a3b8" : "#475569", page === 1)}>
                      ««
                    </button>
                    <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                      style={s.btn(page === 1 ? "#e2e8f0" : "#fff", page === 1 ? "#94a3b8" : "#475569", page === 1)}>
                      «
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                      const p = start + i;
                      if (p > totalPages) return null;
                      return (
                        <button key={p} onClick={() => goToPage(p)}
                          style={{
                            ...s.btn(page === p ? "#1a3fa4" : "#fff", page === p ? "#fff" : "#475569"),
                            minWidth: 32, fontWeight: page === p ? 700 : 500,
                            boxShadow: page === p ? "0 2px 6px rgba(26,63,164,0.25)" : "0 1px 2px rgba(0,0,0,0.05)",
                          }}>
                          {p}
                        </button>
                      );
                    })}
                    <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                      style={s.btn(page === totalPages ? "#e2e8f0" : "#fff", page === totalPages ? "#94a3b8" : "#475569", page === totalPages)}>
                      »
                    </button>
                    <button onClick={() => goToPage(totalPages)} disabled={page === totalPages}
                      style={s.btn(page === totalPages ? "#e2e8f0" : "#fff", page === totalPages ? "#94a3b8" : "#475569", page === totalPages)}>
                      »»
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* DETAIL MODAL */}
        {detailModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)",
          }} onClick={() => setDetailModal(null)}>
            <div style={{
              background: "#fff", borderRadius: 18, padding: 28, width: 520, maxWidth: "92vw",
              maxHeight: "85vh", overflow: "auto", boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Detail Sertifikat</h3>
                <button onClick={() => setDetailModal(null)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#f1f5f9", cursor: "pointer", fontSize: 16, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ✕
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18, fontSize: 13 }}>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
                  <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>📋 Informasi UMKM</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div><span style={{ color: "#94a3b8" }}>Nama: </span><span style={{ fontWeight: 600, color: "#0f172a" }}>{detailModal.pelaku_nama}</span></div>
                    <div><span style={{ color: "#94a3b8" }}>UMKM: </span><span style={{ fontWeight: 600, color: "#0f172a" }}>{detailModal.nama_umkm}</span></div>
                    <div><span style={{ color: "#94a3b8" }}>ID: </span><span style={{ color: "#475569" }}>{detailModal.umkm_id}</span></div>
                  </div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
                  <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>📚 Informasi Pelatihan</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div><span style={{ color: "#94a3b8" }}>Pelatihan: </span><span style={{ fontWeight: 600, color: "#0f172a" }}>{detailModal.judul_pelatihan}</span></div>
                    <div><span style={{ color: "#94a3b8" }}>Jenis: </span><span style={{ color: "#475569" }}>{detailModal.jenis_pelatihan}</span></div>
                    <div><span style={{ color: "#94a3b8" }}>Progress: </span><span style={{ color: "#475569" }}>{detailModal.progress_persen}%</span></div>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18, fontSize: 13 }}>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
                  <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>📅 Status & Tanggal</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div>
                      <span style={{ color: "#94a3b8" }}>Status: </span>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                        background: detailModal.status_sertifikat_id === "TERBIT" ? "#dcfce7"
                          : detailModal.status_sertifikat_id === "DITOLAK" ? "#fef2f2" : "#fef3c7",
                        color: detailModal.status_sertifikat_id === "TERBIT" ? "#16a34a"
                          : detailModal.status_sertifikat_id === "DITOLAK" ? "#dc2626" : "#d97706",
                      }}>
                        <span style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: detailModal.status_sertifikat_id === "TERBIT" ? "#16a34a"
                            : detailModal.status_sertifikat_id === "DITOLAK" ? "#dc2626" : "#d97706",
                          display: "inline-block",
                        }} />
                        {detailModal.nama_status_sertifikat}
                      </span>
                    </div>
                    <div><span style={{ color: "#94a3b8" }}>Pengajuan: </span><span style={{ color: "#475569" }}>{detailModal.tanggal_pengajuan ? new Date(detailModal.tanggal_pengajuan).toLocaleDateString("id-ID") : "-"}</span></div>
                    <div><span style={{ color: "#94a3b8" }}>Terbit: </span><span style={{ color: "#475569" }}>{detailModal.tanggal_terbit ? new Date(detailModal.tanggal_terbit).toLocaleDateString("id-ID") : "-"}</span></div>
                  </div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
                  <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>🔖 Sertifikat</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div><span style={{ color: "#94a3b8" }}>No: </span><span style={{ fontWeight: 600, color: "#0f172a" }}>{detailModal.nomor_sertifikat || "-"}</span></div>
                    {detailModal.catatan_validasi && (
                      <div><span style={{ color: "#94a3b8" }}>Catatan: </span><span style={{ color: "#475569" }}>{detailModal.catatan_validasi}</span></div>
                    )}
                    {detailModal.tanggal_selesai_pelatihan && (
                      <div><span style={{ color: "#94a3b8" }}>Selesai: </span><span style={{ color: "#475569" }}>{new Date(detailModal.tanggal_selesai_pelatihan).toLocaleDateString("id-ID")}</span></div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
                <button onClick={() => setDetailModal(null)}
                  style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #d0d5dd", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#344054" }}>
                  Tutup
                </button>
                {detailModal.status_sertifikat_id === "DIAJUKAN" && (
                  <>
                    <button onClick={() => { setDetailModal(null); handleApprove(detailModal); }}
                      disabled={actionId === detailModal.sertifikat_id}
                      style={s.btn(actionId === detailModal.sertifikat_id ? "#94a3b8" : "#16a34a", "#fff", actionId === detailModal.sertifikat_id)}>
                      ✓ Setujui
                    </button>
                    <button onClick={() => { setDetailModal(null); setRejectModal(detailModal); }}
                      style={{
                        ...s.btn("transparent", "#dc2626"),
                        border: "1px solid #dc2626",
                      }}>
                      ✕ Tolak
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* REJECT MODAL */}
        {rejectModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)",
          }}>
            <div style={{
              background: "#fff", borderRadius: 18, padding: 28, width: 420, maxWidth: "90vw",
              boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
            }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Tolak Sertifikat</h3>
              <p style={{ margin: "0 0 18px", fontSize: 13, color: "#64748b" }}>
                {rejectModal.judul_pelatihan} — {rejectModal.pelaku_nama}
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Alasan penolakan..."
                rows={4}
                style={{
                  width: "100%", padding: 12, border: "1px solid #e2e8f0", borderRadius: 10,
                  fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
                <button onClick={() => { setRejectModal(null); setRejectReason(""); }}
                  style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #d0d5dd", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#344054" }}>
                  Batal
                </button>
                <button onClick={() => handleReject(rejectModal)}
                  disabled={!rejectReason.trim() || actionId === rejectModal.sertifikat_id}
                  style={{
                    padding: "9px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: !rejectReason.trim() ? "#e2e8f0" : "#dc2626",
                    color: !rejectReason.trim() ? "#94a3b8" : "#fff",
                    fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                  }}>
                  {actionId === rejectModal.sertifikat_id ? "Memproses..." : "Tolak Sertifikat"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}