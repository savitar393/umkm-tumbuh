import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { ImagePlus, Package, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProductStock,
  uploadProductThumbnail,
  type Product,
  type ProductPayload,
} from "../api";

const emptyForm: ProductPayload = {
  name: "",
  category_name: "",
  description: "",
  price: 0,
  initial_stock: 0,
  status: "AKTIF",
  legalitas: "",
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductPayload>(emptyForm);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const totalProducts = products.length;
  const totalStock = useMemo(
    () => products.reduce((sum, product) => sum + product.stock, 0),
    [products],
  );
  const activeProducts = products.filter((product) => product.status === "AKTIF").length;

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await getProducts({
        q: query.trim() || undefined,
        status: status === "ALL" ? undefined : status,
      });

      setProducts(response.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat produk.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField<K extends keyof ProductPayload>(field: K, value: ProductPayload[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await createProduct({
        ...form,
        price: Number(form.price),
        initial_stock: Number(form.initial_stock ?? 0),
      });

      setForm(emptyForm);
      setMessage("Produk berhasil ditambahkan.");
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan produk.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct(product: Product) {
    const confirmed = window.confirm(`Hapus produk "${product.name}"?`);
    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await deleteProduct(product.id);
      setMessage("Produk berhasil dihapus.");
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus produk.");
    }
  }

  async function handleStockUpdate(product: Product) {
    const quantity = Number(stockInputs[product.id] ?? 0);

    if (!quantity) {
      setError("Jumlah perubahan stok tidak boleh 0.");
      return;
    }

    setError("");
    setMessage("");

    try {
      await updateProductStock(product.id, {
        type: "RESTOCK",
        quantity,
        note: "Update stok dari halaman Kelola Produk",
      });

      setStockInputs((current) => ({
        ...current,
        [product.id]: "",
      }));

      setMessage("Stok berhasil diperbarui.");
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui stok.");
    }
  }

  async function handleThumbnailUpload(product: Product, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    try {
      await uploadProductThumbnail(product.id, file);
      setMessage("Thumbnail produk berhasil diunggah.");
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah thumbnail.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <UmkmLayout
      title="Kelola Produk"
      subtitle="Kelola daftar produk, stok, harga, dan thumbnail produk UMKM Anda."
    >
      <div className="feature-page">
        {message ? <div className="success-message">{message}</div> : null}
        {error ? <div className="error-message">{error}</div> : null}

        <section className="stat-cards-grid product-stat-grid">
          <article className="stat-card stat-card--blue">
            <div className="stat-card__icon-wrap">
              <Package size={24} />
            </div>
            <div>
              <div className="stat-card__label">Total Produk</div>
              <div className="stat-card__value">{totalProducts}</div>
              <div className="stat-card__sub">Produk terdaftar</div>
            </div>
          </article>

          <article className="stat-card stat-card--green">
            <div className="stat-card__icon-wrap">
              <Package size={24} />
            </div>
            <div>
              <div className="stat-card__label">Produk Aktif</div>
              <div className="stat-card__value">{activeProducts}</div>
              <div className="stat-card__sub">Siap dijual</div>
            </div>
          </article>

          <article className="stat-card stat-card--orange">
            <div className="stat-card__icon-wrap">
              <Package size={24} />
            </div>
            <div>
              <div className="stat-card__label">Total Stok</div>
              <div className="stat-card__value">{totalStock}</div>
              <div className="stat-card__sub">Unit tersedia</div>
            </div>
          </article>
        </section>

        <section className="dashboard-card wide product-form-card">
          <div className="page-header">
            <div>
              <h2>Tambah Produk</h2>
              <p>Produk yang ditambahkan di sini akan digunakan pada catatan transaksi.</p>
            </div>
          </div>

          <form className="product-form-grid" onSubmit={handleCreateProduct}>
            <label>
              Nama Produk
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </label>

            <label>
              Kategori
              <input
                value={form.category_name}
                onChange={(event) => updateField("category_name", event.target.value)}
                placeholder="Contoh: Minuman"
                required
              />
            </label>

            <label>
              Harga
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(event) => updateField("price", Number(event.target.value))}
                required
              />
            </label>

            <label>
              Stok Awal
              <input
                type="number"
                min="0"
                value={form.initial_stock ?? 0}
                onChange={(event) => updateField("initial_stock", Number(event.target.value))}
              />
            </label>

            <label>
              Legalitas
              <input
                value={form.legalitas ?? ""}
                onChange={(event) => updateField("legalitas", event.target.value)}
                placeholder="Contoh: PIRT, Halal"
              />
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
              >
                <option value="AKTIF">AKTIF</option>
                <option value="DRAFT">DRAFT</option>
                <option value="NONAKTIF">NONAKTIF</option>
              </select>
            </label>

            <label className="product-form-wide">
              Deskripsi
              <input
                value={form.description ?? ""}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Deskripsi singkat produk"
              />
            </label>

            <button type="submit" disabled={saving}>
              <Plus size={18} />
              {saving ? "Menyimpan..." : "Tambah Produk"}
            </button>
          </form>
        </section>

        <section className="dashboard-card wide">
          <div className="page-header">
            <div>
              <h2>Daftar Produk</h2>
              <p>Gunakan filter untuk mencari produk berdasarkan nama atau status.</p>
            </div>
          </div>

          <div className="dashboard-filter-bar">
            <div className="filter-group">
              <span className="filter-label">Cari Produk</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nama produk..."
              />
            </div>

            <div className="filter-group">
              <span className="filter-label">Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="ALL">Semua</option>
                <option value="AKTIF">Aktif</option>
                <option value="DRAFT">Draft</option>
                <option value="NONAKTIF">Nonaktif</option>
              </select>
            </div>

            <div className="filter-group filter-group--btn">
              <button type="button" onClick={loadProducts}>
                <Search size={16} />
                Filter
              </button>
            </div>
          </div>

          {loading ? (
            <p>Memuat produk...</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Kategori</th>
                    <th>Harga</th>
                    <th>Stok</th>
                    <th>Status</th>
                    <th>Thumbnail</th>
                    <th>Update Stok</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={8}>Belum ada produk.</td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <strong>{product.name}</strong>
                          <br />
                          <span>{product.description ?? "-"}</span>
                        </td>
                        <td>{product.category_name}</td>
                        <td>{formatRupiah(product.price)}</td>
                        <td>{product.stock}</td>
                        <td>{product.status}</td>
                        <td>
                          <label className="thumbnail-upload-btn">
                            <ImagePlus size={16} />
                            Upload
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={(event) => handleThumbnailUpload(product, event)}
                              hidden
                            />
                          </label>
                          {product.thumbnail_url ? (
                            <div className="table-muted">Sudah ada thumbnail</div>
                          ) : (
                            <div className="table-muted">Belum ada</div>
                          )}
                        </td>
                        <td>
                          <div className="stock-update-row">
                            <input
                              type="number"
                              value={stockInputs[product.id] ?? ""}
                              onChange={(event) =>
                                setStockInputs((current) => ({
                                  ...current,
                                  [product.id]: event.target.value,
                                }))
                              }
                              placeholder="+10"
                            />
                            <button type="button" onClick={() => handleStockUpdate(product)}>
                              <RefreshCw size={15} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <Trash2 size={15} />
                            Hapus
                          </button>
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
