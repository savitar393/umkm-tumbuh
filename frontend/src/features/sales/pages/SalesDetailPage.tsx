import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Clock3,
  FileText,
  PackageCheck,
  ReceiptText,
  Tags,
} from "lucide-react";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getSale, type SaleDetail } from "../api";

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
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  if (status === "FINAL") return "Final";
  if (status === "DRAFT") return "Draft";
  if (status === "CANCELLED") return "Dibatalkan";
  return status;
}

function statusClass(status: string) {
  if (status === "FINAL") return "final";
  if (status === "DRAFT") return "draft";
  if (status === "CANCELLED") return "cancelled";
  return "default";
}

export default function SalesDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSale() {
      if (!id) return;

      setLoading(true);
      setError("");

      try {
        const response = await getSale(id);
        setSale(response.sale);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat detail laporan.");
      } finally {
        setLoading(false);
      }
    }

    loadSale();
  }, [id]);

  return (
    <UmkmLayout>
      <div className="feature-page sales-detail-page">
        <section className="sales-detail-hero">
          <div>
            <p className="sales-report-kicker">Laporan Harian</p>
            <h1>Detail Laporan Penjualan</h1>
            <p>Ringkasan omzet, laba, dan item produk pada laporan harian.</p>
          </div>

          <Link className="button secondary" to="/umkm/sales">
            <ArrowLeft size={18} />
            Kembali ke Riwayat
          </Link>
        </section>

        {error ? <div className="error-message">{error}</div> : null}

        {loading ? (
          <p>Memuat detail laporan...</p>
        ) : sale ? (
          <>
            <section className="sales-detail-summary-card">
              <div className="sales-detail-summary-card__header">
                <div>
                  <span>Kode Laporan</span>
                  <strong>{sale.transaction_number}</strong>
                </div>

                <span className={`sales-status-badge ${statusClass(sale.status)}`}>
                  {statusLabel(sale.status)}
                </span>
              </div>

              <div className="sales-detail-metrics">
                <article>
                  <CalendarDays size={22} />
                  <span>Tanggal Laporan</span>
                  <strong>{formatDate(sale.transaction_date)}</strong>
                </article>

                <article>
                  <ReceiptText size={22} />
                  <span>Total Omzet</span>
                  <strong>{formatRupiah(sale.total_omzet)}</strong>
                </article>

                <article>
                  <Banknote size={22} />
                  <span>Laba Bersih</span>
                  <strong>{formatRupiah(sale.total_profit)}</strong>
                </article>

                <article>
                  <PackageCheck size={22} />
                  <span>Total Item</span>
                  <strong>{sale.total_item} Item</strong>
                </article>
              </div>

              <div className="sales-detail-meta-grid">
                <div>
                  <Clock3 size={18} />
                  <span>Tanggal Dibuat</span>
                  <strong>{formatDateTime(sale.created_at)}</strong>
                </div>

                <div>
                  <Clock3 size={18} />
                  <span>Terakhir Diperbarui</span>
                  <strong>{formatDateTime(sale.updated_at)}</strong>
                </div>

                <div className="sales-detail-note">
                  <FileText size={18} />
                  <span>Catatan Laporan</span>
                  <strong>{sale.note || "Tidak ada catatan tambahan."}</strong>
                </div>
              </div>
            </section>

            <section className="dashboard-card wide sales-detail-items-card">
              <div className="page-header">
                <div>
                  <p className="sales-report-kicker">Rincian Produk</p>
                  <h2>Item Laporan</h2>
                  <p>Produk yang tercatat pada laporan penjualan harian ini.</p>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Harga Satuan</th>
                      <th>Jumlah</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sale.items.length === 0 ? (
                      <tr>
                        <td colSpan={4}>Belum ada item pada laporan ini.</td>
                      </tr>
                    ) : (
                      sale.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <span className="sales-item-product">
                              <Tags size={16} />
                              {item.product_name}
                            </span>
                          </td>
                          <td>{formatRupiah(item.unit_price)}</td>
                          <td>{item.quantity} Item</td>
                          <td>{formatRupiah(item.subtotal)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <p>Laporan tidak ditemukan.</p>
        )}
      </div>
    </UmkmLayout>
  );
}
