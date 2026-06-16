// frontend/src/features/partnerships/pages/PartnershipListPage.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { partnershipsApi } from "../api";
import type { PartnerListItem } from "../api";
import { getCurrentUser } from "../../../shared/auth/currentUser";

// Logo component
const LogoUMKMTumbuh: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <img 
    src="/logo.png" 
    alt="UMKM Tumbuh" 
    style={{ width: size, height: size, objectFit: "contain" }}
    onError={(e) => {
      const target = e.target as HTMLImageElement;
      target.style.display = "none";
      const parent = target.parentElement;
      if (parent) {
        const fallback = document.createElement("div");
        fallback.style.width = `${size}px`;
        fallback.style.height = `${size}px`;
        fallback.style.background = "#F5A623";
        fallback.style.borderRadius = "8px";
        fallback.style.display = "flex";
        fallback.style.alignItems = "center";
        fallback.style.justifyContent = "center";
        fallback.style.color = "#1A3A6B";
        fallback.style.fontWeight = "bold";
        fallback.style.fontSize = `${size * 0.4}px`;
        fallback.textContent = "UMKM";
        parent.appendChild(fallback);
      }
    }}
  />
);

// Dummy user data for now (karena getCurrentUser mungkin belum return name)
const dummyUser = {
  id: "user1",
  role: "MITRA" as const,
  fullName: "Nusantara Ventures",
};

const PartnershipListPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Gunakan dummy user atau getCurrentUser
  let user;
  try {
    user = getCurrentUser();
  } catch {
    user = dummyUser;
  }
  
  const isMitra = user?.role === "MITRA";
  const userName = user?.fullName || user?.name || "Nusantara Ventures";
  const userRole = user?.role || "MITRA";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [partnerList, setPartnerList] = useState<PartnerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Categories
  const categories = ["all", "Kuliner", "Furnitur", "Seni Lukis", "Lainnya"];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchFn = isMitra ? partnershipsApi.listUMKM : partnershipsApi.listMitra;
        const response = await fetchFn({
          q: searchTerm || undefined,
          page: currentPage,
          limit: 5,
        });
        
        const items = isMitra ? (response.umkm ?? []) : (response.mitra ?? []);
        setPartnerList(items);
        setTotalItems(response.pagination.total);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Gagal memuat data.");
        setPartnerList([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchTerm, currentPage, isMitra]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHubungiMitra = (mitraId: string) => {
    navigate(`/partnerships/${mitraId}`);
  };

  const getButtonText = (item: PartnerListItem) => {
    const name = item.name.toLowerCase();
    if (name.includes("mandiri") || name.includes("bank")) return "Hubungi Mitra";
    if (name.includes("ventures") || name.includes("nusantara")) return "Lihat Portfolio";
    if (name.includes("jne")) return "Cek Layanan";
    if (name.includes("kreatif")) return "Daftar Batch Baru";
    return "Lihat Profil";
  };

  const getButtonStyle = (item: PartnerListItem) => {
    const name = item.name.toLowerCase();
    if (name.includes("mandiri") || name.includes("bank")) {
      return { background: "#1D9E75", hover: "#0F6E56" };
    }
    if (name.includes("ventures") || name.includes("nusantara")) {
      return { background: "#1A3A6B", hover: "#2A5DA8" };
    }
    if (name.includes("jne")) {
      return { background: "#F5A623", hover: "#E09612" };
    }
    if (name.includes("kreatif")) {
      return { background: "#E24B4A", hover: "#C0392B" };
    }
    return { background: "#1A3A6B", hover: "#2A5DA8" };
  };

  // Hitung totalPages untuk pagination
  const totalPages = Math.ceil(totalItems / 5);

  return (
    <div style={{
      minHeight: "100vh",
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      background: "#F5F4F0",
    }}>
      {/* Header with Logo */}
      <header style={{
        background: "white",
        borderBottom: "1px solid #E8E7E2",
        padding: "16px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LogoUMKMTumbuh size={40} />
          <span style={{ fontSize: 20, fontWeight: 700, color: "#1A3A6B" }}>UMKM Tumbuh</span>
        </div>
        
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
              border: "1px solid #E8E7E2",
              background: "#F1F1F1",
              fontSize: 13,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1A7A5E" }}>
              {userName}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "#888780" }}>{userRole}</p>
          </div>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#1A3A6B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: 16,
          }}>
            {userName.charAt(0)}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ padding: "32px 40px", maxWidth: 1000, margin: "0 auto" }}>
        {/* Page Title */}
        <h1 style={{
          margin: "0 0 8px",
          fontSize: 28,
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
          marginBottom: 24,
          borderBottom: "1px solid #E8E7E2",
          paddingBottom: 16,
        }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              style={{
                padding: "8px 24px",
                borderRadius: 30,
                border: "none",
                background: selectedCategory === cat ? "#1A3A6B" : "white",
                color: selectedCategory === cat ? "white" : "#5F5E5A",
                fontSize: 14,
                fontWeight: selectedCategory === cat ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              {cat === "all" ? "Semua Mitra" : cat}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "white",
            borderRadius: 16,
            border: "1px solid #E8E7E2",
          }}>
            <div style={{
              display: "inline-block",
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid #E8E7E2",
              borderTopColor: "#1A3A6B",
              animation: "spin 0.8s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ marginTop: 16, color: "#888780" }}>Memuat data mitra...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "white",
            borderRadius: 16,
            border: "1px solid #E8E7E2",
          }}>
            <p style={{ fontSize: 16, color: "#E24B4A" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
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
              Coba Lagi
            </button>
          </div>
        )}

        {/* Mitra Cards */}
        {!loading && !error && (
          <>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}>
              {partnerList.map((mitra, index) => {
                const buttonStyle = getButtonStyle(mitra);
                const buttonText = getButtonText(mitra);
                
                return (
                  <div
                    key={mitra.id}
                    style={{
                      background: "white",
                      borderRadius: 16,
                      padding: "20px 24px",
                      border: "1px solid #E8E7E2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "box-shadow 0.2s",
                      cursor: "pointer",
                      flexWrap: "wrap",
                      gap: 16,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    onClick={() => handleHubungiMitra(mitra.id)}
                  >
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: `hsl(${index * 40 % 360}, 65%, 50%)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "bold",
                          fontSize: 18,
                        }}>
                          {mitra.name.charAt(0)}
                        </div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2C2C2A" }}>
                          {mitra.name}
                        </h3>
                      </div>
                      <p style={{
                        margin: "0 0 8px 0",
                        fontSize: 14,
                        color: "#5F5E5A",
                        lineHeight: 1.5,
                      }}>
                        {mitra.description || "Mitra terpercaya untuk pengembangan UMKM di Indonesia"}
                      </p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {mitra.type && (
                          <span style={{
                            fontSize: 12,
                            color: "#1D9E75",
                            background: "#E8F5F0",
                            padding: "2px 8px",
                            borderRadius: 12,
                          }}>
                            {mitra.type}
                          </span>
                        )}
                        {mitra.city && (
                          <span style={{
                            fontSize: 12,
                            color: "#888780",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}>
                            📍 {mitra.city}, {mitra.province}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHubungiMitra(mitra.id);
                      }}
                      style={{
                        padding: "10px 24px",
                        background: buttonStyle.background,
                        border: "none",
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 600,
                        color: "white",
                        cursor: "pointer",
                        transition: "background 0.15s, transform 0.1s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = buttonStyle.hover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = buttonStyle.background;
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = "scale(0.98)";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {buttonText}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {partnerList.length > 0 && partnerList.length < totalItems && (
              <div style={{ textAlign: "center", marginTop: 32 }}>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  style={{
                    padding: "12px 32px",
                    background: "white",
                    border: "1px solid #1A3A6B",
                    borderRadius: 30,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1A3A6B",
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
                  Tambilkan Lebih Banyak Mitra
                </button>
                <p style={{
                  marginTop: 12,
                  fontSize: 12,
                  color: "#888780",
                }}>
                  Menampilkan {partnerList.length} dari {totalItems} mitra strategis terdaftar
                </p>
              </div>
            )}

            {/* Empty State */}
            {partnerList.length === 0 && !loading && !error && (
              <div style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "white",
                borderRadius: 16,
                border: "1px solid #E8E7E2",
              }}>
                <p style={{ fontSize: 16, color: "#888780" }}>Tidak ada mitra yang ditemukan</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PartnershipListPage;