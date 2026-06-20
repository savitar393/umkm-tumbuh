import { useEffect, useState } from "react";
import { BarChart2, CalendarDays, Search, ShoppingCart, SlidersHorizontal, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import UserLayout from "../components/UserLayout";
import {
  getUMKMDashboard,
  checkProfileExists,
  type UMKMDashboardData,
  type LabaHarianItem,
} from "../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatRupiah(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatRupiahFull(value: number): string {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatTanggal(tanggal: string): string {
  const d = new Date(tanggal);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const YEARS = [2026, 2025, 2024, 2023];
const PAGE_SIZE = 3;

export default function UMKMDashboardPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth());
  const [tahun, setTahun] = useState(now.getFullYear());
  const [trendRange, setTrendRange] = useState<7 | 14 | 30 | 90>(7);

  const [data, setData] = useState<UMKMDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  function buildDateRange() {
    const from = `${tahun}-${String(bulan + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(tahun, bulan + 1, 0).getDate();
    const to = `${tahun}-${String(bulan + 1).padStart(2, "0")}-${lastDay}`;
    return { from, to };
  }

  function fetchDashboard() {
    setLoading(true);
    setError("");
    setPage(0);
    const { from, to } = buildDateRange();
    getUMKMDashboard(from, to)
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat data"))
      .finally(() => setLoading(false));
  }

  const [profileExists, setProfileExists] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");
      setPage(0);
      const { from, to } = buildDateRange();
      try {
        const [d, hasProfile] = await Promise.all([
          getUMKMDashboard(from, to),
          checkProfileExists(),
        ]);
        setData(d);
        setProfileExists(hasProfile);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    }
    void loadDashboard();
  }, []);

  const labaHarian: LabaHarianItem[] = data?.laba_harian ?? [];
  const totalPages = Math.ceil(labaHarian.length / PAGE_SIZE);
  const pageData = labaHarian.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const trenData = (data?.tren_mingguan ?? []).slice(-(trendRange));

  const persen = data?.persen_vs_kemarin ?? 0;
  const isUp = persen >= 0;

  const noData = data && labaHarian.length === 0 && trenData.length === 0;

  return (
    <UserLayout
      role="UMKM"
      title="Ringkasan Bisnis"
      subtitle="Selamat datang kembali, berikut performa toko Anda hari ini."
    >
      {/* ── Progress Bar Profil ──────────────────────────────────── */}
      {!loading && data && !profileExists && (
        <div className="ud-profile-progress">
          <div className="ud-profile-progress__info">
            <div className="ud-profile-progress__text">
              <AlertCircle size={16} color="#f59e0b" />
              <span>Profil UMKM belum lengkap. <strong>Hampir selesai!</strong></span>
            </div>
            <a href="/umkm/profile" className="ud-profile-progress__btn">Lengkapi</a>
          </div>
          <div className="ud-profile-progress__bar">
            <div className="ud-profile-progress__fill" style={{ width: '0%' }} />
          </div>
        </div>
      )}

      {/* ── Filter Bar ─────────────────────────────────────────────── */}
      <div className="user-filter-bar">
        <div className="ufb-group">
          <label className="ufb-label">BULAN</label>
          <select className="ufb-select" value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>
        <div className="ufb-group">
          <label className="ufb-label">TAHUN</label>
          <select className="ufb-select" value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="ufb-group ufb-group--btn">
          <button className="ufb-btn" onClick={fetchDashboard}>
            <Search size={16} style={{ marginRight: 8 }} /> Terapkan
          </button>
        </div>
      </div>

      {/* ── Error / Loading ─────────────────────────────────────────── */}
      {error && <p className="error-message">{error}</p>}
      {loading && <p className="ud-loading">Memuat data...</p>}

      {!loading && data && (
        <>
          {noData ? (
            <div className="mitra-empty-board">
              <BarChart2 size={32} />
              <h3>Data Belum Tersedia</h3>
              <p>Belum ada data monitoring untuk periode ini. Coba bulan atau tahun lain.</p>
            </div>
          ) : (
            <>
              {/* ── KPI Cards ───────────────────────────────────────────── */}
              <div className="ud-kpi-row">
                <div className="ud-kpi-hero">
                  <p className="ud-kpi-hero__label">Total Omset Hari Ini</p>
                  <p className="ud-kpi-hero__value">{formatRupiah(data.total_omzet_hari_ini)}</p>
                  <div className={`ud-kpi-hero__badge ${isUp ? "up" : "down"}`}>
                    {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    <span>{isUp ? "+" : ""}{persen.toFixed(1)}% vs kemarin</span>
                  </div>
                </div>

                <div className="ud-kpi-card">
                  <div className="ud-kpi-card__icon" style={{ background: "#fff7ed" }}>
                    <ShoppingCart size={22} color="#ea580c" />
                  </div>
                  <p className="ud-kpi-card__label">Total Item Terjual</p>
                  <p className="ud-kpi-card__value">{data.total_item_terjual.toLocaleString("id-ID")} Item</p>
                </div>

                <div className="ud-kpi-card">
                  <div className="ud-kpi-card__icon" style={{ background: "#f5f3ff" }}>
                    <BarChart2 size={22} color="#7c3aed" />
                  </div>
                  <p className="ud-kpi-card__label">Rata-rata / Item</p>
                  <p className="ud-kpi-card__value">{formatRupiah(data.rata_rata_per_item)}</p>
                </div>
              </div>

              {/* ── Tabel Laba Harian ────────────────────────────────────── */}
              <div className="ud-card">
                <div className="ud-card__header">
                  <h3 className="ud-card__title">Rincian Laba Harian ({MONTHS[bulan]} {tahun})</h3>
                  <div className="ud-card__actions">
                    <button className="ud-icon-btn" title="Filter"><SlidersHorizontal size={16} /></button>
                    <button className="ud-icon-btn" title="Kalender"><CalendarDays size={16} /></button>
                  </div>
                </div>

                {labaHarian.length === 0 ? (
                  <p className="ud-empty">Belum ada data untuk periode ini.</p>
                ) : (
                  <>
                    <table className="ud-table">
                      <thead>
                        <tr>
                          <th>TANGGAL</th>
                          <th>LABA BERSIH</th>
                          <th>ITEM TERJUAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageData.map((row) => (
                          <tr key={row.tanggal}>
                            <td className="ud-td-date">{formatTanggal(row.tanggal)}</td>
                            <td><span className="ud-laba-badge">{formatRupiahFull(row.laba_bersih)}</span></td>
                            <td className="ud-td-item">{row.jumlah_produk.toLocaleString("id-ID")} Item</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="ud-table-footer">
                      <span className="ud-table-info">
                        Menampilkan {Math.min(PAGE_SIZE, labaHarian.length - page * PAGE_SIZE)} dari {labaHarian.length} hari
                      </span>
                      <div className="ud-pagination">
                        <button className="ud-page-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Sebelumnya</button>
                        <button className="ud-page-btn ud-page-btn--active" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Berikutnya</button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ── Tren Penjualan (Line Chart) ─────────────────────────── */}
              <div className="ud-card">
                <div className="ud-card__header">
                  <h3 className="ud-card__title">Tren Penjualan</h3>
                  <select
                    className="ud-range-select"
                    value={trendRange}
                    onChange={(e) => setTrendRange(Number(e.target.value) as 7 | 14 | 30 | 90)}
                  >
                    <option value={7}>7 Hari Terakhir</option>
                    <option value={14}>14 Hari Terakhir</option>
                    <option value={30}>30 Hari Terakhir</option>
                    <option value={90}>Kuartal</option>
                  </select>
                </div>

                {trenData.length === 0 ? (
                  <p className="ud-empty">Belum ada data tren.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trenData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="hari" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                      <Tooltip
                        formatter={(value) => {
                          const laba = typeof value === "number" ? value : Number(value ?? 0);
                          return [formatRupiahFull(laba), "Laba"];
                        }}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="total_laba"
                        stroke="#1f45b6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          )}
        </>
      )}
    </UserLayout>
  );
}