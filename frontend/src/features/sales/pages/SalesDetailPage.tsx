import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
        setError(err instanceof Error ? err.message : "Gagal memuat detail transaksi.");
      } finally {
        setLoading(false);
      }
    }

    loadSale();
  }, [id]);

  return (
    <UmkmLayout
      title="Detail Transaksi"
      subtitle="Rincian produk, subtotal, omzet, dan laba transaksi."
    >
      <div className="feature-page">
        <div className="page-header">
          <Link className="button secondary" to="/umkm/sales">
            <ArrowLeft size={18} />
            Kembali
          </Link>
        </div>

        {error ? <div className="error-message">{error}</div> : null}

        {loading ? (
          <p>Memuat detail transaksi...</p>
        ) : sale ? (
          <>
            <section className="dashboard-card wide sales-detail-summary">
              <div>
                <span>No. Transaksi</span>
                <strong>{sale.transaction_number}</strong>
              </div>
              <div>
                <span>Tanggal</span>
                <strong>{formatDate(sale.transaction_date)}</strong>
              </div>
              <div>
                <span>Total Omzet</span>
                <strong>{formatRupiah(sale.total_omzet)}</strong>
              </div>
              <div>
                <span>Laba</span>
                <strong>{formatRupiah(sale.total_profit)}</strong>
              </div>
              <div>
                <span>Total Item</span>
                <strong>{sale.total_item}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{sale.status}</strong>
              </div>
            </section>

            <section className="dashboard-card wide">
              <div className="page-header">
                <div>
                  <h2>Item Transaksi</h2>
                  <p>{sale.note ?? "Tidak ada catatan tambahan."}</p>
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
                    {sale.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_name}</td>
                        <td>{formatRupiah(item.unit_price)}</td>
                        <td>{item.quantity}</td>
                        <td>{formatRupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <p>Transaksi tidak ditemukan.</p>
        )}
      </div>
    </UmkmLayout>
  );
}
