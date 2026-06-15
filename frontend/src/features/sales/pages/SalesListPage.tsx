import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Plus, Search } from "lucide-react";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getSales, type SaleSummary } from "../api";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function SalesListPage() {
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalOmzet = useMemo(
    () => sales.reduce((sum, sale) => sum + sale.total_omzet, 0),
    [sales],
  );

  const totalProfit = useMemo(
    () => sales.reduce((sum, sale) => sum + sale.total_profit, 0),
    [sales],
  );

  const totalItems = useMemo(
    () => sales.reduce((sum, sale) => sum + sale.total_item, 0),
    [sales],
  );

  async function loadSales(params?: { from?: string; to?: string }) {
    setLoading(true);
    setError("");

    try {
      const response = await getSales(params);
      setSales(response.sales);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat catatan transaksi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, []);

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    loadSales({
      from: from || undefined,
      to: to || undefined,
    });
  }

  return (
    <UmkmLayout
      title="Catatan Transaksi"
      subtitle="Lihat laporan transaksi, omzet, laba, dan jumlah produk terjual."
    >
      <div className="feature-page">
        {error ? <div className="error-message">{error}</div> : null}

        <section className="stat-cards-grid sales-stat-grid">
          <article className="stat-card stat-card--blue">
            <div className="stat-card__icon-wrap">
              <ClipboardList size={24} />
            </div>
            <div>
              <div className="stat-card__label">Total Transaksi</div>
              <div className="stat-card__value">{sales.length}</div>
              <div className="stat-card__sub">Dalam filter aktif</div>
            </div>
          </article>

          <article className="stat-card stat-card--green">
            <div className="stat-card__icon-wrap">
              <ClipboardList size={24} />
            </div>
            <div>
              <div className="stat-card__label">Total Omzet</div>
              <div className="stat-card__value">{formatRupiah(totalOmzet)}</div>
              <div className="stat-card__sub">Dari catatan transaksi</div>
            </div>
          </article>

          <article className="stat-card stat-card--yellow">
            <div className="stat-card__icon-wrap">
              <ClipboardList size={24} />
            </div>
            <div>
              <div className="stat-card__label">Total Laba</div>
              <div className="stat-card__value">{formatRupiah(totalProfit)}</div>
              <div className="stat-card__sub">Input manual UMKM</div>
            </div>
          </article>

          <article className="stat-card stat-card--orange">
            <div className="stat-card__icon-wrap">
              <ClipboardList size={24} />
            </div>
            <div>
              <div className="stat-card__label">Item Terjual</div>
              <div className="stat-card__value">{totalItems}</div>
              <div className="stat-card__sub">Total unit</div>
            </div>
          </article>
        </section>

        <section className="dashboard-card wide">
          <div className="page-header">
            <div>
              <h2>Daftar Transaksi</h2>
              <p>Filter berdasarkan tanggal transaksi untuk laporan harian atau bulanan.</p>
            </div>

            <Link className="button" to="/umkm/sales/new">
              <Plus size={18} />
              Catat Transaksi
            </Link>
          </div>

          <form className="dashboard-filter-bar sales-filter-form" onSubmit={handleFilter}>
            <div className="filter-group">
              <span className="filter-label">Dari Tanggal</span>
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>

            <div className="filter-group">
              <span className="filter-label">Sampai Tanggal</span>
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>

            <div className="filter-group filter-group--btn">
              <button type="submit">
                <Search size={16} />
                Filter
              </button>
            </div>
          </form>

          {loading ? (
            <p>Memuat transaksi...</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>No. Transaksi</th>
                    <th>Tanggal</th>
                    <th>Total Omzet</th>
                    <th>Laba</th>
                    <th>Item</th>
                    <th>Status</th>
                    <th>Detail</th>
                  </tr>
                </thead>

                <tbody>
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={7}>Belum ada catatan transaksi.</td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id}>
                        <td>
                          <strong>{sale.transaction_number}</strong>
                          <br />
                          <span>{sale.note ?? "-"}</span>
                        </td>
                        <td>{formatDate(sale.transaction_date)}</td>
                        <td>{formatRupiah(sale.total_omzet)}</td>
                        <td>{formatRupiah(sale.total_profit)}</td>
                        <td>{sale.total_item}</td>
                        <td>{sale.status}</td>
                        <td>
                          <Link className="button secondary table-link-button" to={`/umkm/sales/${sale.id}`}>
                            Lihat
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
      </div>
    </UmkmLayout>
  );
}
