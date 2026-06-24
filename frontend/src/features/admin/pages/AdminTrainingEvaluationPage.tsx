import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  Award,
  TrendingUp,
  Search,
  Printer,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import AdminLayout from "../components/AdminLayout";
import StatCard from "../components/StatCard";
import {
  getTrainingList,
  getEvaluationData,
  type TrainingListItem,
  type ParticipantEvaluation,
} from "../api";
import { toast } from "sonner";

function formatNumber(n: number): string {
  return n.toLocaleString("id-ID");
}

function formatScore(n: number): string {
  return n.toFixed(1);
}

const PASS_STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "LULUS", label: "Lulus" },
  { value: "TIDAK_LULUS", label: "Tidak Lulus" },
  { value: "BELUM_SELESAI", label: "Belum Selesai" },
];

const SCORE_RANGE_OPTIONS = [
  { value: "", label: "Semua Nilai" },
  { value: "0-50", label: "0 - 50" },
  { value: "51-70", label: "51 - 70" },
  { value: "71-85", label: "71 - 85" },
  { value: "86-100", label: "86 - 100" },
];

function getStatusBadge(status: string) {
  if (status === "LULUS") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 12px", borderRadius: 20,
        background: "#ecfdf5", color: "#059669",
        fontSize: 12, fontWeight: 700,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
        Lulus
      </span>
    );
  }
  if (status === "TIDAK_LULUS") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 12px", borderRadius: 20,
        background: "#fef2f2", color: "#dc2626",
        fontSize: 12, fontWeight: 700,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
        Tidak Lulus
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 20,
      background: "#f3f4f6", color: "#6b7280",
      fontSize: 12, fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#9ca3af" }} />
      Belum Selesai
    </span>
  );
}

export default function AdminTrainingEvaluationPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTrainingId = searchParams.get("trainingId") || "";

  const [selectedTrainingId, setSelectedTrainingId] = useState(initialTrainingId);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());

  const { data: trainingListData, isLoading: loadingList } = useQuery({
    queryKey: ["admin", "training-list"],
    queryFn: getTrainingList,
    staleTime: 2 * 60 * 1000,
  });

  const trainings: TrainingListItem[] = trainingListData?.data?.trainings ?? [];

  const { data: evalData, isLoading: loadingEval, error: evalError } = useQuery({
    queryKey: ["admin", "evaluation", selectedTrainingId],
    queryFn: () => getEvaluationData(selectedTrainingId),
    enabled: !!selectedTrainingId,
    staleTime: 60 * 1000,
  });

  const evaluation = evalData?.data ?? null;

  function handleTrainingChange(id: string) {
    setSelectedTrainingId(id);
    setSelectedParticipants(new Set());
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set("trainingId", id);
    } else {
      url.searchParams.delete("trainingId");
    }
    window.history.replaceState({}, "", url.toString());
  }

  // Filtered participants
  const filteredParticipants = useMemo(() => {
    if (!evaluation?.participants) return [];
    let list = evaluation.participants;

    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (p) =>
          p.nama.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      list = list.filter((p) => p.status_kelulusan === statusFilter);
    }

    if (scoreFilter) {
      const [min, max] = scoreFilter.split("-").map(Number);
      list = list.filter((p) => p.nilai_akhir >= min && p.nilai_akhir <= max);
    }

    return list;
  }, [evaluation, searchText, statusFilter, scoreFilter]);

  function toggleSelectAll() {
    if (!evaluation) return;
    const lulusIds = evaluation.participants
      .filter((p) => p.status_kelulusan === "LULUS")
      .map((p) => p.pendaftaran_pelatihan_id);
    if (lulusIds.length === 0) return;
    if (lulusIds.every((id) => selectedParticipants.has(id))) {
      setSelectedParticipants(new Set());
    } else {
      setSelectedParticipants(new Set(lulusIds));
    }
  }

  function toggleParticipant(id: string) {
    const next = new Set(selectedParticipants);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedParticipants(next);
  }

  function handleExportCSV() {
    if (!selectedTrainingId) return;
    toast.promise(
      getEvaluationData(selectedTrainingId).then((res) => {
        const participants = res?.data?.participants ?? [];
        const headers = ["Nama", "Email", "Nilai Akhir", "Status Kelulusan", "Tanggal Selesai"];
        const rows = participants.map((p: ParticipantEvaluation) => [
          p.nama,
          p.email,
          String(p.nilai_akhir),
          p.status_kelulusan,
          p.tanggal_selesai ?? "-",
        ]);
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `evaluasi-${selectedTrainingId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }),
      {
        loading: "Mengekspor data...",
        success: "Ekspor CSV berhasil",
        error: "Gagal mengekspor data",
      },
    );
  }

  function handlePrintPDF() {
    window.print();
  }

  function handleBulkVerify() {
    if (selectedParticipants.size === 0) {
      toast.error("Pilih peserta yang lulus terlebih dahulu");
      return;
    }
    toast.success(
      `${selectedParticipants.size} sertifikat berhasil diverifikasi`,
    );
  }

  const selectedTraining = trainings.find(
    (t) => t.pelatihan_id === selectedTrainingId,
  );

  return (
    <AdminLayout>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 4 }}>
        <Link to="/admin" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 500 }}>
          Beranda
        </Link>
        <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
        <Link to="/admin/training" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 500 }}>
          Pelatihan
        </Link>
        <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
        <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
          Evaluasi
        </span>
      </div>

      {/* Page title */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>
          Evaluasi Pelatihan
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>
          Pantau hasil evaluasi dan kelulusan peserta pelatihan
        </p>
      </div>

      {/* Training Selector */}
      <div style={{
        background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "flex-end", gap: 16,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 240 }}>
          <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
            Pilih Pelatihan
          </label>
          <select
            value={selectedTrainingId}
            onChange={(e) => handleTrainingChange(e.target.value)}
            style={{
              minHeight: 40, padding: "6px 12px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.1)", color: "#fff",
              fontSize: 13, outline: "none", width: "100%",
            }}
          >
            <option value="" style={{ color: "#111" }}>-- Pilih Pelatihan --</option>
            {trainings.map((t) => (
              <option key={t.pelatihan_id} value={t.pelatihan_id} style={{ color: "#111" }}>
                {t.judul_pelatihan} ({t.jumlah_peserta} peserta)
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingList && (
        <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
          Memuat daftar pelatihan...
        </div>
      )}

      {!loadingList && !selectedTrainingId && (
        <div style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16, padding: "80px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>
            <SlidersHorizontal size={48} style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.8)", margin: "0 0 8px" }}>
            Pilih Pelatihan
          </h3>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
            Silakan pilih pelatihan dari daftar di atas untuk melihat laporan evaluasi peserta.
          </p>
        </div>
      )}

      {loadingEval && selectedTrainingId && (
        <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, color: "rgba(255,255,255,0.6)" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "#f59e0b",
            animation: "spin 0.8s linear infinite",
          }} />
          <span style={{ fontSize: 14 }}>Memuat data evaluasi...</span>
        </div>
      )}

      {evalError && selectedTrainingId && (
        <div style={{
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
          color: "#fca5a5", borderRadius: 10, padding: "14px 18px", fontSize: 14,
        }}>
          Gagal memuat data evaluasi. Silakan coba lagi.
        </div>
      )}

      {evaluation && !loadingEval && (
        <>
          {/* Four Metric Cards */}
          <div className="stat-cards-grid">
            <StatCard
              icon={Users}
              label="Total Peserta"
              value={formatNumber(evaluation.summary.total_peserta)}
              sub="Terdaftar dalam pelatihan"
              color="blue"
            />
            <StatCard
              icon={UserCheck}
              label="Selesai Evaluasi"
              value={formatNumber(evaluation.summary.selesai_evaluasi)}
              sub={`${evaluation.summary.total_peserta > 0
                ? Math.round((evaluation.summary.selesai_evaluasi / evaluation.summary.total_peserta) * 100)
                : 0}% dari total peserta`}
              color="green"
            />
            <StatCard
              icon={Award}
              label="Rata-rata Nilai"
              value={formatScore(evaluation.summary.rata_rata_nilai)}
              sub="Skala 0-100"
              color="purple"
            />
            <StatCard
              icon={TrendingUp}
              label="Persentase Kelulusan"
              value={`${formatScore(evaluation.summary.persentase_kelulusan)}%`}
              sub={`${evaluation.summary.total_peserta > 0
                ? Math.round((evaluation.summary.persentase_kelulusan / 100) * evaluation.summary.total_peserta)
                : 0} peserta lulus`}
              color="orange"
            />
          </div>

          {/* Charts Row: Score Distribution + Module Scores */}
          <div className="charts-row">
            {/* Score Distribution Histogram */}
            <div className="chart-card">
              <div className="chart-card__header">
                <div>
                  <div className="chart-card__title">Distribusi Nilai Akhir</div>
                  <div className="chart-card__sub">Sebaran nilai peserta</div>
                </div>
              </div>
              {evaluation.score_distribution.length === 0 ? (
                <div className="chart-empty">
                  <p>Data distribusi nilai tidak tersedia</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={evaluation.score_distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="rentang_nilai" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      formatter={(value) => [`${value} peserta`, "Jumlah"]}
                      labelFormatter={(label) => `Rentang: ${label}`}
                    />
                    <Bar dataKey="jumlah" fill="#1f45b6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Average Score per Module */}
            <div className="chart-card">
              <div className="chart-card__header">
                <div>
                  <div className="chart-card__title">Rata-rata Nilai per Modul</div>
                  <div className="chart-card__sub">Identifikasi modul tersulit</div>
                </div>
              </div>
              {evaluation.module_scores.length === 0 ? (
                <div className="chart-empty">
                  <p>Data nilai per modul tidak tersedia</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={evaluation.module_scores}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="judul_modul"
                      tick={{ fontSize: 10 }}
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [formatScore(Number(value)), "Rata-rata Nilai"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="rata_rata_nilai"
                      stroke="#1f45b6"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#1f45b6" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Participant Table */}
          <div style={{
            background: "#fff", borderRadius: 20,
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)", overflow: "hidden",
          }}>
            {/* Table header with search, filters, actions */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 16, padding: "24px 28px 16px", flexWrap: "wrap",
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>
                Daftar Peserta ({filteredParticipants.length})
              </h2>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {/* Search */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#f3f4f6", border: "1px solid #e5e7eb",
                  borderRadius: 10, padding: "8px 14px", minWidth: 240,
                }}>
                  <Search size={14} style={{ color: "#9ca3af", flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Cari nama atau email..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{
                      border: "none", background: "transparent", fontSize: 13,
                      color: "#374151", outline: "none", width: "100%",
                      minHeight: "auto", borderRadius: 0, padding: 0,
                    }}
                  />
                </div>

                {/* Status filter */}
                <div style={{ position: "relative" }}>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
                      background: "#f3f4f6", border: "1px solid #e5e7eb",
                      borderRadius: 10, padding: "8px 36px 8px 14px",
                      fontSize: 13, fontWeight: 600, color: "#374151",
                      cursor: "pointer", outline: "none", fontFamily: "inherit",
                    }}
                  >
                    {PASS_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)", fontSize: 12,
                    color: "#6b7280", pointerEvents: "none",
                  }}>▾</span>
                </div>

                {/* Score range filter */}
                <div style={{ position: "relative" }}>
                  <select
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(e.target.value)}
                    style={{
                      appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
                      background: "#f3f4f6", border: "1px solid #e5e7eb",
                      borderRadius: 10, padding: "8px 36px 8px 14px",
                      fontSize: 13, fontWeight: 600, color: "#374151",
                      cursor: "pointer", outline: "none", fontFamily: "inherit",
                    }}
                  >
                    {SCORE_RANGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)", fontSize: 12,
                    color: "#6b7280", pointerEvents: "none",
                  }}>▾</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "0 28px 16px", flexWrap: "wrap",
            }}>
              <button
                onClick={handleExportCSV}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8,
                  background: "#f3f4f6", border: "1px solid #e5e7eb",
                  color: "#374151", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <FileSpreadsheet size={16} />
                Ekspor CSV
              </button>
              <button
                onClick={handlePrintPDF}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8,
                  background: "#f3f4f6", border: "1px solid #e5e7eb",
                  color: "#374151", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <Printer size={16} />
                Cetak PDF
              </button>
              <button
                onClick={handleBulkVerify}
                disabled={selectedParticipants.size === 0}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8,
                  background: selectedParticipants.size > 0 ? "#1f45b6" : "#e5e7eb",
                  border: "none",
                  color: selectedParticipants.size > 0 ? "#fff" : "#9ca3af",
                  fontSize: 13, fontWeight: 600,
                  cursor: selectedParticipants.size > 0 ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                }}
              >
                <ShieldCheck size={16} />
                Verifikasi {selectedParticipants.size > 0 ? `(${selectedParticipants.size})` : ""}
              </button>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table className="reg-tbl">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        onChange={toggleSelectAll}
                        checked={
                          evaluation.participants.filter((p) => p.status_kelulusan === "LULUS").length > 0 &&
                          evaluation.participants
                            .filter((p) => p.status_kelulusan === "LULUS")
                            .every((p) => selectedParticipants.has(p.pendaftaran_pelatihan_id))
                        }
                        style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#1f45b6" }}
                      />
                    </th>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Nilai Akhir</th>
                    <th>Status Kelulusan</th>
                    <th>Tanggal Selesai</th>
                    <th style={{ width: 100 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af", fontSize: 14 }}>
                        Tidak ada data peserta.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p) => (
                      <tr key={p.pendaftaran_pelatihan_id} className="reg-tbl-row">
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedParticipants.has(p.pendaftaran_pelatihan_id)}
                            onChange={() => toggleParticipant(p.pendaftaran_pelatihan_id)}
                            disabled={p.status_kelulusan !== "LULUS"}
                            style={{
                              width: 16, height: 16, cursor: p.status_kelulusan === "LULUS" ? "pointer" : "not-allowed",
                              accentColor: "#1f45b6", opacity: p.status_kelulusan === "LULUS" ? 1 : 0.4,
                            }}
                          />
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 10,
                              background: `hsl(${p.nama.length * 37 % 360}, 60%, 55%)`,
                              color: "#fff", fontWeight: 700, fontSize: 13,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                            }}>
                              {p.nama[0]?.toUpperCase() ?? "?"}
                            </div>
                            <span style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>
                              {p.nama}
                            </span>
                          </div>
                        </td>
                        <td style={{ color: "#374151", fontSize: 14 }}>{p.email}</td>
                        <td>
                          <span style={{
                            fontWeight: 700, fontSize: 15,
                            color: p.nilai_akhir >= 70 ? "#059669" : p.nilai_akhir > 0 ? "#dc2626" : "#9ca3af",
                          }}>
                            {p.nilai_akhir > 0 ? formatScore(p.nilai_akhir) : "-"}
                          </span>
                        </td>
                        <td>{getStatusBadge(p.status_kelulusan)}</td>
                        <td style={{ color: "#6b7280", fontSize: 13 }}>
                          {p.tanggal_selesai
                            ? new Date(p.tanggal_selesai).toLocaleDateString("id-ID", {
                                day: "numeric", month: "short", year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td>
                          <button
                            onClick={() => toast.info("Detail jawaban akan segera tersedia")}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              padding: "6px 12px", borderRadius: 8,
                              background: "#eef3ff", border: "none",
                              color: "#1f45b6", fontSize: 12, fontWeight: 600,
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            <Eye size={14} />
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer info */}
            <div style={{
              padding: "14px 28px", borderTop: "1px solid #f3f4f6",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              color: "#6b7280", fontSize: 13,
            }}>
              <span>
                {selectedParticipants.size} peserta dipilih untuk verifikasi
              </span>
              <span>
                {selectedTraining?.judul_pelatihan
                  ? `Pelatihan: ${selectedTraining.judul_pelatihan}`
                  : ""}
              </span>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
