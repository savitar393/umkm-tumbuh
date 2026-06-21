import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BarChart3, Banknote, Boxes, ClipboardList, Clock3, Plus, Search } from "lucide-react";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getSales, type SaleSummary } from "../api";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

const MOCK_SALES: SaleSummary[] = [
  {
    id: "mock-s1",
    umkm_id: "mock",
    transaction_number: "TRX-20260601-001",
    transaction_date: "2026-06-01T00:00:00Z",
    total_omzet: 1750000,
    total_profit: 450000,
    total_item: 23,
    note: "Penjualan pasar mingguan",
    status: "SELESAI",
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-01T10:00:00Z",
  },
  {
    id: "mock-s2",
    umkm_id: "mock",
    transaction_number: "TRX-20260602-001",
    transaction_date: "2026-06-02T00:00:00Z",
    total_omzet: 920000,
    total_profit: 210000,
    total_item: 12,
    note: "Pesanan online",
    status: "SELESAI",
    created_at: "2026-06-02T14:30:00Z",
    updated_at: "2026-06-02T14:30:00Z",
  },
  {
    id: "mock-s3",
    umkm_id: "mock",
    transaction_number: "TRX-20260603-001",
    transaction_date: "2026-06-03T00:00:00Z",
    total_omzet: 3100000,
    total_profit: 780000,
    total_item: 45,
    note: "Restock agen",
    status: "SELESAI",
    created_at: "2026-06-03T09:15:00Z",
    updated_at: "2026-06-03T09:15:00Z",
  },
  {
    id: "mock-s4",
    umkm_id: "mock",
    transaction_number: "TRX-20260604-001",
    transaction_date: "2026-06-04T00:00:00Z",
    total_omzet: 550000,
    total_profit: 125000,
    total_item: 8,
    note: null,
    status: "SELESAI",
    created_at: "2026-06-04T16:00:00Z",
    updated_at: "2026-06-04T16:00:00Z",
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function SalesListPage() {
  const [searchParams] = useSearchParams();
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [useMock, setUseMock] = useState(false);

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

  const sortedSales = useMemo(() => {
    return [...sales].sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
        case "omzet_desc":
          return b.total_omzet - a.total_omzet;
        case "omzet_asc":
          return a.total_omzet - b.total_omzet;
        case "profit_desc":
          return b.total_profit - a.total_profit;
        case "updated_desc":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "date_desc":
        default:
          return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
      }
    });
  }, [sales, sortBy]);

  async function loadSales(params?: { from?: string; to?: string }) {
    setLoading(true);
    setError("");

    try {
      const response = await getSales(params);
      setSales(response.sales);
      setUseMock(false);
    } catch (err) {
      setUseMock(true);
      setError(err instanceof Error ? err.message : "Gagal memuat laporan penjualan.");
      setSales(MOCK_SALES);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales({
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
    });
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
      title="Laporan Penjualan Harian"
      subtitle="Pantau laporan harian omzet, laba, dan item terjual untuk perkembangan usaha."
    >
      <div className="feature-page">
        {error ? <div className="error-message">{error}</div> : null}
        {useMock ? <div className="error-message" style={{ background: "#fff3cd", color: "#856404", border: "1px solid #ffeeba" }}>Mode offline — menampilkan data contoh. Backend tidak terhubung.</div> : null}

        <section className="stat-cards-grid sales-stat-grid">
          <article className="stat-card stat-card--blue">
            <div className="stat-card__icon-wrap">
              <Banknote size={24} />
            </div>
            <div>
              <div className="stat-card__label">Total Laporan</div>
              <div className="stat-card__value">{sales.length}</div>
              <div className="stat-card__sub">Dalam filter aktif</div>
            </div>
          </article>

          <article className="stat-card stat-card--green">
            <div className="stat-card__icon-wrap">
              <BarChart3 size={24} />
            </div>
            <div>
              <div className="stat-card__label">Total Omzet</div>
              <div className="stat-card__value">{formatRupiah(totalOmzet)}</div>
              <div className="stat-card__sub">Dari laporan harian</div>
            </div>
          </article>

          <article className="stat-card stat-card--yellow">
            <div className="stat-card__icon-wrap">
              <Boxes size={24} />
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

        <section className="dashboard-card wide sales-history-card">
          <div className="page-header">
            <div>
              <h2>Riwayat Laporan Penjualan</h2>
              <p>Filter laporan harian berdasarkan tanggal untuk melihat perkembangan usaha.</p>
            </div>

            <Link className="button" to="/umkm/sales/new">
              <Plus size={18} />
              Input Laporan Harian
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

          <div className="sales-table-toolbar">
            <div>
              <strong>Daftar laporan</strong>
              <span>{sales.length} laporan dalam filter aktif</span>
            </div>

            <label>
              Urutkan
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="date_desc">Tanggal laporan terbaru</option>
                <option value="date_asc">Tanggal laporan terlama</option>
                <option value="updated_desc">Terakhir diupdate</option>
                <option value="omzet_desc">Omzet tertinggi</option>
                <option value="omzet_asc">Omzet terendah</option>
                <option value="profit_desc">Laba tertinggi</option>
              </select>
            </label>
          </div>

          {loading ? (
            <p>Memuat laporan...</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Kode Laporan</th>
                    <th>Tanggal Laporan</th>
                    <th>Total Omzet</th>
                    <th>Laba</th>
                    <th>Item</th>
                    <th>Status</th>
                    <th>Tanggal Dibuat</th>
                    <th>Terakhir Diupdate</th>
                    <th>Detail</th>
                  </tr>
                </thead>

                <tbody>
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={9}>Belum ada laporan penjualan harian.</td>
                    </tr>
                  ) : (
                    sortedSales.map((sale) => (
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
                          <span className="sales-date-muted">
                            <Clock3 size={14} />
                            {formatDateTime(sale.created_at)}
                          </span>
                        </td>
                        <td>
                          <span className="sales-date-muted">
                            <Clock3 size={14} />
                            {formatDateTime(sale.updated_at)}
                          </span>
                        </td>
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
