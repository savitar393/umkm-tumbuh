import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getProducts, type Product } from "../../products/api";
import { createSale } from "../api";

type SaleFormItem = {
  product_id: string;
  quantity: number;
};

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

export default function SalesCreatePage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [transactionDate, setTransactionDate] = useState(today());
  const [totalProfit, setTotalProfit] = useState(0);
  const [note, setNote] = useState("");
  const [items, setItems] = useState<SaleFormItem[]>([
    { product_id: "", quantity: 1 },
  ]);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const availableProducts = useMemo(
    () => products.filter((product) => product.status === "AKTIF" && product.stock > 0),
    [products],
  );

  const productById = useMemo(() => {
    const map = new Map<string, Product>();

    for (const product of products) {
      map.set(product.id, product);
    }

    return map;
  }, [products]);

  const computedItems = items.map((item) => {
    const product = productById.get(item.product_id);
    const unitPrice = product?.price ?? 0;
    const subtotal = unitPrice * item.quantity;

    return {
      ...item,
      product,
      unitPrice,
      subtotal,
    };
  });

  const totalOmzet = computedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalQuantity = computedItems.reduce((sum, item) => sum + item.quantity, 0);

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

  function updateItem(index: number, patch: Partial<SaleFormItem>) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [...current, { product_id: "", quantity: 1 }]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function validateForm() {
    if (!transactionDate) {
      return "Tanggal transaksi wajib diisi.";
    }

    if (items.length === 0) {
      return "Minimal satu produk harus dipilih.";
    }

    const selected = new Set<string>();

    for (const item of items) {
      if (!item.product_id) {
        return "Semua baris produk wajib dipilih.";
      }

      if (selected.has(item.product_id)) {
        return "Produk tidak boleh duplikat dalam satu transaksi.";
      }

      selected.add(item.product_id);

      const product = productById.get(item.product_id);

      if (!product) {
        return "Produk tidak ditemukan.";
      }

      if (item.quantity <= 0) {
        return `Jumlah produk ${product.name} harus lebih dari 0.`;
      }

      if (item.quantity > product.stock) {
        return `Stok ${product.name} tidak cukup. Stok tersedia: ${product.stock}.`;
      }
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
      const response = await createSale({
        transaction_date: transactionDate,
        total_profit: Number(totalProfit),
        note,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: Number(item.quantity),
        })),
      });

      navigate(`/umkm/sales/${response.sale.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan transaksi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <UmkmLayout
      title="Catat Transaksi"
      subtitle="Pilih produk dari stok tersedia, isi jumlah terjual, lalu simpan sebagai laporan transaksi."
    >
      <div className="feature-page">
        <div className="page-header">
          <Link className="button secondary" to="/umkm/sales">
            <ArrowLeft size={18} />
            Kembali
          </Link>
        </div>

        {error ? <div className="error-message">{error}</div> : null}

        <form className="dashboard-card wide sales-create-form" onSubmit={handleSubmit}>
          <div className="sales-create-grid">
            <label>
              Tanggal Transaksi
              <input
                type="date"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
                required
              />
            </label>

            <label>
              Laba
              <input
                type="number"
                min="0"
                value={totalProfit}
                onChange={(event) => setTotalProfit(Number(event.target.value))}
                required
              />
            </label>

            <label>
              Catatan
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Contoh: Penjualan harian toko"
              />
            </label>
          </div>

          <section className="sales-items-section">
            <div className="page-header">
              <div>
                <h2>Produk Terjual</h2>
                <p>Subtotal dihitung otomatis dari harga produk × jumlah.</p>
              </div>

              <button type="button" className="button secondary" onClick={addItem}>
                <Plus size={18} />
                Tambah Produk
              </button>
            </div>

            {loadingProducts ? (
              <p>Memuat produk...</p>
            ) : availableProducts.length === 0 ? (
              <p>Belum ada produk aktif dengan stok tersedia.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Harga</th>
                      <th>Stok</th>
                      <th>Jumlah</th>
                      <th>Subtotal</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {computedItems.map((item, index) => {
                      const product = item.product;

                      return (
                        <tr key={`${item.product_id}-${index}`}>
                          <td>
                            <select
                              value={item.product_id}
                              onChange={(event) =>
                                updateItem(index, {
                                  product_id: event.target.value,
                                  quantity: 1,
                                })
                              }
                              required
                            >
                              <option value="">Pilih produk</option>
                              {availableProducts.map((productOption) => (
                                <option key={productOption.id} value={productOption.id}>
                                  {productOption.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>{formatRupiah(item.unitPrice)}</td>
                          <td>{product?.stock ?? "-"}</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              max={product?.stock ?? undefined}
                              value={item.quantity}
                              onChange={(event) =>
                                updateItem(index, {
                                  quantity: Number(event.target.value),
                                })
                              }
                              required
                            />
                          </td>
                          <td>{formatRupiah(item.subtotal)}</td>
                          <td>
                            <button
                              type="button"
                              className="danger"
                              onClick={() => removeItem(index)}
                              disabled={items.length === 1}
                            >
                              <Trash2 size={15} />
                              Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="sales-total-card">
            <div>
              <span>Total Item</span>
              <strong>{totalQuantity}</strong>
            </div>
            <div>
              <span>Total Omzet</span>
              <strong>{formatRupiah(totalOmzet)}</strong>
            </div>
            <div>
              <span>Laba</span>
              <strong>{formatRupiah(totalProfit)}</strong>
            </div>
          </section>

          <button type="submit" disabled={saving || loadingProducts}>
            {saving ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </form>
      </div>
    </UmkmLayout>
  );
}
