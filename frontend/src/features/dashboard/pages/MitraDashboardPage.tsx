import { useEffect, useState } from "react";
import { BarChart2, CalendarDays, Handshake, Search, SlidersHorizontal, ShoppingCart, TrendingDown, TrendingUp } from "lucide-react";
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
  const [periode, setPeriode] = useState("3");
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [page, setPage] = useState(0);
  const [trendRange, setTrendRange] = useState<7 | 14 | 30>(7);

  // Initial load — tanpa filter
  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const d = await getMitraDashboard();
        setData(d);
        if (d.umkm_list?.length > 0) {
          setSelectedUMKM(d.umkm_list[0].umkm_id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  function handleApplyFilter() {
    setError("");
    if (!selectedUMKM) {
      setError("Pilih UMKM terlebih dahulu.");
      return;
    }

    setPage(0);
    setLoadingDetail(true);
    getMitraDashboard(selectedUMKM)
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
      title="Monitoring Perkembangan Usaha"
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
          <div className="mitra-filter-card">
            <div className="mitra-filter-row">
              <div className="mitra-filter-item">
                <label className="mitra-filter-label">Nama UMKM</label>
                {umkmList.length === 0 ? (
                  <div className="ufb-empty-hint">Belum ada UMKM mitra yang disetujui</div>
                ) : (
                  <select
                    className="mitra-filter-select"
                    value={selectedUMKM}
                    onChange={(e) => setSelectedUMKM(e.target.value)}
                  >
                    <option value="" disabled>Pilih UMKM</option>
                    {umkmList.map((u) => (
                      <option key={u.umkm_id} value={u.umkm_id}>
                        {u.nama_umkm}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="mitra-filter-item">
                <label className="mitra-filter-label">Periode</label>
                <select
                  className="mitra-filter-select"
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                >
                  <option value="3">3 Bulan Terakhir</option>
                  <option value="6">6 Bulan Terakhir</option>
                  <option value="12">12 Bulan Terakhir</option>
                </select>
              </div>
              <div className="mitra-filter-item">
                <label className="mitra-filter-label">Tahun</label>
                <select
                  className="mitra-filter-select"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                >
                  {Array.from({ length: 4 }, (_, index) => String(new Date().getFullYear() - index)).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="mitra-filter-item mitra-filter-item--button">
                <button className="mitra-filter-btn" onClick={handleApplyFilter}>
                  <Search size={16} style={{ marginRight: 8 }} /> Terapkan Filter
                </button>
              </div>
            </div>
            <p className="mitra-filter-note">Gunakan filter di atas untuk memulai pemantauan UMKM mitra.</p>
          </div>

          {loadingDetail && <p className="ud-loading">Memuat data UMKM...</p>}

          {!loadingDetail && (
            <>
              {umkmList.length === 0 ? (
                <div className="mitra-empty-board">
                  <div className="mitra-empty-icon">
                    <Handshake size={32} />
                  </div>
                  <h3>Belum Ada Kemitraan Aktif</h3>
                  <p>Dashboard akan menampilkan data performa UMKM setelah ada pengajuan kemitraan yang disetujui.</p>
                </div>
              ) : !selectedUMKM ? (
                <div className="mitra-empty-board">
                  <div className="mitra-empty-icon">
                    <Handshake size={32} />
                  </div>
                  <h3>Pilih UMKM dan Terapkan Filter</h3>
                  <p>Masukkan nama UMKM pada filter di atas lalu klik Terapkan Filter untuk memulai.</p>
                </div>
              ) : !dash ? (
                <div className="mitra-empty-board">
                  <div className="mitra-empty-icon">
                    <Handshake size={32} />
                  </div>
                  <h3>Data UMKM tidak ditemukan</h3>
                  <p>Silakan coba ulang filter atau hubungi dukungan jika masalah berlanjut.</p>
                </div>
              ) : (
                <>
                  {/* ── KPI Cards ─────────────────────────────────── */}
                  <div className="ud-kpi-row">
                    {/* Hero omzet */}
                    <div className="ud-kpi-hero" style={{ background: "linear-gradient(135deg, #1f45b6, #4f46e5)" }}>
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
                      <div className="ud-kpi-card__icon" style={{ background: "#eff6ff" }}>
                        <ShoppingCart size={22} color="#1d4ed8" />
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
                        <button className="ud-icon-btn" title="Filter">
                          <SlidersHorizontal size={16} />
                        </button>
                        <button className="ud-icon-btn" title="Kalender">
                          <CalendarDays size={16} />
                        </button>
                      </div>
                    </div>

                    {labaHarian.length === 0 ? (
                      <div className="ud-card ud-empty-state">
                        <div className="ud-empty-icon">
                          <ShoppingCart size={32} />
                        </div>
                        <h3>Data laba belum tersedia</h3>
                        <p>Silakan pilih UMKM lain atau tunggu sementara laporan harian tersedia.</p>
                      </div>
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
                      <div className="ud-card ud-empty-state">
                        <div className="ud-empty-icon">
                          <BarChart2 size={32} />
                        </div>
                        <h3>Belum ada tren penjualan</h3>
                        <p>Data tren akan muncul setelah UMKM mitra mulai mencatat penjualan.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={trenData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                          <defs>
                            <linearGradient id="mitraGrad" x1="0" y1="0" x2="0" y2="1">
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
