import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { partnershipsApi } from "../api";
import type { PartnershipRequest, PartnershipStatus } from "../types";

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

interface UMKMProfile {
  id: string;
  name: string;
  location: string;
  description: string;
  rating: number;
  reviewCount: number;
  category: string;
  image?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_UMKM_LIST: UMKMProfile[] = [
  {
    id: "1",
    name: "Wastra Kencana Solo",
    location: "Surakarta, Jawa Tengah",
    description: "Produksi kain batik tulis dan cap premium dengan pewarnaan alami.",
    rating: 4.2,
    reviewCount: 128,
    category: "Batik",
  },
  {
    id: "2",
    name: "Jepara Ukir Lestari",
    location: "Jepara, Jawa Tengah",
    description: "Mebel kayu jati kualitas ekspor dengan ukiran tangan asli. Jepara yang ...",
    rating: 4.3,
    reviewCount: 245,
    category: "Mebel",
  },
  {
    id: "3",
    name: "Tembikar Jatiwangi",
    location: "Majalengka, Jawa Barat",
    description: "Seni kerajinan tangan gerabah komersil yang menggabungkan teknik ...",
    rating: 4.2,
    reviewCount: 89,
    category: "Kerajinan",
  },
  {
    id: "4",
    name: "Mie Keprabon",
    location: "Solo, Jawa Tengah",
    description: "Mie instan homemade dengan bumbu rempah asli dan pilihan topping ...",
    rating: 4.5,
    reviewCount: 312,
    category: "Kuliner",
  },
  {
    id: "5",
    name: "Es Teh Sulthan",
    location: "Bandung, Jawa Barat",
    description: "Minuman teh kekinian dengan varian rasa premium dan harga terjangkau.",
    rating: 4.1,
    reviewCount: 156,
    category: "Kuliner",
  },
  {
    id: "6",
    name: "Little Blue Bakehouse",
    location: "Yogyakarta, DIY",
    description: "Roti dan pastry artisan dengan bahan organik tanpa pengawet.",
    rating: 4.7,
    reviewCount: 203,
    category: "Kuliner",
  },
];

// ─── Star Rating Component ────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {[...Array(5)].map((_, i) => (
        <span key={i} style={{ color: i < fullStars ? "#F5A623" : (i === fullStars && hasHalfStar ? "#F5A623" : "#E8E7E2"), fontSize: 14 }}>
          {i < fullStars ? "★" : (i === fullStars && hasHalfStar ? "½" : "☆")}
        </span>
      ))}
      <span style={{ fontSize: 12, color: "#888780", marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PartnershipListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
      path: "/partnerships/create",
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

  // Categories from mockup
  const categories = [
    { id: "all", name: "Semua UMKM" },
    { id: "batik", name: "Batik" },
    { id: "mebel", name: "Mebel" },
    { id: "kerajinan", name: "Kerajinan" },
    { id: "kuliner", name: "Kuliner" },
    { id: "fashion", name: "Fashion" },
  ];

  // Filter UMKM based on search and category
  const filteredUMKM = MOCK_UMKM_LIST.filter((umkm) => {
    const matchesSearch = umkm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         umkm.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
                           umkm.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalItems = filteredUMKM.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedUMKM = filteredUMKM.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAjukanKemitraan = (umkmId: string, umkmName: string) => {
    navigate(`/partnerships/create?receiver_id=${umkmId}&receiver_name=${encodeURIComponent(umkmName)}`);
  };

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
        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoUMKMTumbuh size={36} />
            <span style={{ color: "#F5A623", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
              UMKM<br />Tumbuh
            </span>
          </div>
        </div>

        {/* Navigation */}
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

        {/* Logout */}
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
          {/* Search Bar */}
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
              placeholder="Cari UMKM atau lokasi..."
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

          {/* Right Section */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Notification */}
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

            {/* Profile */}
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
            fontSize: 28,
            fontWeight: 700,
            color: "#1A3A6B",
          }}>
            Temukan UMKM Strategis
          </h1>
          <p style={{
            margin: "0 0 28px",
            fontSize: 14,
            color: "#888780",
          }}>
            Pilih UMKM potensial untuk diajak kerjasama kemitraan
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
                  fontSize: 13,
                  fontWeight: selectedCategory === cat.id ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: selectedCategory === cat.id ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* UMKM Cards Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {paginatedUMKM.map((umkm) => (
              <div
                key={umkm.id}
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: "20px 24px",
                  border: "1px solid #E8E7E2",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 16,
                }}>
                  {/* Left Section - Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#2C2C2A",
                      }}>
                        {umkm.name}
                      </h3>
                      <div style={{
                        background: "#F1EFE8",
                        padding: "2px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#888780",
                      }}>
                        {umkm.category}
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888780" strokeWidth="1.8">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span style={{ fontSize: 13, color: "#888780" }}>{umkm.location}</span>
                    </div>
                    
                    {/* Description */}
                    <p style={{
                      margin: "0 0 16px",
                      fontSize: 13,
                      color: "#5F5E5A",
                      lineHeight: 1.5,
                    }}>
                      {umkm.description}
                    </p>
                    
                    {/* Rating */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <StarRating rating={umkm.rating} />
                      <span style={{
                        fontSize: 12,
                        color: "#B4B2A9",
                      }}>
                        ({umkm.reviewCount}+ ulasan)
                      </span>
                    </div>
                  </div>

                  {/* Right Section - Action Button */}
                  <div>
                    <button
                      onClick={() => handleAjukanKemitraan(umkm.id, umkm.name)}
                      style={{
                        padding: "10px 28px",
                        background: "#1A3A6B",
                        border: "none",
                        borderRadius: 10,
                        color: "white",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "background 0.15s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#2A5DA8")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#1A3A6B")}
                    >
                      Ajukan Kemitraan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {paginatedUMKM.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "white",
              borderRadius: 16,
              border: "1px solid #E8E7E2",
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#B4B2A9" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="22" y1="22" x2="15" y2="15" />
              </svg>
              <p style={{ marginTop: 16, fontSize: 14, color: "#888780" }}>
                Tidak ada UMKM yang ditemukan
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 32,
              paddingTop: 16,
              borderTop: "1px solid #E8E7E2",
            }}>
              <p style={{ fontSize: 13, color: "#888780" }}>
                Menampilkan {paginatedUMKM.length} dari {totalItems} UMKM strategis
              </p>
              
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #D3D1C7",
                    background: "white",
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
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: currentPage === i + 1 ? "none" : "1px solid #D3D1C7",
                      background: currentPage === i + 1 ? "#1A3A6B" : "white",
                      color: currentPage === i + 1 ? "white" : "#5F5E5A",
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
                    borderRadius: 8,
                    border: "1px solid #D3D1C7",
                    background: "white",
                    fontSize: 13,
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    opacity: currentPage === totalPages ? 0.5 : 1,
                  }}
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}

          {/* Show More Button (alternative to pagination) */}
          {totalPages === 1 && totalItems > 5 && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                style={{
                  padding: "12px 32px",
                  background: "white",
                  border: "1px solid #1A3A6B",
                  borderRadius: 40,
                  color: "#1A3A6B",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1A3A6B";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#1A3A6B";
                }}
              >
                Tampilkan Lebih Banyak Mitra
              </button>
              <p style={{ marginTop: 12, fontSize: 12, color: "#888780" }}>
                Menampilkan {paginatedUMKM.length} dari {totalItems} UMKM strategis
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PartnershipListPage;