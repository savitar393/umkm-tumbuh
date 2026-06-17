import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CalendarDays, ClipboardList, Plus, ReceiptText, ShoppingCart } from "lucide-react";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import { getSales, type SaleSummary } from "../../sales/api";

type RoleDashboardPageProps = {
  title: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sevenDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return date.toISOString().slice(0, 10);
}

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
  }).format(new Date(value));
}

export default function RoleDashboardPage({ title }: RoleDashboardPageProps) {
  const user = getCurrentUser();
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const from = sevenDaysAgo();
  const to = today();

  useEffect(() => {
    async function loadSales() {
      if (!user || user.role !== "UMKM") return;

      setLoading(true);
      setError("");

      try {
        const response = await getSales({ from, to });
        setSales(response.sales);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat ringkasan penjualan.");
      } finally {
        setLoading(false);
      }
    }

    loadSales();
  }, [user, from, to]);

  const todaySales = useMemo(
    () => sales.filter((sale) => sale.transaction_date === today()),
    [sales],
  );

  const todayOmzet = todaySales.reduce((sum, sale) => sum + sale.total_omzet, 0);
  const todayProfit = todaySales.reduce((sum, sale) => sum + sale.total_profit, 0);
  const todayItem = todaySales.reduce((sum, sale) => sum + sale.total_item, 0);
  const averagePerItem = todayItem > 0 ? todayOmzet / todayItem : 0;

  const recentSales = [...sales]
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
    .slice(0, 5);

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "UMKM") {
    return (
      <UmkmLayout
        title=""
        subtitle=""
      >
        <div className="umkm-report-dashboard">
          <header className="report-dashboard-header">
            <div>
              <h1>Ringkasan Bisnis</h1>
              <p>Selamat datang kembali, berikut performa toko Anda hari ini.</p>
            </div>

            <Link className="button report-dashboard-action" to="/umkm/sales/new">
              <Plus size={18} />
              Input Data Penjualan Baru
            </Link>
          </header>

          {error ? <div className="error-message">{error}</div> : null}

          <section className="report-summary-grid">
            <article className="report-summary-primary">
              <span>Total Omzet Hari Ini</span>
              <strong>{formatRupiah(todayOmzet)}</strong>
              <small>Update otomatis dari laporan penjualan.</small>
            </article>

            <article className="report-summary-small">
              <ReceiptText size={24} />
              <span>Total Laba Hari Ini</span>
              <strong>{formatRupiah(todayProfit)}</strong>
            </article>

            <article className="report-summary-small">
              <ShoppingCart size={24} />
              <span>Total Item Terjual</span>
              <strong>{todayItem} Item</strong>
            </article>

            <article className="report-summary-small">
              <ReceiptText size={24} />
              <span>Rata-rata/Item</span>
              <strong>{formatRupiah(averagePerItem)}</strong>
            </article>
          </section>

          <section className="dashboard-card wide">
            <div className="page-header">
              <div>
                <h2>Rincian Laporan Penjualan</h2>
                <p>Menampilkan laporan penjualan dalam 7 hari terakhir.</p>
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
                      <th>Omzet</th>
                      <th>Laba Bersih</th>
                      <th>Item Terjual</th>
                      <th>Detail</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentSales.length === 0 ? (
                      <tr>
                        <td colSpan={5}>Belum ada laporan penjualan.</td>
                      </tr>
                    ) : (
                      recentSales.map((sale) => (
                        <tr key={sale.id}>
                          <td>{formatDate(sale.transaction_date)}</td>
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
                <h2>Tren Penjualan Mingguan</h2>
                <p>Visual awal berdasarkan laporan 7 hari terakhir.</p>
              </div>

              <div className="sales-date-badge">
                <CalendarDays size={16} />
                7 Hari Terakhir
              </div>
            </div>

            <div className="simple-trend-card">
              <div className="simple-trend-fill" />
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
