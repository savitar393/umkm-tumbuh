import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Boxes,
  ImagePlus,
  Package,
  PackageCheck,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import logoPlaceholder from "../../../assets/logo-umkm-tumbuh.png";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  updateProductStock,
  uploadProductThumbnail,
  type Product,
  type ProductPayload,
  type UpdateProductPayload,
} from "../api";

type ProductStatus = "AKTIF" | "NONAKTIF";

type ProductFormState = {
  name: string;
  category_name: string;
  description: string;
  price: string;
  initial_stock: string;
  status: ProductStatus;
  legalitas: string;
  thumbnailFile: File | null;
};

const emptyForm: ProductFormState = {
  name: "",
  category_name: "",
  description: "",
  price: "0",
  initial_stock: "0",
  status: "AKTIF",
  legalitas: "",
  thumbnailFile: null,
};

const MOCK_PRODUCTS: Product[] = [
  {
    id: "mock-1",
    umkm_id: "mock",
    category_id: "cat-1",
    category_name: "Minuman",
    name: "Kopi Arabika Gayo",
    price: 35000,
    stock: 120,
    status: "AKTIF",
    description: "Kopi arabika premium dari Aceh Tengah",
    legalitas: "PIRT",
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
  },
  {
    id: "mock-2",
    umkm_id: "mock",
    category_id: "cat-2",
    category_name: "Makanan",
    name: "Keripik Pisang Lumer",
    price: 15000,
    stock: 200,
    status: "AKTIF",
    description: "Keripik pisang dengan varian coklat dan keju",
    legalitas: "PIRT, Halal",
    created_at: "2026-02-10T00:00:00Z",
    updated_at: "2026-02-10T00:00:00Z",
  },
  {
    id: "mock-3",
    umkm_id: "mock",
    category_id: "cat-3",
    category_name: "Kerajinan",
    name: "Tas Anyaman Rotan",
    price: 85000,
    stock: 45,
    status: "AKTIF",
    description: "Tas anyaman rotan buatan tangan pengrajin lokal",
    legalitas: "",
    created_at: "2026-03-05T00:00:00Z",
    updated_at: "2026-03-05T00:00:00Z",
  },
  {
    id: "mock-4",
    umkm_id: "mock",
    category_id: "cat-1",
    category_name: "Minuman",
    name: "Wedang Uwuh",
    price: 12000,
    stock: 0,
    status: "NONAKTIF",
    description: "Minuman rempah tradisional khas Yogyakarta",
    legalitas: "PIRT",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
  },
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function validateThumbnail(file: File | null) {
  if (!file) return "";

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return "Thumbnail harus berupa JPG, PNG, atau WebP.";
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return "Ukuran thumbnail maksimal 5 MB.";
  }

  return "";
}

function normalizeStatus(status: string): ProductStatus {
  return status === "AKTIF" ? "AKTIF" : "NONAKTIF";
}

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("updated_desc");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [useMock, setUseMock] = useState(false);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [thumbnailPreview, setThumbnailPreview] = useState("");

  const [stockTarget, setStockTarget] = useState<Product | null>(null);
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockNote, setStockNote] = useState("Restock dari halaman Kelola Produk");

  const totalProducts = products.length;
  const totalStock = useMemo(
    () => products.reduce((sum, product) => sum + product.stock, 0),
    [products],
  );
  const activeProducts = products.filter((product) => product.status === "AKTIF").length;

  const categories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((product) => {
      if (product.category_name) unique.add(product.category_name);
    });

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      if (category !== "ALL" && product.category_name !== category) {
        return false;
      }

      return true;
    });

    return result.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "price_desc":
          return b.price - a.price;
        case "price_asc":
          return a.price - b.price;
        case "stock_desc":
          return b.stock - a.stock;
        case "stock_asc":
          return a.stock - b.stock;
        case "updated_desc":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  }, [category, products, sortBy]);

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await getProducts({
        q: query.trim() || undefined,
        status: status === "ALL" ? undefined : status,
      });

      setProducts(response.products);
      setUseMock(false);
    } catch (err) {
      setUseMock(true);
      setError(err instanceof Error ? err.message : "Gagal memuat produk.");
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetProductForm() {
    setForm(emptyForm);
    setEditingProduct(null);
    setThumbnailPreview("");
  }

  function openCreateModal() {
    resetProductForm();
    setMessage("");
    setError("");
    setIsProductModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category_name: product.category_name,
      description: product.description ?? "",
      price: String(product.price),
      initial_stock: String(product.stock),
      status: normalizeStatus(product.status),
      legalitas: product.legalitas ?? product.legality ?? "",
      thumbnailFile: null,
    });
    setThumbnailPreview(product.thumbnail_url ?? "");
    setMessage("");
    setError("");
    setIsProductModalOpen(true);
  }

  function closeProductModal() {
    if (saving) return;
    setIsProductModalOpen(false);
    resetProductForm();
  }

  function updateField<K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleThumbnailSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const validationError = validateThumbnail(file);

    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    updateField("thumbnailFile", file);

    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
    }
  }

  function validateProductForm() {
    if (!form.name.trim()) {
      return "Nama produk wajib diisi.";
    }

    if (!form.category_name.trim()) {
      return "Kategori produk wajib diisi.";
    }

    const price = Number(form.price || 0);
    if (!Number.isInteger(price) || price <= 0) {
      return "Harga produk harus berupa angka lebih dari 0.";
    }

    const initialStock = Number(form.initial_stock || 0);
    if (!Number.isInteger(initialStock) || initialStock < 0) {
      return "Stok awal harus berupa angka bulat minimal 0.";
    }

    return validateThumbnail(form.thumbnailFile);
  }

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateProductForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const basePayload: UpdateProductPayload = {
      name: form.name.trim(),
      category_name: form.category_name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price || 0),
      status: form.status,
      legalitas: form.legalitas.trim() || undefined,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, basePayload);

        if (form.thumbnailFile) {
          await uploadProductThumbnail(editingProduct.id, form.thumbnailFile);
        }

        setMessage("Produk berhasil diperbarui.");
      } else {
        const createPayload: ProductPayload = {
          ...basePayload,
          initial_stock: Number(form.initial_stock || 0),
        };

        const response = await createProduct(createPayload);

        if (form.thumbnailFile) {
          await uploadProductThumbnail(response.product.id, form.thumbnailFile);
        }

        setMessage("Produk berhasil ditambahkan.");
      }

      closeProductModal();
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan produk.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleProductStatus(product: Product) {
    const nextStatus: ProductStatus = product.status === "AKTIF" ? "NONAKTIF" : "AKTIF";
    const actionLabel = nextStatus === "AKTIF" ? "aktifkan" : "nonaktifkan";

    const confirmed = window.confirm(
      `Yakin ingin ${actionLabel} produk "${product.name}"?`,
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await updateProduct(product.id, {
        name: product.name,
        category_name: product.category_name,
        description: product.description ?? undefined,
        price: product.price,
        status: nextStatus,
        legalitas: product.legalitas ?? product.legality ?? undefined,
      });

      setMessage(
        nextStatus === "AKTIF"
          ? "Produk berhasil diaktifkan."
          : "Produk berhasil dinonaktifkan. Produk tidak akan muncul pada input laporan baru.",
      );

      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status produk.");
    }
  }

  async function handleDeleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Hapus permanen produk "${product.name}"?\n\nAksi ini hanya disarankan untuk produk yang belum pernah dipakai pada laporan penjualan. Jika ragu, gunakan status NONAKTIF.`,
    );

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

  function openStockModal(product: Product) {
    setStockTarget(product);
    setStockQuantity("");
    setStockNote("Restock dari halaman Kelola Produk");
    setError("");
    setMessage("");
  }

  function closeStockModal() {
    setStockTarget(null);
    setStockQuantity("");
    setStockNote("Restock dari halaman Kelola Produk");
  }

  async function handleStockUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!stockTarget) return;

    const quantity = Number(stockQuantity || 0);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Jumlah restock harus berupa angka bulat lebih dari 0.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateProductStock(stockTarget.id, {
        type: "RESTOCK",
        quantity,
        note: stockNote.trim() || "Restock dari halaman Kelola Produk",
      });

      setMessage("Stok berhasil diperbarui.");
      closeStockModal();
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui stok.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <UmkmLayout
      title="Kelola Produk"
      subtitle="Manajemen stok dan katalog produk UMKM Anda."
    >
      <div className="feature-page product-catalog-page">
        {message ? <div className="success-message">{message}</div> : null}
        {error ? <div className="error-message">{error}</div> : null}
        {useMock ? (
          <div
            className="error-message"
            style={{ background: "#fff3cd", color: "#856404", border: "1px solid #ffeeba" }}
          >
            Mode offline — menampilkan data contoh. Backend tidak terhubung.
          </div>
        ) : null}

        <section className="product-catalog-header">
          <div>
            <p className="sales-report-kicker">Inventori UMKM</p>
            <h1>Kelola Produk</h1>
            <p>Kelola produk yang akan muncul pada laporan penjualan harian.</p>
          </div>

          <button type="button" onClick={openCreateModal}>
            <Plus size={18} />
            Tambah Produk
          </button>
        </section>

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
              <PackageCheck size={24} />
            </div>
            <div>
              <div className="stat-card__label">Produk Aktif</div>
              <div className="stat-card__value">{activeProducts}</div>
              <div className="stat-card__sub">Siap dijual</div>
            </div>
          </article>

          <article className="stat-card stat-card--orange">
            <div className="stat-card__icon-wrap">
              <Boxes size={24} />
            </div>
            <div>
              <div className="stat-card__label">Total Stok</div>
              <div className="stat-card__value">{totalStock}</div>
              <div className="stat-card__sub">Unit tersedia</div>
            </div>
          </article>
        </section>

        <section className="product-catalog-toolbar">
          <div className="product-filter-grid">
            <label>
              Cari Produk
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nama produk..."
              />
            </label>

            <label>
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="ALL">Semua</option>
                <option value="AKTIF">Aktif</option>
                <option value="NONAKTIF">Nonaktif</option>
              </select>
            </label>

            <label>
              Kategori
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="ALL">Semua kategori</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Urutkan
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="updated_desc">Terakhir diperbarui</option>
                <option value="name_asc">Nama A-Z</option>
                <option value="price_desc">Harga tertinggi</option>
                <option value="price_asc">Harga terendah</option>
                <option value="stock_desc">Stok terbanyak</option>
                <option value="stock_asc">Stok tersedikit</option>
              </select>
            </label>

            <button type="button" onClick={loadProducts}>
              <Search size={16} />
              Filter
            </button>
          </div>
        </section>

        <section className="product-catalog-section">
          <div className="product-catalog-section__header">
            <div>
              <h2>Daftar Produk</h2>
              <p>{filteredProducts.length} produk dalam tampilan saat ini.</p>
            </div>
          </div>

          {loading ? (
            <p>Memuat produk...</p>
          ) : filteredProducts.length === 0 ? (
            <div className="product-empty-state">
              <Package size={34} />
              <strong>Belum ada produk</strong>
              <span>Tambahkan produk pertama agar bisa digunakan pada laporan penjualan.</span>
              <button type="button" onClick={openCreateModal}>
                <Plus size={18} />
                Tambah Produk
              </button>
            </div>
          ) : (
            <div className="product-card-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-card__image">
                    {product.thumbnail_url ? (
                      <img
                        className="product-card__photo"
                        src={product.thumbnail_url}
                        alt={product.name}
                      />
                    ) : (
                      <div className="product-card__placeholder">
                        <img src={logoPlaceholder} alt="" aria-hidden="true" />
                        <span>Belum ada foto</span>
                      </div>
                    )}
                    <span className={`product-status-badge ${product.status === "AKTIF" ? "active" : "inactive"}`}>
                      {product.status === "AKTIF" ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  <div className="product-card__body">
                    <span className="product-card__category">
                      Kategori: {product.category_name || "-"}
                    </span>
                    <h3>{product.name}</h3>
                    <strong>{formatRupiah(product.price)}</strong>
                    <p>{product.description || "Belum ada deskripsi produk."}</p>

                    <div className="product-card__meta">
                      <span>Stok: {product.stock}</span>
                      <span>Diperbarui: {formatDate(product.updated_at)}</span>
                    </div>

                    {product.legalitas ? (
                      <div className="product-card__legalitas-list">
                        {product.legalitas
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean)
                          .map((item) => (
                            <span className="product-card__legalitas" key={item}>
                              {item}
                            </span>
                          ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="product-card__actions">
                    <button type="button" className="button secondary" onClick={() => openEditModal(product)}>
                      <Pencil size={16} />
                      Edit
                    </button>
                    <button type="button" className="button secondary" onClick={() => openStockModal(product)}>
                      <RefreshCw size={16} />
                      Restock
                    </button>
                    <button
                      type="button"
                      className={`button secondary product-status-action ${
                        product.status === "AKTIF" ? "warn" : "success"
                      }`}
                      onClick={() => handleToggleProductStatus(product)}
                    >
                      {product.status === "AKTIF" ? (
                        <>
                          <Power size={16} />
                          Nonaktifkan
                        </>
                      ) : (
                        <>
                          <PackageCheck size={16} />
                          Aktifkan
                        </>
                      )}
                    </button>
                    {product.status !== "AKTIF" ? (
                      <button
                        type="button"
                        className="danger product-delete-button"
                        onClick={() => handleDeleteProduct(product)}
                      >
                        <Trash2 size={16} />
                        Hapus permanen
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {isProductModalOpen ? (
          <div className="product-modal-backdrop" role="dialog" aria-modal="true">
            <form className="product-modal" onSubmit={handleSaveProduct}>
              <div className="product-modal__header">
                <div>
                  <h2>{editingProduct ? "Edit Produk" : "Tambah Produk Baru"}</h2>
                  <p>
                    {editingProduct
                      ? "Perbarui informasi produk yang tampil di katalog UMKM."
                      : "Lengkapi informasi produk sebelum digunakan pada laporan penjualan."}
                  </p>
                </div>
                <button type="button" className="product-modal__close" onClick={closeProductModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="product-modal__content">
                <div className="product-modal__image-panel">
                  <label className="product-image-dropzone">
                    {thumbnailPreview ? (
                      <img src={thumbnailPreview} alt="Preview produk" />
                    ) : (
                      <span>
                        <ImagePlus size={34} />
                        Unggah Foto Produk
                      </span>
                    )}

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleThumbnailSelect}
                      hidden
                    />
                  </label>

                  <small>Format JPG, PNG, atau WebP. Maksimal 5 MB.</small>
                </div>

                <div className="product-modal__fields">
                  <label>
                    Nama Produk
                    <input
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder="Contoh: Es Kopi Gula Aren"
                    />
                  </label>

                  <label>
                    Kategori
                    <input
                      list="product-category-options"
                      value={form.category_name}
                      onChange={(event) => updateField("category_name", event.target.value)}
                      placeholder="Contoh: Minuman"
                    />
                    <datalist id="product-category-options">
                      {categories.map((item) => (
                        <option key={item} value={item} />
                      ))}
                    </datalist>
                  </label>

                  <label>
                    Harga Jual (Rp)
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.price}
                      onChange={(event) => updateField("price", onlyDigits(event.target.value))}
                      placeholder="0"
                    />
                  </label>

                  {!editingProduct ? (
                    <label>
                      Stok Awal
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.initial_stock}
                        onChange={(event) =>
                          updateField("initial_stock", onlyDigits(event.target.value))
                        }
                        placeholder="0"
                      />
                    </label>
                  ) : (
                    <label>
                      Stok Saat Ini
                      <input value={editingProduct.stock} readOnly />
                    </label>
                  )}

                  <label>
                    Status
                    <select
                      value={form.status}
                      onChange={(event) => updateField("status", event.target.value as ProductStatus)}
                    >
                      <option value="AKTIF">Aktif</option>
                      <option value="NONAKTIF">Nonaktif</option>
                    </select>
                  </label>

                  <label>
                    Legalitas
                    <input
                      value={form.legalitas}
                      onChange={(event) => updateField("legalitas", event.target.value)}
                      placeholder="Contoh: PIRT, Halal"
                    />
                  </label>

                  <label className="product-modal__wide">
                    Deskripsi
                    <textarea
                      value={form.description}
                      onChange={(event) => updateField("description", event.target.value)}
                      placeholder="Deskripsi singkat produk"
                    />
                  </label>
                </div>
              </div>

              <div className="product-modal__notice">
                <Archive size={18} />
                <div>
                  <strong>Status Nonaktif lebih aman daripada hapus.</strong>
                  <span>
                    Produk nonaktif tidak digunakan pada laporan baru, tetapi riwayat laporan lama tetap aman.
                  </span>
                </div>
              </div>

              <div className="product-modal__footer">
                <button type="button" className="button secondary" onClick={closeProductModal}>
                  Batal
                </button>
                <button type="submit" disabled={saving}>
                  <Save size={18} />
                  {saving ? "Menyimpan..." : editingProduct ? "Simpan Perubahan" : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {stockTarget ? (
          <div className="product-modal-backdrop" role="dialog" aria-modal="true">
            <form className="product-stock-modal" onSubmit={handleStockUpdate}>
              <div className="product-modal__header">
                <div>
                  <h2>Restock Produk</h2>
                  <p>{stockTarget.name}</p>
                </div>
                <button type="button" className="product-modal__close" onClick={closeStockModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="product-stock-summary">
                <span>Stok saat ini</span>
                <strong>{stockTarget.stock}</strong>
              </div>

              <label>
                Jumlah Stok Masuk
                <input
                  type="text"
                  inputMode="numeric"
                  value={stockQuantity}
                  onChange={(event) => setStockQuantity(onlyDigits(event.target.value))}
                  placeholder="Contoh: 10"
                />
              </label>

              <label>
                Catatan
                <input
                  value={stockNote}
                  onChange={(event) => setStockNote(event.target.value)}
                  placeholder="Catatan update stok"
                />
              </label>

              <div className="product-modal__footer">
                <button type="button" className="button secondary" onClick={closeStockModal}>
                  Batal
                </button>
                <button type="submit" disabled={saving}>
                  <Upload size={18} />
                  {saving ? "Menyimpan..." : "Simpan Restock"}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </UmkmLayout>
  );
}
