import { useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Gauge,
  Handshake,
  LogOut,
  ReceiptText,
  ShoppingCart,
} from "lucide-react";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { clearAuthStorage, getCurrentUser } from "../../../shared/auth/currentUser";
import {
  getUMKMDashboard,
  type UMKMDashboardData,
} from "../api";

type RoleDashboardPageProps = {
  title: string;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const YEARS = [2026, 2025, 2024, 2023];
const PAGE_SIZE = 5;

type TrendRange = 7 | 14 | 30 | 90;

function buildAreaChart(data: { hari: string; total_laba: number }[]) {
  const width = 700;
  const baseY = 188;
  const padX = 28;
  const maxValue = Math.max(...data.map((item) => item.total_laba), 0);

  if (data.length === 0) {
    return { area: "", line: "", points: [] };
  }

  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? width / 2
        : padX + (index / (data.length - 1)) * (width - padX * 2);
    const y = maxValue > 0 ? baseY - (item.total_laba / maxValue) * 130 : baseY;
    return { x, y, label: item.hari };
  });

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

  const first = points[0];
  const last = points[points.length - 1];
  const area = `${line} L ${last.x.toFixed(2)} ${baseY} L ${first.x.toFixed(2)} ${baseY} Z`;

  return { area, line, points };
}

type MitraDashboardData = {
  totalPartnerships: number;
  activePartnerships: number;
  totalUmkm: number;
  incomingPartnerships: { umkm_id: string; umkm_nama?: string; status: string; tanggal: string }[];
};

export default function RoleDashboardPage(_props: RoleDashboardPageProps) {
  const user = useMemo(() => getCurrentUser(), []);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<MitraDashboardData | null>(null);

  useEffect(() => {
    if (user?.role !== "MITRA") return;
    async function loadMitraDashboard() {
      try {
        const { http } = await import("../../../shared/api/http");
        const resp = await http.get<any>("/partnerships/incoming?page=1&limit=5", { service: "partnership" });
        const rawItems = resp?.data?.data || resp?.data || [];
        const items = Array.isArray(rawItems) ? rawItems : [];
        const incoming = items.slice(0, 5).map((p: any) => ({
          umkm_id: p.umkm_id || p.pengaju_umkm_id || "",
          umkm_nama: p.umkm_nama || p.nama_umkm || "",
          status: p.status_pengajuan_id || p.status || "",
          tanggal: p.tanggal_pengajuan || p.created_at || "",
        }));
        setDashboardData({
          totalPartnerships: resp?.total || items.length,
          activePartnerships: incoming.filter((p) => p.status === "AKTIF" || p.status === "DISETUJUI").length,
          totalUmkm: incoming.length,
          incomingPartnerships: incoming,
        });
      } catch {
        setDashboardData({ totalPartnerships: 0, activePartnerships: 0, totalUmkm: 0, incomingPartnerships: [] });
      }
    }
    loadMitraDashboard();
  }, [user]);
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth());
  const [tahun, setTahun] = useState(now.getFullYear());
  const [trendRange, setTrendRange] = useState<TrendRange>(7);
  const [data, setData] = useState<UMKMDashboardData | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function buildDateRange() {
    const from = `${tahun}-${String(bulan + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(tahun, bulan + 1, 0).getDate();
    const to = `${tahun}-${String(bulan + 1).padStart(2, "0")}-${lastDay}`;
    return { from, to };
  }

  function fetchDashboard() {
    if (!user || user.role !== "UMKM") return;
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
    if (!user || user.role !== "UMKM") return;
    setLoading(true);
    setError("");
    const { from, to } = buildDateRange();
    getUMKMDashboard(from, to)
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat data"))
      .finally(() => setLoading(false));
  }, [user]);

  const labaRows = useMemo(() => {
    if (!data?.laba_harian) return [];
    return data.laba_harian.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  }, [data, page]);

  const totalPages = data ? Math.ceil((data.laba_harian?.length ?? 0) / PAGE_SIZE) : 0;

  const trendData = data?.tren_mingguan?.slice(-trendRange) ?? [];

  const chart = useMemo(() => buildAreaChart(trendData), [trendData]);

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "UMKM") {
    return (
      <UmkmLayout title="" subtitle="">
        <div className="umkm-dashboard-polish">
          <header className="umkm-dashboard-polish__header">
            <div>
              <span>Ringkasan Bisnis</span>
              <h1>Ringkasan Bisnis</h1>
              <p>
                Selamat datang kembali, berikut performa toko Anda hari ini.
              </p>
            </div>


          </header>

          {/* ── Filter ─────────────────────────────────── */}
          <div className="umkm-dashboard-polish__filter">
            <label>Bulan</label>
            <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
              {MONTHS.map((m, i) => (<option key={i} value={i}>{m}</option>))}
            </select>
            <label>Tahun</label>
            <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
              {YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
            <button className="umkm-dashboard-polish__secondary-action" onClick={fetchDashboard}>
              <CalendarDays size={16} /> Terapkan
            </button>
          </div>

          {error ? <div className="error-message">{error}</div> : null}

          <section className="umkm-dashboard-polish__summary">
            <article className="umkm-dashboard-polish__omzet-card">
              <span>Total Omzet Hari Ini</span>
              <strong>{formatRupiah(data?.total_omzet_hari_ini ?? 0)}</strong>
              <small>{data?.persen_vs_kemarin != null ? `${data.persen_vs_kemarin >= 0 ? "+" : ""}${data.persen_vs_kemarin.toFixed(1)}% vs kemarin` : ""}</small>
            </article>

            <article className="umkm-dashboard-polish__metric-card">
              <div className="umkm-dashboard-polish__icon-badge">
                <ShoppingCart size={22} />
              </div>
              <span>Total Item Terjual</span>
              <strong>{data?.total_item_terjual ?? 0} Item</strong>
            </article>

            <article className="umkm-dashboard-polish__metric-card">
              <div className="umkm-dashboard-polish__icon-badge blue">
                <ReceiptText size={22} />
              </div>
              <span>Rata-rata/Item</span>
              <strong>{formatRupiah(data?.rata_rata_per_item ?? 0)}</strong>
            </article>
          </section>

          <section className="umkm-dashboard-polish__card">
            <div className="umkm-dashboard-polish__card-header">
              <div>
                <h2>Rincian Laba Harian ({MONTHS[bulan]} {tahun})</h2>
                <p>Rekap laba bersih dan item terjual pada periode terpilih.</p>
              </div>
            </div>

            {loading ? (
              <p className="umkm-dashboard-polish__empty">Memuat laporan...</p>
            ) : (
              <div className="umkm-dashboard-polish__table">
                <table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Laba Bersih</th>
                      <th>Item Terjual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labaRows.length === 0 ? (
                      <tr>
                        <td colSpan={3}>Belum ada laporan penjualan.</td>
                      </tr>
                    ) : (
                      labaRows.map((item) => (
                        <tr key={item.tanggal}>
                          <td>{formatDate(item.tanggal)}</td>
                          <td>
                            <span className="umkm-dashboard-polish__profit">
                              {formatRupiah(item.laba_bersih)}
                            </span>
                          </td>
                          <td>{item.jumlah_produk} Item</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <span>Menampilkan {Math.min(PAGE_SIZE, (data?.laba_harian?.length ?? 0) - page * PAGE_SIZE)} dari {data?.laba_harian?.length ?? 0} hari</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="umkm-dashboard-polish__secondary-action" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Sebelumnya</button>
                      <button className="umkm-dashboard-polish__secondary-action" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Berikutnya</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="umkm-dashboard-polish__card">
            <div className="umkm-dashboard-polish__card-header">
              <div>
                <h2>Tren Penjualan Mingguan</h2>
                <p>Laba harian berdasarkan periode.</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {([7, 14, 30, 90] as TrendRange[]).map(r => (
                  <button key={r} className={`umkm-dashboard-polish__range-badge ${trendRange === r ? "active" : ""}`}
                    onClick={() => setTrendRange(r)} style={{ cursor: "pointer", border: 0, ...trendRange === r ? { background: "#3767df", color: "#fff" } : {} }}>
                    {r} Hari
                  </button>
                ))}
              </div>
            </div>

            <div className="umkm-dashboard-polish__chart-card">
              {trendData.length > 0 ? (
                <>
                  <svg className="umkm-dashboard-polish__chart" viewBox="0 0 700 220" role="img" aria-label="Tren laba harian" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="umkmDashboardArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3767df" stopOpacity="0.62" />
                        <stop offset="100%" stopColor="#3767df" stopOpacity="0.08" />
                      </linearGradient>
                    </defs>
                    <path d={chart.area} fill="url(#umkmDashboardArea)" />
                    <path d={chart.line} fill="none" stroke="#3767df" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                  <div className="umkm-dashboard-polish__chart-labels">
                    {chart.points.map((point) => (
                      <span key={point.label}>{point.label}</span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="umkm-dashboard-polish__empty">Belum ada data tren.</p>
              )}
            </div>
          </section>
        </div>
      </UmkmLayout>
    );
  }

  return (
    <div className="umkm-shell">
      <aside className="umkm-sidebar">
        <div className="umkm-brand">
          <img src="/tumbuh.png" alt="UMKM Tumbuh" />
          <span>UMKM Tumbuh</span>
        </div>
        <nav className="umkm-nav">
          <NavLink to="/mitra" end className={({ isActive }) => `umkm-nav-link ${isActive ? "active" : ""}`}>
            <Gauge size={18} /><span>Dashboard</span>
          </NavLink>
          <NavLink to="/mitra/partnerships" className={({ isActive }) => `umkm-nav-link ${isActive ? "active" : ""}`}>
            <Handshake size={18} /><span>Kemitraan</span>
          </NavLink>
          <NavLink to="/mitra/profile" className={({ isActive }) => `umkm-nav-link ${isActive ? "active" : ""}`}>
            <Building2 size={18} /><span>Kelola Informasi</span>
          </NavLink>
        </nav>
        <button className="umkm-logout" onClick={() => { clearAuthStorage(); navigate("/login"); }}>
          <LogOut size={18} /><span>Keluar</span>
        </button>
      </aside>
      <section className="umkm-main">
        <header className="umkm-topbar">
          <div>
            <div className="umkm-breadcrumb">Dashboard Mitra</div>
            <h1>Dashboard Mitra</h1>
            <p>Selamat datang, {user?.full_name ?? "Mitra"}.</p>
          </div>
          <div className="umkm-topbar-right">
            <div className="umkm-user-chip">
              <div>
                <strong>{user?.full_name ?? "User"}</strong>
                <span>Mitra</span>
              </div>
              <div className="umkm-avatar">{user?.full_name?.[0]?.toUpperCase() ?? "U"}</div>
            </div>
          </div>
        </header>
        <div className="umkm-content">
          <div className="umkm-dashboard-polish">
            <section className="umkm-dashboard-polish__summary">
              <article className="umkm-dashboard-polish__omzet-card">
                <span>Total Kemitraan</span>
                <strong>{dashboardData?.totalPartnerships ?? "—"}</strong>
                <small>Pengajuan keseluruhan</small>
              </article>
              <article className="umkm-dashboard-polish__metric-card">
                <div className="umkm-dashboard-polish__icon-badge">
                  <Handshake size={22} />
                </div>
                <span>Aktif</span>
                <strong>{dashboardData?.activePartnerships ?? 0}</strong>
              </article>
              <article className="umkm-dashboard-polish__metric-card">
                <div className="umkm-dashboard-polish__icon-badge blue">
                  <Building2 size={22} />
                </div>
                <span>Total UMKM</span>
                <strong>{dashboardData?.totalUmkm ?? 0}</strong>
              </article>
            </section>

            <section className="umkm-dashboard-polish__card">
              <div className="umkm-dashboard-polish__card-header">
                <div>
                  <h2>Pengajuan Kemitraan Masuk</h2>
                  <p>Daftar permintaan kemitraan dari pelaku UMKM.</p>
                </div>
              </div>
              <div className="umkm-dashboard-polish__table">
                <table>
                  <thead>
                    <tr>
                      <th>UMKM</th>
                      <th>Status</th>
                      <th>Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData?.incomingPartnerships && dashboardData.incomingPartnerships.length > 0 ? (
                      dashboardData.incomingPartnerships.map((p, i) => (
                        <tr key={i}>
                          <td>{p.umkm_nama || `UMKM #${p.umkm_id?.slice(-6) ?? i}`}</td>
                          <td><span className="umkm-dashboard-polish__profit">{p.status}</span></td>
                          <td>{p.tanggal ? new Date(p.tanggal).toLocaleDateString("id-ID") : "—"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3}>Belum ada pengajuan kemitraan.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
