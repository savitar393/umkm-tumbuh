import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Check, Minus, Plus, Save } from "lucide-react";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getProducts, type Product } from "../../products/api";
import { createSale } from "../api";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateLong(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}


export default function SalesCreatePage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [transactionDate, setTransactionDate] = useState(today());
  const [totalProfit, setTotalProfit] = useState(0);
  const [note, setNote] = useState("Laporan penjualan harian.");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successSaleId, setSuccessSaleId] = useState("");
  const [error, setError] = useState("");

  const activeProducts = useMemo(
    () => products.filter((product) => product.status === "AKTIF"),
    [products],
  );

  const totalOmzet = useMemo(() => {
    return activeProducts.reduce((sum, product) => {
      const quantity = quantities[product.id] ?? 0;
      return sum + product.price * quantity;
    }, 0);
  }, [activeProducts, quantities]);

  const totalItem = useMemo(() => {
    return Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
  }, [quantities]);

  const averagePerItem = totalItem > 0 ? totalOmzet / totalItem : 0;

  async function loadProducts() {
    setLoadingProducts(true);
    setError("");

    try {
      const response = await getProducts({ status: "AKTIF" });
      setProducts(response.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat produk.");
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function setQuantity(product: Product, nextQuantity: number) {
    const safeQuantity = Math.max(0, Math.min(nextQuantity, product.stock));

    setQuantities((current) => ({
      ...current,
      [product.id]: safeQuantity,
    }));
  }

  function increment(product: Product) {
    setQuantity(product, (quantities[product.id] ?? 0) + 1);
  }

  function decrement(product: Product) {
    setQuantity(product, (quantities[product.id] ?? 0) - 1);
  }

  function validateForm() {
    if (!transactionDate) {
      return "Tanggal laporan wajib diisi.";
    }

    if (totalItem <= 0) {
      return "Minimal satu produk harus memiliki jumlah terjual.";
    }

    if (totalOmzet <= 0) {
      return "Total omzet harus lebih dari 0.";
    }

    if (totalProfit < 0) {
      return "Laba tidak boleh negatif.";
    }

    if (totalProfit >= totalOmzet) {
      return "Laba harus lebih kecil dari omzet.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payloadItems = activeProducts
        .map((product) => ({
          product_id: product.id,
          quantity: quantities[product.id] ?? 0,
        }))
        .filter((item) => item.quantity > 0);

      const response = await createSale({
        transaction_date: transactionDate,
        total_profit: Number(totalProfit),
        note,
        items: payloadItems,
      });

      setSuccessSaleId(response.sale.id);
      window.setTimeout(() => {
        navigate(`/umkm/sales/${response.sale.id}`);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan laporan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <UmkmLayout title="" subtitle="">
      <form className="sales-report-page" onSubmit={handleSubmit}>
        <header className="sales-report-header">
          <div>
            <div className="sales-report-kicker">Operasional UMKM</div>
            <h1>Laporan Penjualan Harian</h1>
          </div>

          <div className="sales-report-actions">
            <label className="sales-date-pill">
              <CalendarDays size={18} />
              <input
                type="date"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
              />
            </label>

            <button type="submit" disabled={saving || loadingProducts}>
              <Save size={18} />
              {saving ? "Menyimpan..." : "Simpan Laporan"}
            </button>
          </div>
        </header>

        {error ? <div className="error-message">{error}</div> : null}

        <section className="sales-report-summary">
          <article className="sales-summary-card sales-summary-card--dark">
            <span>Total Omzet Hari Ini</span>
            <strong>{formatRupiah(totalOmzet)}</strong>
            <small>Total transaksi: {totalItem} item</small>
            <small>Rata-rata/item: {formatRupiah(averagePerItem)}</small>
          </article>

          <article className="sales-summary-card sales-summary-card--blue">
            <span>Total Laba Hari Ini</span>
            <input
              type="number"
              min="0"
              value={totalProfit}
              onChange={(event) => setTotalProfit(Number(event.target.value))}
              placeholder="Input laba hari ini"
            />
            <small>Laba harus lebih kecil dari omzet.</small>
          </article>
        </section>

        <section className="sales-transaction-panel">
          <div className="sales-transaction-title">
            <h2>Transaksi</h2>
            <p>
              Pilih jumlah produk yang terjual pada {formatDateLong(transactionDate)}.
            </p>
          </div>

          <label className="sales-note-field">
            Catatan Laporan
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Catatan laporan"
            />
          </label>

          {loadingProducts ? (
            <p>Memuat produk...</p>
          ) : activeProducts.length === 0 ? (
            <p>Belum ada produk aktif. Tambahkan produk terlebih dahulu di Kelola Produk.</p>
          ) : (
            <div className="sales-product-list">
              {activeProducts.map((product) => {
                const quantity = quantities[product.id] ?? 0;
                const subtotal = product.price * quantity;

                return (
                  <article className="sales-product-row" key={product.id}>
                    <div className="sales-product-media">
                      <img src="/tumbuh.png" alt={product.name} />
                    </div>

                    <div className="sales-product-info">
                      <strong>{product.name}</strong>
                      <span>{formatRupiah(product.price)}</span>
                      <small>Stok tersedia: {product.stock}</small>
                    </div>

                    <div className="sales-qty-control">
                      <button type="button" onClick={() => decrement(product)}>
                        <Minus size={16} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={product.stock}
                        value={quantity}
                        onChange={(event) =>
                          setQuantity(product, Number(event.target.value))
                        }
                      />
                      <button type="button" onClick={() => increment(product)}>
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="sales-subtotal">
                      <span>Subtotal</span>
                      <strong>{formatRupiah(subtotal)}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="sales-report-submit-row">
            <Link className="button secondary" to="/umkm">
              Batal
            </Link>

            <button type="submit" disabled={saving || loadingProducts}>
              <Save size={18} />
              Submit
            </button>
          </div>
        </section>

        {successSaleId ? (
          <div className="sales-success-overlay">
            <div className="sales-success-modal">
              <div className="sales-success-icon">
                <Check size={34} />
              </div>
              <h2>Berhasil Simpan Laporan</h2>
              <p>
                Laporan Penjualan Harian untuk{" "}
                <strong>{formatDateLong(transactionDate)}</strong> telah berhasil
                disimpan dan disinkronkan dengan server pusat.
              </p>
            </div>
          </div>
        ) : null}
      </form>
    </UmkmLayout>
  );
}
