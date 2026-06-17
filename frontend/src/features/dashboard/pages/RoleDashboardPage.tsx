import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  Package,
  Plus,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import {
  getUMKMDashboardSummary,
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

export default function RoleDashboardPage({ title }: RoleDashboardPageProps) {
  const user = getCurrentUser();
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

  const maxDailyOmzet = useMemo(() => {
    if (!summary?.daily_sales.length) return 0;

    return Math.max(
      ...summary.daily_sales.map((item) => item.total_omzet),
      0,
    );
  }, [summary]);

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "UMKM") {
    return (
      <UmkmLayout title="" subtitle="">
        <div className="umkm-report-dashboard">
          <header className="report-dashboard-header">
            <div>
              <h1>Ringkasan Bisnis</h1>
              <p>
                Selamat datang kembali, berikut performa toko Anda berdasarkan
                data laporan terbaru.
              </p>
            </div>

            <Link className="button report-dashboard-action" to="/umkm/sales/new">
              <Plus size={18} />
              Input Data Penjualan Baru
            </Link>
          </header>

          <div className="sales-filter-card">
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

          <section className="report-summary-grid">
            <article className="report-summary-primary">
              <span>Total Omzet</span>
              <strong>{formatRupiah(metrics?.total_omzet ?? 0)}</strong>
              <small>{rangeLabel(range)} dari transaksi final.</small>
            </article>

            <article className="report-summary-small">
              <ReceiptText size={24} />
              <span>Total Laba</span>
              <strong>{formatRupiah(metrics?.total_profit ?? 0)}</strong>
            </article>

            <article className="report-summary-small">
              <ShoppingCart size={24} />
              <span>Total Item Terjual</span>
              <strong>{metrics?.total_item ?? 0} Item</strong>
            </article>

            <article className="report-summary-small">
              <TrendingUp size={24} />
              <span>Rata-rata Transaksi</span>
              <strong>{formatRupiah(metrics?.average_order ?? 0)}</strong>
            </article>
          </section>

          <section className="report-summary-grid">
            <article className="report-summary-small">
              <Package size={24} />
              <span>Produk Aktif</span>
              <strong>{metrics?.active_products ?? 0}</strong>
            </article>

            <article className="report-summary-small">
              <Package size={24} />
              <span>Total Stok</span>
              <strong>{metrics?.total_stock ?? 0}</strong>
            </article>

            <article className="report-summary-small">
              <AlertTriangle size={24} />
              <span>Produk Stok Rendah</span>
              <strong>{metrics?.low_stock_count ?? 0}</strong>
            </article>

            <article className="report-summary-small">
              <ReceiptText size={24} />
              <span>Total Transaksi</span>
              <strong>{metrics?.transaction_count ?? 0}</strong>
            </article>
          </section>

          <section className="dashboard-card wide">
            <div className="page-header">
              <div>
                <h2>Rincian Laporan Penjualan</h2>
                <p>Menampilkan transaksi terbaru pada periode yang dipilih.</p>
              </div>

              <Link className="button secondary" to="/umkm/sales">
                <ClipboardList size={18} />
                Lihat Semua
              </Link>
            </div>

            {loading ? (
              <p>Memuat laporan...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Nomor</th>
                      <th>Omzet</th>
                      <th>Laba Bersih</th>
                      <th>Item</th>
                      <th>Detail</th>
                    </tr>
                  </thead>

                  <tbody>
                    {!summary || summary.recent_sales.length === 0 ? (
                      <tr>
                        <td colSpan={6}>Belum ada laporan penjualan.</td>
                      </tr>
                    ) : (
                      summary.recent_sales.map((sale) => (
                        <tr key={sale.id}>
                          <td>{formatDate(sale.transaction_date)}</td>
                          <td>{sale.transaction_number}</td>
                          <td>{formatRupiah(sale.total_omzet)}</td>
                          <td>
                            <span className="profit-pill">
                              {formatRupiah(sale.total_profit)}
                            </span>
                          </td>
                          <td>{sale.total_item} Item</td>
                          <td>
                            <Link
                              className="button secondary table-link-button"
                              to={`/umkm/sales/${sale.id}`}
                            >
                              Detail
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="dashboard-card wide">
            <div className="page-header">
              <div>
                <h2>Tren Penjualan</h2>
                <p>Omzet harian berdasarkan periode yang dipilih.</p>
              </div>

              <div className="sales-date-badge">
                <CalendarDays size={16} />
                {rangeLabel(range)}
              </div>
            </div>

            <div className="simple-trend-card dashboard-bar-list">
              {summary?.daily_sales.map((item) => {
                const percentage =
                  maxDailyOmzet > 0
                    ? Math.max((item.total_omzet / maxDailyOmzet) * 100, 4)
                    : 4;

                return (
                  <div className="dashboard-bar-row" key={item.date}>
                    <span>{item.date.slice(5)}</span>
                    <div className="dashboard-bar-track">
                      <div
                        className="simple-trend-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <strong>{formatRupiah(item.total_omzet)}</strong>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="dashboard-card wide">
            <div className="page-header">
              <div>
                <h2>Produk Terlaris</h2>
                <p>Produk dengan jumlah penjualan tertinggi pada periode ini.</p>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Terjual</th>
                    <th>Omzet</th>
                  </tr>
                </thead>

                <tbody>
                  {!summary || summary.top_products.length === 0 ? (
                    <tr>
                      <td colSpan={3}>Belum ada data produk terjual.</td>
                    </tr>
                  ) : (
                    summary.top_products.map((product) => (
                      <tr key={product.product_id}>
                        <td>{product.product_name}</td>
                        <td>{product.total_sold} Item</td>
                        <td>{formatRupiah(product.total_revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="dashboard-card wide">
            <div className="page-header">
              <div>
                <h2>Produk Stok Rendah</h2>
                <p>Produk aktif dengan stok kurang dari atau sama dengan 10.</p>
              </div>

              <Link className="button secondary" to="/umkm/products">
                Kelola Produk
              </Link>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Stok</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {!summary || summary.low_stock_products.length === 0 ? (
                    <tr>
                      <td colSpan={3}>Tidak ada produk stok rendah.</td>
                    </tr>
                  ) : (
                    summary.low_stock_products.map((product) => (
                      <tr key={product.product_id}>
                        <td>{product.product_name}</td>
                        <td>{product.stock}</td>
                        <td>{product.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
