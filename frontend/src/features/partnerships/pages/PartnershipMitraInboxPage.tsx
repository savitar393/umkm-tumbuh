import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { partnershipsApi } from "../api";
import PartnershipSidebar from "../components/PartnershipSidebar";
import { getCurrentUser } from "../../../shared/auth/currentUser";

interface IncomingItem {
  pengajuanID: string;
  pengirim: string;
  proposal_title: string;
  tanggalPengajuan: string;
  status: string;
}

const AttachmentChips: React.FC<{ items?: string[] }> = ({ items = [] }) => {
  if (items.length === 0) return null;
  const chipDefs = items.slice(0, 3).map((f) => {
    const l = f.toLowerCase();
    if (l.includes("nib") || l.includes("ktp")) return { label: "NIB", color: "#1D9E75" };
    if (l.includes("proposal")) return { label: "Proposal", color: "#1A3A6B" };
    if (l.includes("katalog") || l.includes("produk")) return { label: "Katalog", color: "#F5A623" };
    return { label: "Lampiran", color: "#888780" };
  });
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {chipDefs.map((c, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${c.color}15`, color: c.color }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          {c.label}
        </span>
      ))}
    </div>
  );
};

function getMonthName(): string {
  return ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][new Date().getMonth()];
}

const PartnershipMitraInboxPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isMitra = user?.role === "MITRA";
  const basePath = isMitra ? "/mitra/partnerships" : "/umkm/partnerships";
  const sidebarWidth = isMitra ? 260 : 220;
  const [readItems, setReadItems] = useState<Set<string>>(new Set(JSON.parse(localStorage.getItem("readIncoming") || "[]")));
  const [incomingList, setIncomingList] = useState<IncomingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const persistReadItems = useCallback((updated: Set<string>) => {
    setReadItems(updated);
    localStorage.setItem("readIncoming", JSON.stringify([...updated]));
  }, []);

  useEffect(() => {
    const fetchInbox = async () => {
      setLoading(true);
      try {
        const resp = await partnershipsApi.getIncoming({ page: 1, limit: 50 });
        setIncomingList(resp.data?.pengajuan_masuk || []);
      } catch {
        setIncomingList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInbox();
  }, []);

  const activeStatuses = ["DIAJUKAN", "DITINJAU", "MENUNGGU_DOKUMEN_TTD"];
  const filteredList = incomingList.filter((i) => activeStatuses.includes(i.status));
  const menunggu = filteredList.filter((i) => i.status === "DIAJUKAN" || i.status === "DITINJAU").length;
  const diproses = filteredList.filter((i) => i.status === "MENUNGGU_DOKUMEN_TTD").length;
  const monthName = getMonthName();
  const totalPengajuan = filteredList.length;

  const handleMarkRead = (id: string) => {
    const updated = new Set(readItems);
    updated.add(id);
    persistReadItems(updated);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif", background: "#F5F4F0" }}>
      <PartnershipSidebar />
      <main style={{ marginLeft: sidebarWidth, flex: 1, padding: "32px 40px", maxWidth: 1100 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 700, color: "#1A3A6B" }}>Inbox Pengajuan Masuk</h1>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "#888780" }}>Tinjau pengajuan kemitraan yang masuk dari UMKM</p>

        {/* Summary Stats */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1, background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid #E8E7E2", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FFF8E7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E07B30" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div><p style={{ margin: "0 0 4px", fontSize: 12, color: "#888780" }}>MENUNGGU</p><p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#E07B30" }}>{menunggu}</p></div>
          </div>
          <div style={{ flex: 1, background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid #E8E7E2", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#E8F5F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div><p style={{ margin: "0 0 4px", fontSize: 12, color: "#888780" }}>DIPROSES</p><p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#1D9E75" }}>{diproses}</p></div>
          </div>
        </div>

        {/* Growth Card */}
        <div style={{ background: "linear-gradient(90deg, #1A3A6B 0%, #2A5DA8 100%)", borderRadius: 16, padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>PERTUMBUHAN KUARTAL INI ({monthName})</p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "white" }}>+{totalPengajuan} Pengajuan</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{monthName} ini</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>MITRA BARU</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#F5A623" }}>+{totalPengajuan}</p>
            <span style={{ fontSize: 11, color: "#1D9E75", background: "rgba(255,255,255,0.15)", padding: "2px 8px", borderRadius: 10 }}>↑ {totalPengajuan > 0 ? ((totalPengajuan / 10) * 100).toFixed(1) : "0"}%</span>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 16, border: "1px solid #E8E7E2" }}>
            <div style={{ display: "inline-block", width: 40, height: 40, borderRadius: "50%", border: "3px solid #E8E7E2", borderTopColor: "#1A3A6B", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ marginTop: 16, color: "#888780" }}>Memuat pengajuan...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filteredList.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 16, border: "1px solid #E8E7E2" }}>
            <p style={{ fontSize: 16, color: "#888780" }}>Belum ada pengajuan masuk</p>
          </div>
        )}

        {/* List */}
        {!loading && filteredList.map((item, idx) => {
          const isNew = !readItems.has(item.pengajuanID);
          return (
            <div key={item.pengajuanID || idx} style={{ background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid #E8E7E2", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 200 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `hsl(${(item.pengirim?.length || 0) * 30 % 360}, 65%, 50%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: 20, flexShrink: 0 }}>
                  {(item.pengirim || "?").charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: "#2C2C2A" }}>{item.pengirim}</span>
                    {isNew ? (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "white", background: "#E24B4A", padding: "2px 8px", borderRadius: 10 }}>BARU</span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#888780", background: "#F1F1F1", padding: "2px 8px", borderRadius: 10 }}>DIBACA</span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "#888780", display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {item.tanggalPengajuan ? new Date(item.tanggalPengajuan).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </span>
                    <AttachmentChips items={[item.proposal_title || ""]} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleMarkRead(item.pengajuanID)}
                  style={{ padding: "8px 14px", background: "white", border: "1px solid #D3D1C7", borderRadius: 8, fontSize: 12, fontWeight: 500, color: "#888780", cursor: "pointer" }}>
                  Tandai Dibaca
                </button>
                <button onClick={() => navigate(`${basePath}/approve/${item.pengajuanID}`)}
                  style={{ padding: "8px 20px", background: "#1A3A6B", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}>
                  Lihat Detail
                </button>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default PartnershipMitraInboxPage;