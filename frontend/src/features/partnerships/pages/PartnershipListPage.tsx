import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { partnershipsApi } from "../api";

// ─── Logo Components ──────────────────────────────────────────────────────────

const LogoUMKMTumbuh: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#F5A623" />
    <path d="M8 28 L14 16 L20 22 L26 12 L32 28 Z" fill="#1A3A6B" strokeLinejoin="round" />
    <circle cx="26" cy="12" r="3" fill="#1A3A6B" />
  </svg>
);

const LogoKementrian: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="17" stroke="white" strokeWidth="1.5" fill="none" />
    <path d="M18 6 L20 13 L27 13 L21.5 17.5 L23.5 24.5 L18 20 L12.5 24.5 L14.5 17.5 L9 13 L16 13 Z" fill="white" />
    <text x="18" y="32" textAnchor="middle" fill="white" fontSize="5" fontFamily="serif" fontWeight="bold">KEMENKOP</text>
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface MitraProfile {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  totalPartnership: number;
  successRate: number;
  imageInitials: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_MITRA_LIST: MitraProfile[] = [
  {
    id: "1",
    name: "Bank Mandiri UMKM",
    category: "Perbankan",
    description: "Solusi permodalan KUR dan Kredit Usaha Mikro dengan bunga kompetitif serta pendampingan bisnis untuk UMKM naik kelas.",
    location: "Jakarta",
    totalPartnership: 5000,
    successRate: 92,
    imageInitials: "BM",
  },
  {
    id: "2",
    name: "Nusantara Ventures",
    category: "Ventura Capital",
    description: "Modal ventura yang fokus pada pendanaan tahap awal untuk UMKM kreatif dan inovatif di Indonesia.",
    location: "Surabaya",
    totalPartnership: 120,
    successRate: 85,
    imageInitials: "NV",
  },
  {
    id: "3",
    name: "Bank CIMB Niaga",
    category: "Perbankan",
    description: "Solusi perbankan lengkap dengan produk KUR, pembiayaan modal kerja, dan layanan ekspor impor untuk UMKM.",
    location: "Jakarta",
    totalPartnership: 3500,
    successRate: 88,
    imageInitials: "CN",
  },
  {
    id: "4",
    name: "PT Jaya Wijaya",
    category: "Distribusi",
    description: "Mitra distribusi nasional yang fokus pada pendanaan tahap awal untuk UMKM kreatif dan inovatif di Indonesia.",
    location: "Surabaya",
    totalPartnership: 250,
    successRate: 78,
    imageInitials: "JW",
  },
  {
    id: "5",
    name: "JNE International",
    category: "Logistik",
    description: "Mitra pengiriman ekspor terpercaya dengan tarif khusus bagi pelaku UMKM yang ingin go international.",
    location: "Jakarta",
    totalPartnership: 10000,
    successRate: 95,
    imageInitials: "JI",
  },
  {
    id: "6",
    name: "Pusat Kreatif Nusantara",
    category: "Inkubator",
    description: "Program inkubasi 6 bulan yang membekali pengrajin dengan skills digital marketing dan ekspor.",
    location: "Bandung",
    totalPartnership: 89,
    successRate: 82,
    imageInitials: "PK",
  },
  {
    id: "7",
    name: "Tokopedia",
    category: "E-commerce",
    description: "Platform marketplace terbesar di Indonesia dengan program khusus untuk onboarding UMKM naik kelas.",
    location: "Jakarta",
    totalPartnership: 12000,
    successRate: 90,
    imageInitials: "TK",
  },
  {
    id: "8",
    name: "Shopee Indonesia",
    category: "E-commerce",
    description: "Platform belanja online dengan fitur Shopee UMKM Campus dan akses pasar ekspor.",
    location: "Jakarta",
    totalPartnership: 15000,
    successRate: 88,
    imageInitials: "SI",
  },
  {
    id: "9",
    name: "Gojek",
    category: "Teknologi",
    description: "Super app dengan program Gojek Wirausaha untuk membantu UMKM go digital.",
    location: "Jakarta",
    totalPartnership: 8000,
    successRate: 87,
    imageInitials: "GJ",
  },
];

// ─── Avatar Color Helper ──────────────────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: "#1A3A6B", text: "white" },
  { bg: "#1D9E75", text: "white" },
  { bg: "#F5A623", text: "#1A3A6B" },
  { bg: "#E24B4A", text: "white" },
  { bg: "#5F5E5A", text: "white" },
  { bg: "#2A5DA8", text: "white" },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PartnershipListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3 kolom x 3 baris

  // Categories
  const categories = [
    { id: "all", name: "Semua Mitra" },
    { id: "perbankan", name: "Perbankan" },
    { id: "ventura", name: "Ventura Capital" },
    { id: "logistik", name: "Logistik" },
    { id: "ecommerce", name: "E-commerce" },
    { id: "teknologi", name: "Teknologi" },
    { id: "distribusi", name: "Distribusi" },
    { id: "inkubator", name: "Inkubator" },
  ];

  // Filter mitra
  const filteredMitra = MOCK_MITRA_LIST.filter((mitra) => {
    const matchesSearch = mitra.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mitra.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mitra.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
                           mitra.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalItems = filteredMitra.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedMitra = filteredMitra.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLihatProfil = (mitraId: string) => {
    navigate(`/partnerships/${mitraId}`);
  };

  // Sidebar navigation items
  const navItems = [
    {
      label: "Monitoring Perkembangan Usaha",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      path: "/dashboard",
    },
    {
      label: "Pengajuan Kemitraan",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
      path: "/partnerships",
      active: true,
    },
    {
      label: "Kelola Informasi UMKM",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </svg>
      ),
      path: "/umkm",
    },
  ];

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      background: "#F5F4F0",
    }}>
      {/* ─── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 200,
        minWidth: 200,
        background: "#1A3A6B",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        zIndex: 100,
      }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoUMKMTumbuh size={36} />
            <span style={{ color: "#F5A623", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
              UMKM<br />Tumbuh
            </span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "20px 0" }}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                width: "100%",
                padding: "10px 20px",
                background: item.active ? "#F5A623" : "transparent",
                border: "none",
                borderRadius: item.active ? "0 20px 20px 0" : 0,
                color: item.active ? "#1A3A6B" : "rgba(255,255,255,0.75)",
                fontSize: 13,
                fontWeight: item.active ? 700 : 400,
                cursor: "pointer",
                textAlign: "left",
                lineHeight: 1.4,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <span style={{ marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "20px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              color: "#E24B4A",
              fontSize: 13,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Keluar
          </button>
        </div>
      </aside>

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      <main style={{
        marginLeft: 200,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}>
        {/* Top Bar */}
        <header style={{
          background: "white",
          borderBottom: "1px solid #E8E7E2",
          padding: "0 32px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ position: "relative", width: 340 }}>
            <svg
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#B4B2A9",
              }}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Cari Mitra..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: "100%",
                height: 40,
                paddingLeft: 42,
                borderRadius: 40,
                border: "none",
                background: "#F1F1F1",
                fontSize: 13,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button style={{
              background: "#1A3A6B",
              border: "none",
              borderRadius: 12,
              width: 44,
              height: 44,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1A7A5E" }}>
                  Nusantara Ventures
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "#888780" }}>MITRA</p>
              </div>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#1A3A6B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}>
                <LogoKementrian size={32} />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: "32px 40px" }}>
          {/* Page Title */}
          <h1 style={{
            margin: "0 0 8px",
            fontSize: 32,
            fontWeight: 700,
            color: "#1A3A6B",
          }}>
            Temukan Mitra Strategis
          </h1>
          <p style={{
            margin: "0 0 28px",
            fontSize: 14,
            color: "#888780",
          }}>
            Temukan mitra terbaik untuk mengembangkan usaha Anda
          </p>

          {/* Category Filters */}
          <div style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 32,
            borderBottom: "1px solid #E8E7E2",
            paddingBottom: 16,
          }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "6px 20px",
                  borderRadius: 30,
                  border: "none",
                  background: selectedCategory === cat.id ? "#1A3A6B" : "white",
                  color: selectedCategory === cat.id ? "white" : "#5F5E5A",
                  fontSize: 14,
                  fontWeight: selectedCategory === cat.id ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Mitra Cards Grid - 3 Columns */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}>
            {paginatedMitra.map((mitra) => {
              const avatarColor = getAvatarColor(mitra.name);
              
              return (
                <div
                  key={mitra.id}
                  onClick={() => handleLihatProfil(mitra.id)}
                  style={{
                    background: "white",
                    borderRadius: 20,
                    padding: "24px",
                    border: "1px solid #E8E7E2",
                    transition: "box-shadow 0.2s, transform 0.2s",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    minHeight: 320,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Avatar / Logo */}
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: avatarColor.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}>
                    <span style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: avatarColor.text,
                    }}>
                      {mitra.imageInitials}
                    </span>
                  </div>

                  {/* Company Name */}
                  <h3 style={{
                    margin: "0 0 8px",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#2C2C2A",
                  }}>
                    {mitra.name}
                  </h3>

                  {/* Category Badge */}
                  <div style={{
                    display: "inline-block",
                    background: "#F1EFE8",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#888780",
                    marginBottom: 16,
                    alignSelf: "flex-start",
                  }}>
                    {mitra.category}
                  </div>

                  {/* Location */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 12,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888780" strokeWidth="1.8">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span style={{ fontSize: 13, color: "#888780" }}>{mitra.location}</span>
                  </div>

                  {/* Description */}
                  <p style={{
                    margin: "0 0 20px",
                    fontSize: 13,
                    color: "#5F5E5A",
                    lineHeight: 1.5,
                    flex: 1,
                  }}>
                    {mitra.description.length > 120 
                      ? mitra.description.substring(0, 120) + "..." 
                      : mitra.description}
                  </p>

                  {/* Stats */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 20,
                    paddingTop: 12,
                    borderTop: "1px solid #F1EFE8",
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: "#B4B2A9" }}>Kemitraan</p>
                      <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700, color: "#1A3A6B" }}>
                        {mitra.totalPartnership.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: "#B4B2A9" }}>Tingkat Sukses</p>
                      <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700, color: "#1D9E75" }}>
                        {mitra.successRate}%
                      </p>
                    </div>
                  </div>

                  {/* Button - Lihat Profil */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLihatProfil(mitra.id);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 0",
                      background: "#1A3A6B",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "white",
                      cursor: "pointer",
                      transition: "background 0.15s, transform 0.1s",
                      marginTop: "auto",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#2A5DA8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#1A3A6B";
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = "scale(0.98)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    Lihat Profil
                  </button>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {paginatedMitra.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "80px 20px",
              background: "white",
              borderRadius: 20,
              border: "1px solid #E8E7E2",
            }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#B4B2A9" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="22" y1="22" x2="15" y2="15" />
              </svg>
              <p style={{ marginTop: 16, fontSize: 16, color: "#888780" }}>
                Tidak ada mitra yang ditemukan
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                style={{
                  marginTop: 16,
                  padding: "8px 24px",
                  background: "#1A3A6B",
                  border: "none",
                  borderRadius: 30,
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Reset Filter
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              marginTop: 40,
              paddingTop: 20,
              borderTop: "1px solid #E8E7E2",
            }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "1px solid #D3D1C7",
                  background: currentPage === 1 ? "#F5F4F0" : "white",
                  fontSize: 13,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                Sebelumnya
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: currentPage === i + 1 ? "none" : "1px solid #D3D1C7",
                    background: currentPage === i + 1 ? "#1A3A6B" : "white",
                    color: currentPage === i + 1 ? "white" : "#5F5E5A",
                    fontSize: 14,
                    fontWeight: currentPage === i + 1 ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "1px solid #D3D1C7",
                  background: currentPage === totalPages ? "#F5F4F0" : "white",
                  fontSize: 13,
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                Selanjutnya
              </button>
            </div>
          )}

          {/* Info Total */}
          {totalItems > 0 && (
            <p style={{
              textAlign: "center",
              marginTop: 24,
              fontSize: 13,
              color: "#888780",
            }}>
              Menampilkan {paginatedMitra.length} dari {totalItems} mitra strategis terdaftar
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default PartnershipListPage;