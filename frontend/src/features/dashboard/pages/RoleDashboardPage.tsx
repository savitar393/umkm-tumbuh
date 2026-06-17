import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  Plus,
  ReceiptText,
  ShoppingCart,
} from "lucide-react";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import {
  getUMKMDashboardSummary,
  type DashboardDailySale,
  type UMKMDashboardSummary,
} from "../api";

type RoleDashboardPageProps = {
  title: string;
};

type DashboardRange = "today" | "7d" | "30d" | "month";

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

function formatMonthYear(value?: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function rangeLabel(range: DashboardRange) {
  switch (range) {
    case "today":
      return "Hari Ini";
    case "30d":
      return "30 Hari Terakhir";
    case "month":
      return "Bulan Ini";
    case "7d":
    default:
      return "7 Hari Terakhir";
  }
}

function buildTrendPath(data: DashboardDailySale[]) {
  const width = 700;
  const height = 220;
  const paddingX = 24;
  const paddingY = 28;
  const baseline = height - paddingY;

  if (data.length === 0) {
    return {
      linePath: "",
      areaPath: "",
      points: [],
    };
  }

  const maxValue = Math.max(...data.map((item) => item.total_omzet), 0);
  const denominator = data.length > 1 ? data.length - 1 : 1;

  const points = data.map((item, index) => {
    const x =
      paddingX + (index / denominator) * (width - paddingX * 2);

    const y =
      maxValue > 0
        ? baseline -
          (item.total_omzet / maxValue) * (height - paddingY * 2)
        : baseline;

    return {
      x,
      y,
      label: item.date.slice(5),
      value: item.total_omzet,
    };
  });

  const linePath = points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");

  const first = points[0];
  const last = points[points.length - 1];

  const areaPath = `${linePath} L ${last.x.toFixed(2)} ${baseline} L ${first.x.toFixed(
    2,
  )} ${baseline} Z`;

  return {
    linePath,
    areaPath,
    points,
  };
}

export default function RoleDashboardPage({ title }: RoleDashboardPageProps) {
  const user = useMemo(() => getCurrentUser(), []);
  const [summary, setSummary] = useState<UMKMDashboardSummary | null>(null);
  const [range, setRange] = useState<DashboardRange>("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSummary() {
      if (!user || user.role !== "UMKM") return;

      setLoading(true);
      setError("");

      try {
        const response = await getUMKMDashboardSummary({ range });
        setSummary(response.summary);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal memuat ringkasan dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [user, range]);

  const metrics = summary?.metrics;

  const averagePerItem =
    metrics && metrics.total_item > 0
      ? metrics.total_omzet / metrics.total_item
      : 0;

  const dailyRows = useMemo(() => {
    if (!summary) return [];

    return [...summary.daily_sales]
      .filter(
        (item) =>
          item.total_item > 0 ||
          item.total_profit > 0 ||
          item.total_omzet > 0,
      )
      .reverse()
      .slice(0, 5);
  }, [summary]);

  const chart = useMemo(
    () => buildTrendPath(summary?.daily_sales ?? []),
    [summary],
  );

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "UMKM") {
    return (
      <UmkmLayout title="" subtitle="">
        <div className="umkm-report-dashboard">
          <header className="report-dashboard-header">
            <div>
              <h1>Ringkasan Bisnis</h1>
              <p>
                Selamat datang kembali, berikut performa toko Anda hari ini.
              </p>
            </div>

            <Link className="button report-dashboard-action" to="/umkm/sales/new">
              <Plus size={18} />
              Input Data Penjualan Baru
            </Link>
          </header>

          <div className="sales-filter-card dashboard-period-filter">
            <label htmlFor="dashboard-range">Periode laporan</label>
            <select
              id="dashboard-range"
              value={range}
              onChange={(event) => setRange(event.target.value as DashboardRange)}
            >
              <option value="today">Hari Ini</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="month">Bulan Ini</option>
            </select>

            {summary ? (
              <span className="sales-date-badge">
                <CalendarDays size={16} />
                {formatDate(summary.period.from)} - {formatDate(summary.period.to)}
              </span>
            ) : null}
          </div>

          {error ? <div className="error-message">{error}</div> : null}

          <section className="report-summary-grid dashboard-mockup-summary">
            <article className="report-summary-primary">
              <span>Total Omzet</span>
              <strong>{formatRupiah(metrics?.total_omzet ?? 0)}</strong>
              <small>{rangeLabel(range)} dari transaksi final.</small>
            </article>

            <article className="report-summary-small">
              <ShoppingCart size={24} />
              <span>Total Item Terjual</span>
              <strong>{metrics?.total_item ?? 0} Item</strong>
            </article>

            <article className="report-summary-small">
              <ReceiptText size={24} />
              <span>Rata-rata/Item</span>
              <strong>{formatRupiah(averagePerItem)}</strong>
            </article>
          </section>

          <section className="dashboard-card wide dashboard-mockup-card">
            <div className="page-header">
              <div>
                <h2>
                  Rincian Laba Harian
                  {summary?.period.from
                    ? ` (${formatMonthYear(summary.period.from)})`
                    : ""}
                </h2>
                <p>
                  Rekap laba bersih dan item terjual pada periode terpilih.
                </p>
              </div>

              <Link className="button secondary" to="/umkm/sales">
                <ClipboardList size={18} />
                Lihat Semua
              </Link>
            </div>

            {loading ? (
              <p className="dashboard-empty-state">Memuat laporan...</p>
            ) : (
              <div className="table-wrapper dashboard-mockup-table">
                <table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Laba Bersih</th>
                      <th>Item Terjual</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dailyRows.length === 0 ? (
                      <tr>
                        <td colSpan={3}>Belum ada laporan penjualan.</td>
                      </tr>
                    ) : (
                      dailyRows.map((item) => (
                        <tr key={item.date}>
                          <td>{formatDate(item.date)}</td>
                          <td>
                            <span className="profit-pill">
                              {formatRupiah(item.total_profit)}
                            </span>
                          </td>
                          <td>{item.total_item} Item</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="dashboard-card wide dashboard-mockup-card">
            <div className="page-header">
              <div>
                <h2>Tren Penjualan Mingguan</h2>
                <p>Omzet harian berdasarkan periode yang dipilih.</p>
              </div>

              <div className="sales-date-badge">
                <CalendarDays size={16} />
                {rangeLabel(range)}
              </div>
            </div>

            <div className="dashboard-trend-panel">
              {summary && summary.daily_sales.length > 0 ? (
                <svg
                  className="dashboard-trend-svg"
                  viewBox="0 0 700 220"
                  role="img"
                  aria-label="Tren omzet harian"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="dashboardTrendArea"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#3767df" stopOpacity="0.62" />
                      <stop offset="100%" stopColor="#3767df" stopOpacity="0.08" />
                    </linearGradient>
                  </defs>

                  <path d={chart.areaPath} fill="url(#dashboardTrendArea)" />
                  <path
                    d={chart.linePath}
                    fill="none"
                    stroke="#3767df"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />

                  {chart.points.map((point) => (
                    <circle
                      key={point.label}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#3767df"
                    />
                  ))}
                </svg>
              ) : (
                <p className="dashboard-empty-state">
                  Belum ada data tren penjualan.
                </p>
              )}

              <div className="dashboard-trend-labels">
                {(summary?.daily_sales ?? []).map((item) => (
                  <span key={item.date}>{item.date.slice(5)}</span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </UmkmLayout>
    );
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <h1>{title}</h1>
        <p>Login sebagai: {user.full_name}</p>
        <p>Role: {user.role}</p>
        <p>Status: {user.status}</p>
      </section>
    </main>
  );
}
