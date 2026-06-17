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

const PartnershipListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isInbox = location.pathname.includes("/inbox");

  let user;
  try { user = getCurrentUser(); } catch { user = dummyUser; }

  const isMitra = user?.role === "MITRA";
  const sidebarWidth = isMitra ? 260 : 220;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [partnerList, setPartnerList] = useState<PartnerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = ["all", "Kuliner", "Furnitur", "Seni Lukis", "Lainnya"];

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

  // MITRA Inbox
  if (isInbox) return <PartnershipMitraInboxPage />;

  // Discovery View
  const totalPages = Math.ceil(totalItems / 10);
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif", background: "#F5F4F0" }}>
      <PartnershipSidebar />
      <main style={{ marginLeft: sidebarWidth, flex: 1, padding: "32px 40px", maxWidth: 1100 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 700, color: "#1A3A6B" }}>Temukan Mitra Strategis</h1>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "#888780" }}>Temukan mitra terbaik untuk mengembangkan usaha Anda</p>

        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
          <input type="text" placeholder="Cari Mitra..." value={searchTerm}
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
            <p style={{ marginTop: 16, color: "#888780" }}>Memuat data mitra...</p>
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
                  {mitra.city && <p style={{ margin: 0, fontSize: 13, color: "#888780" }}>{mitra.city}{mitra.province ? `, ${mitra.province}` : ""}</p>}
                  <button onClick={() => navigate(`${base(user)}/${mitra.id}`)}
                    style={{ marginTop: "auto", padding: "10px 0", background: "#1A3A6B", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "white", cursor: "pointer", width: "100%" }}>
                    Lihat Profil
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 32 }}>
                <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #D3D1C7", background: "white", fontSize: 13, cursor: currentPage === 1 ? "not-allowed" : "pointer", color: currentPage === 1 ? "#B4B2A9" : "#1A3A6B" }}>Previous</button>
                {pageNumbers.map((p) => (
                  <button key={p} onClick={() => handlePageChange(p)}
                    style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: p === currentPage ? "#1A3A6B" : "white", color: p === currentPage ? "white" : "#5F5E5A", fontSize: 13, fontWeight: p === currentPage ? 600 : 400, cursor: "pointer" }}>{p}</button>
                ))}
                <button onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #D3D1C7", background: "white", fontSize: 13, cursor: currentPage === totalPages ? "not-allowed" : "pointer", color: currentPage === totalPages ? "#B4B2A9" : "#1A3A6B" }}>Next</button>
              </div>
            )}

            {partnerList.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <p style={{ fontSize: 16, color: "#888780" }}>Tidak ada mitra yang ditemukan</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default PartnershipListPage;