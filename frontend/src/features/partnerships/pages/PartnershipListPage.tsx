import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { partnershipsApi } from "../api";
import type { PartnerListItem } from "../api";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import PartnershipSidebar from "../components/PartnershipSidebar";
import PartnershipMitraInboxPage from "./PartnershipMitraInboxPage";

const base = (user: any) => user?.role === "MITRA" ? "/mitra/partnerships" : "/umkm/partnerships";

const dummyUser = {
  id: "user1",
  role: "MITRA" as const,
  fullName: "Nusantara Ventures",
};

const UMKM_TYPES = ["all", "Agribisnis", "Digital", "Edukasi", "Fashion", "Jasa", "Kecantikan", "Kerajinan", "Kesehatan", "Kriya", "Kuliner", "Otomotif", "Perdagangan", "Usaha Mikro, Kecil, dan Menengah"];

const MITRA_TYPES = ["all", "BUMN", "Inkubator Bisnis", "Komunitas", "Komunitas Bisnis", "Koperasi", "Lainnya", "Lembaga Keuangan", "Lembaga Pelatihan", "Lembaga Pendidikan", "Logistik", "Marketplace", "Media Promosi", "Pemerintah", "Pemerintah Daerah", "Perguruan Tinggi", "Perusahaan", "Perusahaan Swasta"];

const PartnershipListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isInbox = location.pathname.includes("/inbox");

  let user;
  try { user = getCurrentUser(); } catch { user = dummyUser; }

  const isMitra = user?.role === "MITRA";
  const categories = isMitra ? UMKM_TYPES : MITRA_TYPES;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [partnerList, setPartnerList] = useState<PartnerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isInbox) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchFn = isMitra ? partnershipsApi.listUMKM : partnershipsApi.listMitra;
        const response = await fetchFn({
          q: searchTerm || undefined,
          filterType: selectedCategory !== "all" ? selectedCategory : undefined,
          page: currentPage,
          limit: 10,
        });
        const items = isMitra ? (response.umkm ?? []) : (response.mitra ?? []);
        setPartnerList(items);
        setTotalItems(response.pagination.total);
      } catch (err: any) {
        setError(err.message || "Gagal memuat data.");
        setPartnerList([]);
        setTotalItems(0);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [searchTerm, selectedCategory, currentPage, isMitra, isInbox]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isInbox) return <PartnershipMitraInboxPage />;

  const totalPages = Math.ceil(totalItems / 10);
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);

  const pageRange = () => {
    const pages: (number | "…")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("…");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("…");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif", position: "relative" }}>
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundImage: "url(/background.png)", backgroundSize: "cover", backgroundPosition: "center", zIndex: 0, opacity: 0.7 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", width: "100%" }}>
        <PartnershipSidebar />
        <main style={{ marginLeft: 260, flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 1100, padding: "32px 40px" }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 700, color: "#1A3A6B" }}>{isMitra ? "Cari UMKM" : "Temukan Mitra Strategis"}</h1>
            <p style={{ margin: "0 0 28px", fontSize: 14, color: "#888780" }}>{isMitra ? "Cari UMKM potensial untuk menjalin kemitraan" : "Temukan mitra terbaik untuk mengembangkan usaha Anda"}</p>

            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
              <input type="text" placeholder={isMitra ? "Cari UMKM..." : "Cari Mitra..."} value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ flex: 1, minWidth: 250, height: 44, padding: "0 16px", borderRadius: 10, border: "1px solid #E8E7E2", fontSize: 14, outline: "none", fontFamily: "inherit", background: "white" }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {categories.map((cat) => (
                  <button key={cat} onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                    style={{ padding: "8px 20px", borderRadius: 30, border: "none", background: selectedCategory === cat ? "#1A3A6B" : "white", color: selectedCategory === cat ? "white" : "#5F5E5A", fontSize: 13, fontWeight: selectedCategory === cat ? 600 : 400, cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    {cat === "all" ? "Semua" : cat}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ display: "inline-block", width: 40, height: 40, borderRadius: "50%", border: "3px solid #E8E7E2", borderTopColor: "#1A3A6B", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ marginTop: 16, color: "#888780" }}>Memuat data...</p>
              </div>
            )}

            {!loading && error && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <p style={{ fontSize: 16, color: "#E24B4A" }}>{error}</p>
                <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: "8px 24px", background: "#1A3A6B", border: "none", borderRadius: 30, color: "white", cursor: "pointer" }}>Coba Lagi</button>
              </div>
            )}

            {!loading && !error && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                  {partnerList.map((mitra) => (
                    <div key={mitra.id} style={{ background: "white", borderRadius: 14, padding: "24px", border: "1px solid #E8E7E2", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: "#1A3A6B", display: "flex", alignItems: "center", justifyContent: "center", color: "#F5A623", fontWeight: "bold", fontSize: 22, flexShrink: 0 }}>{mitra.name.charAt(0)}</div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#2C2C2A" }}>{mitra.name}</h3>
                          <span style={{ fontSize: 12, color: "#1D9E75", background: "#E8F5F0", padding: "2px 10px", borderRadius: 12, display: "inline-block", marginTop: 4 }}>{mitra.type}</span>
                        </div>
                      </div>
                      {mitra.description && <p style={{ margin: 0, fontSize: 13, color: "#5F5E5A", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{mitra.description}</p>}
                      {mitra.city && <p style={{ margin: 0, fontSize: 13, color: "#888780" }}>{mitra.city}{mitra.province ? `, ${mitra.province}` : ""}</p>}
                      <button onClick={() => navigate(`${base(user)}/${mitra.id}`)}
                        style={{ marginTop: "auto", padding: "10px 0", background: "#1A3A6B", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "white", cursor: "pointer", width: "100%" }}>
                        Lihat Profil
                      </button>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 32,
                    borderTop: "1px solid #F1EFE8",
                    paddingTop: 14,
                  }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#888780" }}>
                      Menampilkan {Math.min(currentPage * 10, totalItems)} dari {totalItems} data
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: "1px solid #E8E7E2",
                          background: "white", cursor: currentPage === 1 ? "not-allowed" : "pointer",
                          opacity: currentPage === 1 ? 0.4 : 1,
                          display: "flex", alignItems: "center", justifyContent: "center", color: "#5F5E5A",
                        }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>

                      {pageRange().map((p, i) =>
                        p === "…" ? (
                          <span key={`ellipsis-${i}`} style={{ width: 32, textAlign: "center", fontSize: 13, color: "#888780" }}>…</span>
                        ) : (
                          <button key={p} onClick={() => handlePageChange(p as number)}
                            style={{
                              width: 32, height: 32, borderRadius: 8,
                              border: p === currentPage ? "none" : "1px solid #E8E7E2",
                              background: p === currentPage ? "#1A3A6B" : "white",
                              color: p === currentPage ? "white" : "#5F5E5A",
                              fontSize: 13, fontWeight: p === currentPage ? 700 : 400,
                              cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                            {p}
                          </button>
                        )
                      )}

                      <button onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: "1px solid #E8E7E2",
                          background: "white", cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                          opacity: currentPage === totalPages ? 0.4 : 1,
                          display: "flex", alignItems: "center", justifyContent: "center", color: "#5F5E5A",
                        }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {partnerList.length === 0 && (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <p style={{ fontSize: 16, color: "#888780" }}>Tidak ada ditemukan</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PartnershipListPage;
