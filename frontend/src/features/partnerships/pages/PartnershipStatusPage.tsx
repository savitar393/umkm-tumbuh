import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
  Handshake,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import { partnershipsApi, type PartnershipStatusResponse } from "../api";

type StatusItem = PartnershipStatusResponse["pengajuan"][number];

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "SUBMITTED", label: "Diajukan" },
  { value: "REVIEWED", label: "Ditinjau" },
  { value: "WAITING_DOCUMENT", label: "Menunggu Dokumen" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "ACTIVE", label: "Aktif" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  DIAJUKAN: "Diajukan",
  SUBMITTED: "Diajukan",
  DITINJAU: "Ditinjau",
  REVIEWED: "Ditinjau",
  MENUNGGU_DOKUMEN_TTD: "Menunggu Dokumen",
  WAITING_DOCUMENT: "Menunggu Dokumen",
  APPROVED: "Disetujui",
  AKTIF: "Aktif",
  ACTIVE: "Aktif",
  DITOLAK: "Ditolak",
  REJECTED: "Ditolak",
  SELESAI: "Selesai",
  COMPLETED: "Selesai",
  DIBATALKAN: "Dibatalkan",
  CANCELLED: "Dibatalkan",
};

function getBasePath(role?: string) {
  if (role === "MITRA") return "/mitra/partnerships";
  if (role === "UMKM") return "/umkm/partnerships";
  return "/partnerships";
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "P"
  );
}

function formatDate(value: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function getStatusClass(status: string) {
  const normalized = status.toUpperCase();

  if (["SUBMITTED", "DIAJUKAN", "DRAFT"].includes(normalized)) return "submitted";
  if (["REVIEWED", "DITINJAU"].includes(normalized)) return "reviewed";
  if (["WAITING_DOCUMENT", "MENUNGGU_DOKUMEN_TTD", "APPROVED"].includes(normalized)) return "waiting";
  if (["ACTIVE", "AKTIF", "COMPLETED", "SELESAI"].includes(normalized)) return "active";
  if (["REJECTED", "DITOLAK"].includes(normalized)) return "rejected";
  if (["CANCELLED", "DIBATALKAN"].includes(normalized)) return "cancelled";

  return "default";
}

function canCancel(status: string) {
  return ["DRAFT", "SUBMITTED", "DIAJUKAN", "REVIEWED", "DITINJAU"].includes(status.toUpperCase());
}

function getPageRange(currentPage: number, totalPages: number) {
  const pages: Array<number | "…"> = [];

  if (totalPages <= 5) {
    for (let page = 1; page <= totalPages; page += 1) pages.push(page);
    return pages;
  }

  pages.push(1);

  if (currentPage > 3) pages.push("…");

  for (
    let page = Math.max(2, currentPage - 1);
    page <= Math.min(totalPages - 1, currentPage + 1);
    page += 1
  ) {
    pages.push(page);
  }

  if (currentPage < totalPages - 2) pages.push("…");

  pages.push(totalPages);

  return pages;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`partnership-status-badge ${getStatusClass(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

export default function PartnershipStatusPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const basePath = getBasePath(user?.role);

  const [statusData, setStatusData] = useState<PartnershipStatusResponse | null>(null);
  const [summary, setSummary] = useState<{ bermitra: number; menunggu: number; ditolak: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState("");
  const [error, setError] = useState("");

  const items = statusData?.pengajuan ?? [];
  const totalPages = Math.max(1, statusData?.pagination?.totalPages ?? 1);
  const totalItems = statusData?.pagination?.total ?? items.length;

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) => {
      return (
        item.mitraUmkmTujuan.toLowerCase().includes(query) ||
        item.pengajuanID.toLowerCase().includes(query) ||
        (item.proposalTitle ?? "").toLowerCase().includes(query)
      );
    });
  }, [items, searchTerm]);

  const visibleRange = useMemo(() => getPageRange(currentPage, totalPages), [currentPage, totalPages]);

  const stats = {
    active: summary?.bermitra ?? 0,
    waiting: summary?.menunggu ?? 0,
    rejected: summary?.ditolak ?? 0,
    total: totalItems,
  };

  async function fetchSummary() {
    try {
      const response = await partnershipsApi.getSummary();

      if (response.success === true && response.data?.summary) {
        setSummary(response.data.summary);
      }
    } catch {
      // Summary is optional; the table is still useful without it.
    }
  }

  async function fetchStatus() {
    setLoading(true);
    setError("");

    try {
      const response = await partnershipsApi.getStatus({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter || undefined,
      });

      if (response.success === true) {
        setStatusData(response.data);
        return;
      }

      setError(response.message || "Gagal memuat status pengajuan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat status pengajuan.");
      setStatusData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [currentPage, itemsPerPage, statusFilter]);

  function handlePageChange(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleCancel(item: StatusItem) {
    const confirmed = window.confirm(
      `Batalkan pengajuan ke ${item.mitraUmkmTujuan}? Tindakan ini tidak dapat dibatalkan.`,
    );

    if (!confirmed) return;

    setCancelingId(item.pengajuanID);

    try {
      await partnershipsApi.cancel(item.pengajuanID);
      await fetchStatus();
      await fetchSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membatalkan pengajuan.");
    } finally {
      setCancelingId("");
    }
  }

  return (
    <UmkmLayout
      title="Status Pengajuan"
      subtitle="Pantau progres pengajuan kemitraan yang telah Anda kirim."
    >
      <main className="partnership-status-page">
        <section className="partnership-status-hero">
          <div>
            <span className="partnership-eyebrow">
              <Handshake size={16} />
              Riwayat Pengajuan
            </span>
            <h1>Status Pengajuan Kemitraan</h1>
            <p>
              Lihat status review, batalkan pengajuan yang masih dalam proses, dan buka detail
              pengajuan untuk melihat perkembangan kerja sama.
            </p>
          </div>

          <div className="partnership-status-hero-card">
            <strong>{stats.total}</strong>
            <span>Total pengajuan</span>
          </div>
        </section>

        <section className="partnership-status-summary-grid">
          <article className="active">
            <CheckCircle2 size={22} />
            <div>
              <strong>{stats.active}</strong>
              <span>Bermitra/Aktif</span>
            </div>
          </article>

          <article className="waiting">
            <Clock3 size={22} />
            <div>
              <strong>{stats.waiting}</strong>
              <span>Menunggu</span>
            </div>
          </article>

          <article className="rejected">
            <XCircle size={22} />
            <div>
              <strong>{stats.rejected}</strong>
              <span>Ditolak</span>
            </div>
          </article>

          <article className="total">
            <Send size={22} />
            <div>
              <strong>{stats.total}</strong>
              <span>Total</span>
            </div>
          </article>
        </section>

        <section className="partnership-status-panel">
          <div className="partnership-status-toolbar">
            <label className="partnership-search">
              <Search size={18} />
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari nama tujuan, ID pengajuan, atau judul proposal..."
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option value={option.value} key={option.value || "all"}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={itemsPerPage}
              onChange={(event) => {
                setItemsPerPage(Number(event.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5 / halaman</option>
              <option value={10}>10 / halaman</option>
              <option value={25}>25 / halaman</option>
              <option value={50}>50 / halaman</option>
            </select>
          </div>

          {loading ? (
            <section className="partnership-state-card">
              <div className="partnership-spinner" />
              <p>Memuat status pengajuan...</p>
            </section>
          ) : error ? (
            <section className="partnership-state-card error">
              <strong>Gagal memuat data</strong>
              <p>{error}</p>
              <button type="button" onClick={fetchStatus}>
                Coba Lagi
              </button>
            </section>
          ) : filteredItems.length === 0 ? (
            <section className="partnership-state-card">
              <strong>Tidak ada pengajuan ditemukan</strong>
              <p>Coba ubah kata kunci pencarian atau filter status.</p>
            </section>
          ) : (
            <>
              <div className="partnership-status-table-wrap">
                <table className="partnership-status-table">
                  <thead>
                    <tr>
                      <th>Tujuan</th>
                      <th>ID Pengajuan</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.pengajuanID}>
                        <td>
                          <div className="partnership-status-target">
                            <div>{getInitials(item.mitraUmkmTujuan)}</div>
                            <span>
                              <strong>{item.mitraUmkmTujuan}</strong>
                              <small>{item.proposalTitle || "Proposal kemitraan"}</small>
                            </span>
                          </div>
                        </td>

                        <td>
                          <code>#{item.pengajuanID}</code>
                        </td>

                        <td>{formatDate(item.tanggalPengajuan)}</td>

                        <td>
                          <StatusBadge status={String(item.statusPengajuan)} />
                        </td>

                        <td>
                          <div className="partnership-status-actions">
                            <button
                              type="button"
                              className="view"
                              onClick={() => navigate(`${basePath}/review/${item.pengajuanID}`)}
                            >
                              <Eye size={15} />
                              Detail
                            </button>

                            {canCancel(String(item.statusPengajuan)) ? (
                              <button
                                type="button"
                                className="cancel"
                                disabled={cancelingId === item.pengajuanID}
                                onClick={() => handleCancel(item)}
                              >
                                {cancelingId === item.pengajuanID ? "Membatalkan..." : "Batalkan"}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <section className="partnership-pagination">
                <p>
                  Menampilkan {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} pengajuan
                </p>

                <div>
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Halaman sebelumnya"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  {visibleRange.map((page, index) =>
                    page === "…" ? (
                      <span key={`ellipsis-${index}`}>…</span>
                    ) : (
                      <button
                        type="button"
                        className={page === currentPage ? "active" : ""}
                        key={page}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Halaman berikutnya"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </section>
            </>
          )}
        </section>
      </main>
    </UmkmLayout>
  );
}
