import { useEffect, useState } from "react";
import { ShoppingCart, BarChart2, TrendingUp, TrendingDown } from "lucide-react";
import UserLayout from "../components/UserLayout";
import {
  getMitraDashboard,
  type MitraDashboardData,
  type UMKMMitraItem,
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

const PAGE_SIZE = 3;

// ─── Component ────────────────────────────────────────────────────────────────

export default function MitraDashboardPage() {
  const [data, setData] = useState<MitraDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedUMKM, setSelectedUMKM] = useState<string>("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [page, setPage] = useState(0);
  const [trendRange, setTrendRange] = useState<7 | 14 | 30>(7);

  // Initial load — tanpa filter
  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const d = await getMitraDashboard();
        setData(d);
        // Set selected ke UMKM pertama kalau ada
        if (d.umkm_list?.length > 0) {
          setSelectedUMKM(d.dashboard?.umkm_id ?? d.umkm_list[0].umkm_id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  // Saat user ganti UMKM
  function handleSelectUMKM(umkmId: string) {
    setSelectedUMKM(umkmId);
    setPage(0);
    setLoadingDetail(true);
    getMitraDashboard(umkmId)
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat data"))
      .finally(() => setLoadingDetail(false));
  }

  const dash = data?.dashboard;
  const labaHarian: LabaHarianItem[] = dash?.laba_harian ?? [];
  const totalPages = Math.ceil(labaHarian.length / PAGE_SIZE);
  const pageData = labaHarian.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const trenData = (dash?.tren_mingguan ?? []).slice(-(trendRange));

  const persen = dash?.persen_vs_kemarin ?? 0;
  const isUp = persen >= 0;

  const umkmList: UMKMMitraItem[] = data?.umkm_list ?? [];

  return (
    <UserLayout
      role="MITRA"
      title="Dashboard Mitra"
      subtitle={
        data
          ? `Selamat datang, ${data.nama_mitra}. Pantau performa UMKM mitra Anda.`
          : "Memuat data mitra..."
      }
    >
      {error && <p className="error-message">{error}</p>}
      {loading && <p className="ud-loading">Memuat data...</p>}

      {!loading && (
        <>
          {/* ── Filter UMKM ─────────────────────────────────────────── */}
          <div className="user-filter-bar">
            <div className="ufb-group" style={{ flex: "2", minWidth: 260 }}>
              <label className="ufb-label">PILIH UMKM MITRA</label>
              {umkmList.length === 0 ? (
                <div className="ufb-empty-hint">
                  Belum ada UMKM mitra yang disetujui
                </div>
              ) : (
                <select
                  className="ufb-select"
                  value={selectedUMKM}
                  onChange={(e) => handleSelectUMKM(e.target.value)}
                >
                  {umkmList.map((u) => (
                    <option key={u.umkm_id} value={u.umkm_id}>
                      {u.nama_umkm}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="ufb-group ufb-group--info">
              <label className="ufb-label">TOTAL MITRA UMKM</label>
              <div className="ufb-stat-val">{umkmList.length} UMKM</div>
            </div>
          </div>

          {loadingDetail && <p className="ud-loading">Memuat data UMKM...</p>}

          {!loadingDetail && (
            <>
              {/* ── No data state ─────────────────────────────────── */}
              {umkmList.length === 0 ? (
                <div className="ud-card ud-empty-state">
                  <div className="ud-empty-icon">🤝</div>
                  <h3>Belum Ada Kemitraan Aktif</h3>
                  <p>Dashboard akan menampilkan data performa UMKM setelah ada pengajuan kemitraan yang disetujui.</p>
                </div>
              ) : !dash ? (
                <div className="ud-card">
                  <p className="ud-empty">Pilih UMKM untuk melihat dashboard.</p>
                </div>
              ) : (
                <>
                  {/* ── KPI Cards ─────────────────────────────────── */}
                  <div className="ud-kpi-row">
                    {/* Hero omzet */}
                    <div className="ud-kpi-hero" style={{ background: "linear-gradient(135deg, #0f766e, #14b8a6)" }}>
                      <p className="ud-kpi-hero__label">Total Omset Hari Ini</p>
                      <p className="ud-kpi-hero__label" style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>
                        {dash.nama_umkm}
                      </p>
                      <p className="ud-kpi-hero__value">{formatRupiah(dash.total_omzet_hari_ini)}</p>
                      <div className={`ud-kpi-hero__badge ${isUp ? "up" : "down"}`}>
                        {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        <span>
                          {isUp ? "+" : ""}{persen.toFixed(1)}% vs kemarin
                        </span>
                      </div>
                    </div>

                    {/* Total Item */}
                    <div className="ud-kpi-card">
                      <div className="ud-kpi-card__icon" style={{ background: "#f0fdf4" }}>
                        <ShoppingCart size={22} color="#16a34a" />
                      </div>
                      <p className="ud-kpi-card__label">Total Item Terjual</p>
                      <p className="ud-kpi-card__value">
                        {dash.total_item_terjual.toLocaleString("id-ID")} Item
                      </p>
                    </div>

                    {/* Rata-rata per Item */}
                    <div className="ud-kpi-card">
                      <div className="ud-kpi-card__icon" style={{ background: "#f5f3ff" }}>
                        <BarChart2 size={22} color="#7c3aed" />
                      </div>
                      <p className="ud-kpi-card__label">Rata-rata / Item</p>
                      <p className="ud-kpi-card__value">
                        {formatRupiah(dash.rata_rata_per_item)}
                      </p>
                    </div>
                  </div>

                  {/* ── Tabel Laba Harian ─────────────────────────── */}
                  <div className="ud-card">
                    <div className="ud-card__header">
                      <h3 className="ud-card__title">
                        Rincian Laba Harian — {dash.nama_umkm}
                      </h3>
                      <div className="ud-card__actions">
                        <button className="ud-icon-btn" title="Filter">⚙️</button>
                        <button className="ud-icon-btn" title="Kalender">📅</button>
                      </div>
                    </div>

                    {labaHarian.length === 0 ? (
                      <p className="ud-empty">Belum ada data laba untuk UMKM ini.</p>
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

                  {/* ── Tren Penjualan ────────────────────────────── */}
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
                            <linearGradient id="mitraGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0f766e" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="hari" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                          <Tooltip
                            formatter={(v: number) => [formatRupiahFull(v), "Laba"]}
                            contentStyle={{ fontSize: 12, borderRadius: 8 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="total_laba"
                            stroke="#0f766e"
                            strokeWidth={2}
                            fill="url(#mitraGrad)"
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </UserLayout>
  );
}
