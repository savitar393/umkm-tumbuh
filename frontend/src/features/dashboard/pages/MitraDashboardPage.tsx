import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart2,
  CalendarDays,
  Handshake,
  LineChart as LineChartIcon,
  Search,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import {
  getMitraDashboard,
  type LabaHarianItem,
  type MitraDashboardData,
  type UMKMMitraItem,
} from "../api";

const PAGE_SIZE = 5;

function formatRupiah(value = 0): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatRupiahFull(value = 0): string {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatTanggal(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "UM";
}

export default function MitraDashboardPage() {
  const [data, setData] = useState<MitraDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  const [selectedUMKM, setSelectedUMKM] = useState("");
  const [searchText, setSearchText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [periode, setPeriode] = useState("3");
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [trendRange, setTrendRange] = useState<7 | 14 | 30 | 90>(7);
  const [page, setPage] = useState(0);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const result = await getMitraDashboard();

        if (ignore) return;

        setData(result);

        if (result.umkm_list?.length > 0) {
          const first = result.umkm_list[0];
          setSelectedUMKM(first.umkm_id);
          setSearchText(first.nama_umkm);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Gagal memuat dashboard mitra.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const umkmList: UMKMMitraItem[] = data?.umkm_list ?? [];
  const dashboard = data?.dashboard;
  const labaHarian: LabaHarianItem[] = dashboard?.laba_harian ?? [];
  const totalPages = Math.max(1, Math.ceil(labaHarian.length / PAGE_SIZE));
  const pageData = labaHarian.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const trenData = (dashboard?.tren_mingguan ?? []).slice(-trendRange);

  const filteredUmkm = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return umkmList;

    return umkmList.filter((umkm) => umkm.nama_umkm.toLowerCase().includes(keyword));
  }, [searchText, umkmList]);

  const selectedName =
    dashboard?.nama_umkm ||
    umkmList.find((umkm) => umkm.umkm_id === selectedUMKM)?.nama_umkm ||
    searchText ||
    "-";

  const persen = dashboard?.persen_vs_kemarin ?? 0;
  const isUp = persen >= 0;
  const hasNoDetailData = Boolean(
    dashboard && labaHarian.length === 0 && trenData.length === 0,
  );

  function selectUMKM(id: string, name: string) {
    setSelectedUMKM(id);
    setSearchText(name);
    setShowDropdown(false);
  }

  function clearSearch() {
    setSelectedUMKM("");
    setSearchText("");
    setShowDropdown(false);
    setPage(0);
  }

  async function handleApplyFilter() {
    setError("");

    if (!selectedUMKM) {
      setError("Pilih UMKM terlebih dahulu.");
      return;
    }

    setPage(0);
    setLoadingDetail(true);

    try {
      const result = await getMitraDashboard(selectedUMKM);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data UMKM.");
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <UmkmLayout
      title="Monitoring Perkembangan Usaha"
      subtitle={
        data
          ? `Selamat datang, ${data.nama_mitra}. Pantau performa UMKM mitra Anda.`
          : "Pantau performa UMKM yang sudah bermitra dengan Anda."
      }
    >
      <main className="mitra-dashboard-page">
        <section className="mitra-dashboard-hero">
          <div>
            <span className="mitra-dashboard-eyebrow">
              <Handshake size={16} />
              Dashboard Mitra
            </span>
            <h1>Monitoring Perkembangan Usaha</h1>
            <p>
              Pilih UMKM mitra untuk melihat omset, item terjual, laba harian,
              dan tren penjualan berdasarkan laporan yang tersedia.
            </p>
          </div>

          <aside className="mitra-dashboard-hero-card">
            <Users size={30} />
            <strong>{umkmList.length}</strong>
            <span>UMKM Dapat Dimonitor</span>
          </aside>
        </section>

        {error ? <div className="mitra-dashboard-alert">{error}</div> : null}

        {loading ? (
          <section className="mitra-dashboard-state">
            <div className="partnership-spinner" />
            <p>Memuat dashboard mitra...</p>
          </section>
        ) : (
          <>
            <section className="mitra-dashboard-filter-card">
              <div className="mitra-dashboard-filter-grid">
                <div className="mitra-dashboard-field mitra-dashboard-field--wide" ref={searchRef}>
                  <label>Nama UMKM</label>
                  {umkmList.length === 0 ? (
                    <div className="mitra-dashboard-empty-input">
                      Belum ada UMKM mitra yang disetujui.
                    </div>
                  ) : (
                    <div className="mitra-dashboard-combobox">
                      <Search size={17} />
                      <input
                        type="text"
                        placeholder="Cari nama UMKM mitra..."
                        value={searchText}
                        onChange={(event) => {
                          setSearchText(event.target.value);
                          setShowDropdown(true);
                          if (!event.target.value) setSelectedUMKM("");
                        }}
                        onFocus={() => setShowDropdown(true)}
                      />

                      {searchText ? (
                        <button type="button" onClick={clearSearch} aria-label="Bersihkan pencarian">
                          <X size={15} />
                        </button>
                      ) : null}

                      {showDropdown ? (
                        <div className="mitra-dashboard-dropdown">
                          {filteredUmkm.length > 0 ? (
                            filteredUmkm.map((umkm) => (
                              <button
                                key={umkm.umkm_id}
                                type="button"
                                className={selectedUMKM === umkm.umkm_id ? "active" : ""}
                                onClick={() => selectUMKM(umkm.umkm_id, umkm.nama_umkm)}
                              >
                                <span>{getInitials(umkm.nama_umkm)}</span>
                                <strong>{umkm.nama_umkm}</strong>
                              </button>
                            ))
                          ) : (
                            <p>UMKM tidak ditemukan.</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="mitra-dashboard-field">
                  <label>Periode</label>
                  <select value={periode} onChange={(event) => setPeriode(event.target.value)}>
                    <option value="1">1 Bulan Terakhir</option>
                    <option value="3">3 Bulan Terakhir</option>
                    <option value="6">6 Bulan Terakhir</option>
                    <option value="12">12 Bulan Terakhir</option>
                  </select>
                </div>

                <div className="mitra-dashboard-field">
                  <label>Tahun</label>
                  <select value={tahun} onChange={(event) => setTahun(event.target.value)}>
                    {Array.from({ length: 5 }, (_, index) => String(new Date().getFullYear() - index)).map(
                      (year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <button
                  type="button"
                  className="mitra-dashboard-filter-button"
                  disabled={loadingDetail || umkmList.length === 0}
                  onClick={handleApplyFilter}
                >
                  <Search size={17} />
                  {loadingDetail ? "Memuat..." : "Terapkan Filter"}
                </button>
              </div>

              <div className="mitra-dashboard-filter-note">
                <CalendarDays size={15} />
                <span>
                  Tampilan saat ini: {selectedName} · {periode} bulan terakhir · {tahun}
                </span>
              </div>
            </section>

            {umkmList.length === 0 ? (
              <section className="mitra-dashboard-state">
                <Handshake size={38} />
                <h2>Belum Ada Kemitraan Aktif</h2>
                <p>
                  Dashboard akan menampilkan performa UMKM setelah ada pengajuan
                  kemitraan yang disetujui.
                </p>
              </section>
            ) : !selectedUMKM ? (
              <section className="mitra-dashboard-state">
                <Search size={38} />
                <h2>Pilih UMKM Terlebih Dahulu</h2>
                <p>Ketik nama UMKM mitra, lalu klik Terapkan Filter.</p>
              </section>
            ) : !dashboard ? (
              <section className="mitra-dashboard-state">
                <BarChart2 size={38} />
                <h2>Data UMKM Tidak Ditemukan</h2>
                <p>Silakan coba ulang filter atau pilih UMKM lain.</p>
              </section>
            ) : hasNoDetailData ? (
              <section className="mitra-dashboard-state">
                <LineChartIcon size={38} />
                <h2>Data Perkembangan Belum Tersedia</h2>
                <p>Belum ada data monitoring untuk UMKM ini pada periode yang dipilih.</p>
              </section>
            ) : (
              <>
                <section className="mitra-dashboard-kpi-grid">
                  <article className="mitra-dashboard-kpi-card primary">
                    <div>
                      <span>Total Omset Hari Ini</span>
                      <strong>{formatRupiah(dashboard.total_omzet_hari_ini)}</strong>
                      <p>{dashboard.nama_umkm}</p>
                    </div>

                    <em className={isUp ? "up" : "down"}>
                      {isUp ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                      {isUp ? "+" : ""}
                      {persen.toFixed(1)}% vs kemarin
                    </em>
                  </article>

                  <article className="mitra-dashboard-kpi-card">
                    <ShoppingCart size={24} />
                    <span>Total Item Terjual</span>
                    <strong>{dashboard.total_item_terjual.toLocaleString("id-ID")} Item</strong>
                  </article>

                  <article className="mitra-dashboard-kpi-card">
                    <BarChart2 size={24} />
                    <span>Rata-rata / Item</span>
                    <strong>{formatRupiah(dashboard.rata_rata_per_item)}</strong>
                  </article>
                </section>

                <section className="mitra-dashboard-content-grid">
                  <article className="mitra-dashboard-card">
                    <div className="mitra-dashboard-card-header">
                      <div>
                        <span>Rincian Harian</span>
                        <h2>Laba Harian — {dashboard.nama_umkm}</h2>
                      </div>
                      <p>
                        {labaHarian.length} hari laporan · halaman {Math.min(page + 1, totalPages)}/{totalPages}
                      </p>
                    </div>

                    <div className="mitra-dashboard-table-wrap">
                      <table className="mitra-dashboard-table">
                        <thead>
                          <tr>
                            <th>Tanggal</th>
                            <th>Laba Bersih</th>
                            <th>Item Terjual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageData.map((row) => (
                            <tr key={row.tanggal}>
                              <td>{formatTanggal(row.tanggal)}</td>
                              <td>
                                <strong>{formatRupiahFull(row.laba_bersih)}</strong>
                              </td>
                              <td>{row.jumlah_produk.toLocaleString("id-ID")} Item</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mitra-dashboard-pagination">
                      <span>
                        Menampilkan {pageData.length} dari {labaHarian.length} hari
                      </span>

                      <div>
                        <button type="button" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
                          Sebelumnya
                        </button>
                        <button
                          type="button"
                          disabled={page >= totalPages - 1}
                          onClick={() => setPage((current) => current + 1)}
                        >
                          Berikutnya
                        </button>
                      </div>
                    </div>
                  </article>

                  <article className="mitra-dashboard-card">
                    <div className="mitra-dashboard-card-header">
                      <div>
                        <span>Tren Penjualan</span>
                        <h2>Pergerakan Laba</h2>
                      </div>

                      <select
                        value={trendRange}
                        onChange={(event) => setTrendRange(Number(event.target.value) as 7 | 14 | 30 | 90)}
                      >
                        <option value={7}>7 Hari</option>
                        <option value={14}>14 Hari</option>
                        <option value={30}>30 Hari</option>
                        <option value={90}>Kuartal</option>
                      </select>
                    </div>

                    {trenData.length === 0 ? (
                      <div className="mitra-dashboard-chart-empty">
                        <LineChartIcon size={34} />
                        <strong>Belum ada tren penjualan</strong>
                        <span>Data tren akan muncul setelah UMKM mencatat penjualan.</span>
                      </div>
                    ) : (
                      <div className="mitra-dashboard-chart">
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={trenData} margin={{ top: 10, right: 16, bottom: 4, left: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="hari" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `${Number(value) / 1000}K`} />
                            <Tooltip
                              formatter={(value) => {
                                const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                                return [formatRupiahFull(numericValue), "Laba"];
                              }}
                              contentStyle={{
                                borderRadius: 14,
                                border: "1px solid #dbeafe",
                                fontSize: 12,
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="total_laba"
                              stroke="#1f45b6"
                              strokeWidth={3}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5, strokeWidth: 0 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </article>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </UmkmLayout>
  );
}
