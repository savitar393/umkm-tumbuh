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

function buildAreaChart(data: DashboardDailySale[]) {
  const width = 700;
  // const height = 220;
  const baseY = 188;
  const padX = 28;
  const maxValue = Math.max(...data.map((item) => item.total_omzet), 0);

  if (data.length === 0) {
    return {
      area: "",
      line: "",
      points: [],
    };
  }

  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? width / 2
        : padX + (index / (data.length - 1)) * (width - padX * 2);

    const y =
      maxValue > 0
        ? baseY - (item.total_omzet / maxValue) * 130
        : baseY;

    return {
      x,
      y,
      label: item.date.slice(5),
    };
  });

  const line = points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(" ");

  const first = points[0];
  const last = points[points.length - 1];

  const area = `${line} L ${last.x.toFixed(2)} ${baseY} L ${first.x.toFixed(
    2,
  )} ${baseY} Z`;

  return { area, line, points };
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
    () => buildAreaChart(summary?.daily_sales ?? []),
    [summary],
  );

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

            <Link className="umkm-dashboard-polish__primary-action" to="/umkm/sales/new">
              <Plus size={18} />
              Input Data Penjualan Baru
            </Link>
          </header>

          <div className="umkm-dashboard-polish__filter">
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
              <span>
                <CalendarDays size={16} />
                {formatDate(summary.period.from)} - {formatDate(summary.period.to)}
              </span>
            ) : null}
          </div>

          {error ? <div className="error-message">{error}</div> : null}

          <section className="umkm-dashboard-polish__summary">
            <article className="umkm-dashboard-polish__omzet-card">
              <span>Total Omzet</span>
              <strong>{formatRupiah(metrics?.total_omzet ?? 0)}</strong>
              <small>{rangeLabel(range)} dari transaksi final.</small>
            </article>

            <article className="umkm-dashboard-polish__metric-card">
              <div className="umkm-dashboard-polish__icon-badge">
                <ShoppingCart size={22} />
              </div>
              <span>Total Item Terjual</span>
              <strong>{metrics?.total_item ?? 0} Item</strong>
            </article>

            <article className="umkm-dashboard-polish__metric-card">
              <div className="umkm-dashboard-polish__icon-badge blue">
                <ReceiptText size={22} />
              </div>
              <span>Rata-rata/Item</span>
              <strong>{formatRupiah(averagePerItem)}</strong>
            </article>
          </section>

          <section className="umkm-dashboard-polish__card">
            <div className="umkm-dashboard-polish__card-header">
              <div>
                <h2>
                  Rincian Laba Harian
                  {summary?.period.from
                    ? ` (${formatMonthYear(summary.period.from)})`
                    : ""}
                </h2>
                <p>Rekap laba bersih dan item terjual pada periode terpilih.</p>
              </div>

              <Link className="umkm-dashboard-polish__secondary-action" to="/umkm/sales">
                <ClipboardList size={18} />
                Lihat Semua
              </Link>
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
                    {dailyRows.length === 0 ? (
                      <tr>
                        <td colSpan={3}>Belum ada laporan penjualan.</td>
                      </tr>
                    ) : (
                      dailyRows.map((item) => (
                        <tr key={item.date}>
                          <td>{formatDate(item.date)}</td>
                          <td>
                            <span className="umkm-dashboard-polish__profit">
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

          <section className="umkm-dashboard-polish__card">
            <div className="umkm-dashboard-polish__card-header">
              <div>
                <h2>Tren Penjualan Mingguan</h2>
                <p>Omzet harian berdasarkan periode yang dipilih.</p>
              </div>

              <div className="umkm-dashboard-polish__range-badge">
                <CalendarDays size={16} />
                {rangeLabel(range)}
              </div>
            </div>

            <div className="umkm-dashboard-polish__chart-card">
              {summary && summary.daily_sales.length > 0 ? (
                <>
                  <svg
                    className="umkm-dashboard-polish__chart"
                    viewBox="0 0 700 220"
                    role="img"
                    aria-label="Tren omzet harian"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="umkmDashboardArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3767df" stopOpacity="0.62" />
                        <stop offset="100%" stopColor="#3767df" stopOpacity="0.08" />
                      </linearGradient>
                    </defs>

                    <path d={chart.area} fill="url(#umkmDashboardArea)" />
                    <path
                      d={chart.line}
                      fill="none"
                      stroke="#3767df"
                      strokeWidth="4"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="umkm-dashboard-polish__chart-labels">
                    {chart.points.map((point) => (
                      <span key={point.label}>{point.label}</span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="umkm-dashboard-polish__empty">
                  Belum ada data tren penjualan.
                </p>
              )}
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
