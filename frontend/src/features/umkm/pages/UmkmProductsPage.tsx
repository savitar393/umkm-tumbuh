import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductThumbnail,
} from "../api";
import type { Product, ProductPayload } from "../api";
import logoImg from "../../../assets/logo-umkm-tumbuh.png";
import "./umkm-profile.css";
import "./umkm-profile-products.css";

type CurrentUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

function getCurrentUser(): CurrentUser | null {
  const raw = localStorage.getItem("current_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export default function UmkmProductsPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const [form, setForm] = useState<ProductPayload>({
    name: "",
    category: "",
    price: 0,
    stock: 0,
  });

  const [submitting, setSubmitting] = useState(false);

  function fetchProducts() {
    setLoading(true);
    getProducts()
      .then((res) => setProducts(res.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    navigate("/login");
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  function openCreateModal() {
    setEditingId(null);
    setForm({ name: "", category: "", price: 0, stock: 0 });
    setThumbnailFile(null);
    setThumbnailPreview("");
    setShowModal(true);
  }

  function openEditModal(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category || "",
      price: p.price,
      stock: p.stock,
      status: p.status || "AKTIF",
    });
    setThumbnailFile(null);
    setThumbnailPreview(p.thumbnail_url || p.image_url || "");
    setShowModal(true);
  }

  function handleThumbnailSelect(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar JPG, PNG, atau WebP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran thumbnail maksimal 2MB.");
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      let savedProduct: Product;

      if (editingId) {
        const response = await updateProduct(editingId, form);
        savedProduct = response.product;
      } else {
        const response = await createProduct(form);
        savedProduct = response.product;
      }

      if (thumbnailFile) {
        setUploadingThumbnail(true);
        const thumbnailResponse = await uploadProductThumbnail(savedProduct.id, thumbnailFile);
        savedProduct = thumbnailResponse.product;
        setUploadingThumbnail(false);
      }

      setShowModal(false);
      setThumbnailFile(null);
      setThumbnailPreview("");
      fetchProducts();
    } catch (err) {
      setUploadingThumbnail(false);
      alert(err instanceof Error ? err.message : "Gagal menyimpan produk");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    try {
      await deleteProduct(id);
      fetchProducts();
    } catch (err) {
      alert("Gagal menghapus produk");
    }
  }

  if (loading) {
    return (
      <div className="up-page">
        <aside className="up-sidebar">
          <div className="up-sidebar-logo">
            <img src={logoImg} alt="logo" className="up-sidebar-logo-img" />
            <span className="up-sidebar-logo-text">UMKM Tumbuh</span>
          </div>
        </aside>
        <div className="up-right">
          <div style={{ padding: 40, color: "#6b7280", fontSize: 14 }}>Memuat produk...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="up-page">
      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="up-sidebar">
        <div className="up-sidebar-logo">
          <img src={logoImg} alt="logo" className="up-sidebar-logo-img" />
          <span className="up-sidebar-logo-text">UMKM Tumbuh</span>
        </div>
        <nav className="up-nav">
          <button className="up-nav-item">
            <span className="up-nav-icon">📚</span> Pelatihan Saya
          </button>
          <button className="up-nav-item active">
            <span className="up-nav-icon">🏢</span> Kelola Informasi
          </button>
          <button className="up-nav-item">
            <span className="up-nav-icon">📊</span> Dashboard
          </button>
          <button className="up-nav-item">
            <span className="up-nav-icon">🤝</span> Pengajuan Kemitraan
          </button>
          <button className="up-nav-item">
            <span className="up-nav-icon">⚙️</span> Pengaturan
          </button>
        </nav>
        <div style={{ padding: "0 12px 20px" }}>
          <button className="up-nav-logout" onClick={logout}>
            <span>🚪</span> Keluar
          </button>
        </div>
      </aside>

      {/* ── RIGHT AREA ──────────────────────────────────────── */}
      <div className="up-right">
        {/* Header */}
        <header className="up-header">
          <div className="up-header-search">
            <span className="up-header-search-icon">🔍</span>
            <input placeholder="Cari mitra/ketik disini..." />
          </div>
          <div className="up-header-right">
            <button className="up-header-bell" type="button">🔔</button>
            <div className="up-header-user">
              <div className="up-header-user-info">
                <span className="up-header-user-name">{user?.full_name || "UMKM"}</span>
                <span className="up-header-user-role">Pemilik UMKM</span>
              </div>
              <div className="up-header-avatar">{initials}</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="up-view-content" style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button 
                type="button" 
                onClick={() => navigate("/umkm/profile/view")}
                style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}
              >
                <span>←</span> Kembali
              </button>
              <div>
                <h1 className="up-biz-name" style={{ marginBottom: 4 }}>Kelola Produk</h1>
                <p className="up-biz-desc">Manajemen stok dan katalog produk UMKM Anda</p>
              </div>
            </div>
            <button className="up-footer-save" onClick={openCreateModal} style={{ padding: "10px 20px" }}>
              + Tambah Produk
            </button>
          </div>

          <div className="up-card" style={{ marginBottom: 24, padding: "20px 24px", maxWidth: 200 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 8, letterSpacing: 0.5 }}>TOTAL PRODUK</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: "#1e3a8a" }}>{products.length}</p>
          </div>

          <div className="up-products-grid">
            {products.map(p => (
              <div key={p.id} className="up-product-card">
                <div className="up-product-image">
                  {p.thumbnail_url || p.image_url ? (
                    <img
                      src={p.thumbnail_url || p.image_url}
                      alt={p.name}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        event.currentTarget.parentElement?.classList.add("up-product-image--fallback");
                      }}
                    />
                  ) : (
                    <div className="up-product-image-placeholder">TU</div>
                  )}
                </div>
                <div className="up-product-info">
                  <p className="up-product-cat">KATEGORI: {p.category?.toUpperCase() || "UMUM"}</p>
                  <p className="up-product-name">{p.name}</p>
                  <p className="up-product-price">Rp {p.price.toLocaleString("id-ID")}</p>
                  <div className="up-product-actions">
                    <button type="button" onClick={() => openEditModal(p)}>📝</button>
                    <button type="button" onClick={() => handleDelete(p.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}

            <div className="up-product-add-card" onClick={openCreateModal}>
              <div className="up-add-circle">+</div>
              <p className="up-add-title">Tambah Produk Baru</p>
              <p className="up-add-desc">Unggah foto dan detail produk</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────── */}
      {showModal && (
        <div className="up-modal-overlay">
          <div className="up-modal">
            <button className="up-modal-close" onClick={() => setShowModal(false)}>×</button>
            <h2 className="up-modal-title">{editingId ? "Edit Produk" : "Tambah Produk Baru"}</h2>
            <p className="up-modal-desc">Silakan lengkapi informasi produk di bawah ini untuk menambahkan ke inventaris.</p>

            <form onSubmit={handleSubmit} className="up-modal-form">
              <div className="up-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="up-form-group">
                  <label className="up-form-label">NAMA PRODUK</label>
                  <input
                    required
                    className="up-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: Es Kopi Gula Aren"
                  />
                </div>
                <div className="up-form-group">
                  <label className="up-form-label">KATEGORI</label>
                  <select
                    className="up-select"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Snack">Snack</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="up-form-group full">
                  <label className="up-form-label">HARGA JUAL (RP)</label>
                  <div className="up-price-input">
                    <span className="up-price-prefix">Rp</span>
                    <input
                      type="number"
                      required
                      className="up-input"
                      value={form.price || ""}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      placeholder="0"
                      style={{ paddingLeft: 40 }}
                    />
                  </div>
                </div>
                
                <div className="up-form-group full">
                  <label className="up-form-label">FOTO PRODUK</label>
                  <label className="up-foto-upload" style={{ height: 120, display: "block", cursor: "pointer" }}>
                    <div className="up-foto-upload-overlay" style={{ opacity: 1, position: 'relative', background: '#f9fafb', border: '1px dashed #cbd5e1', height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                      {thumbnailPreview ? (
                        <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 8 }}>
                          <img
                            src={thumbnailPreview}
                            alt="Preview"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      ) : (
                        <>
                          <span className="up-foto-upload-icon" style={{ color: '#3b82f6', marginBottom: 8 }}>🖼️</span>
                          <span className="up-foto-upload-text" style={{ color: '#0f172a', fontWeight: 600 }}>Unggah Foto Produk</span>
                          <span style={{ fontSize: 11, color: "#64748b" }}>
                            Klik untuk memilih gambar
                          </span>
                          <span style={{ fontSize: 9, color: "#94a3b8", marginTop: 4 }}>MAKS. 5MB (JPG, PNG)</span>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        handleThumbnailSelect(e.target.files?.[0] ?? null);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 8, padding: 12, marginTop: 24, display: 'flex', gap: 12 }}>
                <span style={{color: '#d97706'}}>ℹ️</span>
                <div>
                  <p style={{fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 2}}>Tips Optimasi Produk</p>
                  <p style={{fontSize: 11, color: '#b45309'}}>Pastikan nama produk jelas dan foto memiliki pencahayaan yang baik untuk meningkatkan daya tarik pelanggan di aplikasi POS.</p>
                </div>
              </div>

              <div className="up-modal-footer">
                <button type="button" className="up-footer-cancel" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="up-footer-save" disabled={submitting}>
                  {submitting || uploadingThumbnail
                    ? uploadingThumbnail
                      ? "Mengunggah foto..."
                      : "Menyimpan..."
                    : "✨ Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
