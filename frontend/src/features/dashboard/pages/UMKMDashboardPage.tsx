import { useEffect, useState } from "react";
import { BarChart2, CalendarDays, Search, ShoppingCart, SlidersHorizontal, TrendingDown, TrendingUp } from "lucide-react";
import UserLayout from "../components/UserLayout";
import {
  getUMKMDashboard,
  type UMKMDashboardData,
  type LabaHarianItem,
} from "../api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Bulan list ───────────────────────────────────────────────────────────────
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const YEARS = [2026, 2025, 2024, 2023];

const PAGE_SIZE = 3;

// ─── Component ────────────────────────────────────────────────────────────────

export default function UMKMDashboardPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth()); // 0-indexed
  const [tahun, setTahun] = useState(now.getFullYear());
  const [trendRange, setTrendRange] = useState<7 | 14 | 30>(7);

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

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");
      setPage(0);
      const { from, to } = buildDateRange();

      try {
        const d = await getUMKMDashboard(from, to);
        setData(d);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Paginasi tabel
  const labaHarian: LabaHarianItem[] = data?.laba_harian ?? [];
  const totalPages = Math.ceil(labaHarian.length / PAGE_SIZE);
  const pageData = labaHarian.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // Tren chart — filter by trendRange
  const trenData = (data?.tren_mingguan ?? []).slice(-(trendRange));

  const persen = data?.persen_vs_kemarin ?? 0;
  const isUp = persen >= 0;

  return (
    <UserLayout
      role="UMKM"
      title="Ringkasan Bisnis"
      subtitle="Selamat datang kembali, berikut performa toko Anda hari ini."
    >
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
          {/* ── KPI Cards ───────────────────────────────────────────── */}
          <div className="ud-kpi-row">
            {/* Total Omzet — Hero Card */}
            <div className="ud-kpi-hero">
              <p className="ud-kpi-hero__label">Total Omset Hari Ini</p>
              <p className="ud-kpi-hero__value">{formatRupiah(data.total_omzet_hari_ini)}</p>
              <div className={`ud-kpi-hero__badge ${isUp ? "up" : "down"}`}>
                {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                <span>
                  {isUp ? "+" : ""}{persen.toFixed(1)}% vs kemarin
                </span>
              </div>
            </div>

            {/* Total Item */}
            <div className="ud-kpi-card">
              <div className="ud-kpi-card__icon" style={{ background: "#fff7ed" }}>
                <ShoppingCart size={22} color="#ea580c" />
              </div>
              <p className="ud-kpi-card__label">Total Item Terjual</p>
              <p className="ud-kpi-card__value">
                {data.total_item_terjual.toLocaleString("id-ID")} Item
              </p>
            </div>

            {/* Rata-rata per Item */}
            <div className="ud-kpi-card">
              <div className="ud-kpi-card__icon" style={{ background: "#f5f3ff" }}>
                <BarChart2 size={22} color="#7c3aed" />
              </div>
              <p className="ud-kpi-card__label">Rata-rata / Item</p>
              <p className="ud-kpi-card__value">
                {formatRupiah(data.rata_rata_per_item)}
              </p>
            </div>
          </div>

          {/* ── Tabel Laba Harian ────────────────────────────────────── */}
          <div className="ud-card">
            <div className="ud-card__header">
              <h3 className="ud-card__title">
                Rincian Laba Harian ({MONTHS[bulan]} {tahun})
              </h3>
              <div className="ud-card__actions">
                <button className="ud-icon-btn" title="Filter">
                  <SlidersHorizontal size={16} />
                </button>
                <button className="ud-icon-btn" title="Kalender">
                  <CalendarDays size={16} />
                </button>
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
                        <td>
                          <span className="ud-laba-badge">
                            {formatRupiahFull(row.laba_bersih)}
                          </span>
                        </td>
                        <td className="ud-td-item">
                          {row.jumlah_produk.toLocaleString("id-ID")} Item
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="ud-table-footer">
                  <span className="ud-table-info">
                    Menampilkan {Math.min(PAGE_SIZE, labaHarian.length - page * PAGE_SIZE)} dari{" "}
                    {labaHarian.length} hari
                  </span>
                  <div className="ud-pagination">
                    <button
                      className="ud-page-btn"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Sebelumnya
                    </button>
                    <button
                      className="ud-page-btn ud-page-btn--active"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Tren Penjualan ───────────────────────────────────────── */}
          <div className="ud-card">
            <div className="ud-card__header">
              <h3 className="ud-card__title">Tren Penjualan Mingguan</h3>
              <select
                className="ud-range-select"
                value={trendRange}
                onChange={(e) => setTrendRange(Number(e.target.value) as 7 | 14 | 30)}
              >
                <option value={7}>7 Hari Terakhir</option>
                <option value={14}>14 Hari Terakhir</option>
                <option value={30}>30 Hari Terakhir</option>
              </select>
            </div>

            {trenData.length === 0 ? (
              <p className="ud-empty">Belum ada data tren.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trenData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                  <defs>
                    <linearGradient id="labGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1f45b6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1f45b6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey="total_laba"
                    stroke="#1f45b6"
                    strokeWidth={2}
                    fill="url(#labGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </UserLayout>
  );
}
