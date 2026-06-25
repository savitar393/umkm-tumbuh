import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
  Inbox,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import { partnershipsApi, type IncomingPartnershipsResponse, type IncomingPartnershipSummaryResponse } from "../api";

type IncomingItem = IncomingPartnershipsResponse["pengajuan_masuk"][number];

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

export default function PartnershipMitraInboxPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const basePath = getBasePath(user?.role);
  const readStorageKey = `readIncoming:${user?.id ?? "anonymous"}`;

  const [readItems, setReadItems] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(readStorageKey) || "[]"));
    } catch {
      return new Set();
    }
  });

  const [incomingList, setIncomingList] = useState<IncomingItem[]>([]);
  const [incomingSummary, setIncomingSummary] = useState<IncomingPartnershipSummaryResponse["summary"] | null>(null);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState("");
  const [error, setError] = useState("");

  const totalItems = pagination?.total ?? incomingList.length;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return incomingList;

    return incomingList.filter((item) => {
      return (
        item.pengirim.toLowerCase().includes(query) ||
        item.pengajuanID.toLowerCase().includes(query) ||
        item.proposal_title.toLowerCase().includes(query)
      );
    });
  }, [incomingList, searchTerm]);

  const visibleRange = useMemo(() => getPageRange(currentPage, totalPages), [currentPage, totalPages]);

  // const unreadCount = incomingList.filter((item) => !readItems.has(item.pengajuanID)).length;
  const visibleUnreadCount = filteredItems.filter(
    (item) => !readItems.has(item.pengajuanID),
  ).length;

  const visibleRequestCount = filteredItems.length;
  const pendingCount = incomingList.filter((item) =>
    ["DRAFT", "SUBMITTED", "DIAJUKAN", "REVIEWED", "DITINJAU"].includes(item.status.toUpperCase()),
  ).length;
  const approvedCount = incomingList.filter((item) =>
    [
      "WAITING_DOCUMENT",
      "MENUNGGU_DOKUMEN_TTD",
      "APPROVED",
      "ACTIVE",
      "AKTIF",
      "COMPLETED",
      "SELESAI",
    ].includes(item.status.toUpperCase()),
  ).length;
  const rejectedCount = incomingList.filter((item) =>
    ["REJECTED", "DITOLAK"].includes(item.status.toUpperCase()),
  ).length;

  const kpiPending = incomingSummary?.menunggu ?? pendingCount;
  const kpiApproved = incomingSummary?.disetujui ?? approvedCount;
  const kpiRejected = incomingSummary?.ditolak ?? rejectedCount;
  const kpiTotal = incomingSummary?.total ?? totalItems;

  const currentStart = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const currentEnd = Math.min(currentPage * itemsPerPage, totalItems);

  const persistReadItems = useCallback(
    (updated: Set<string>) => {
      setReadItems(updated);
      localStorage.setItem(readStorageKey, JSON.stringify([...updated]));
    },
    [readStorageKey],
  );

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await partnershipsApi.getIncoming({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter || undefined,
      });

      setIncomingList(response.data?.pengajuan_masuk ?? []);

      if (response.data?.pagination) {
        setPagination(response.data.pagination);
      } else {
        setPagination(null);
      }
    } catch (err) {
      setIncomingList([]);
      setPagination(null);
      setError(err instanceof Error ? err.message : "Gagal memuat pengajuan masuk.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  function handlePageChange(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleMarkRead(id: string) {
    const updated = new Set(readItems);
    updated.add(id);
    persistReadItems(updated);

    setMarkingId(id);

    try {
      await partnershipsApi.markAsRead(id);
    } catch {
      // Local read state is enough for current UI; backend mark-read can be retried later.
    } finally {
      setMarkingId("");
    }
  }

  async function handleOpenDetail(item: IncomingItem) {
    if (!readItems.has(item.pengajuanID)) {
      await handleMarkRead(item.pengajuanID);
    }

    navigate(`${basePath}/review/${item.pengajuanID}`);
  }

  async function fetchIncomingSummary() {
    try {
      const response = await partnershipsApi.getIncomingSummary();

      if (response.success === true && response.data?.summary) {
        setIncomingSummary(response.data.summary);
      }
    } catch {
      // Summary is optional; table pagination still works without it.
    }
  }

  useEffect(() => {
    fetchIncomingSummary();
  }, []);

  return (
    <UmkmLayout
      title="Inbox Kemitraan"
      subtitle="Tinjau pengajuan kemitraan yang masuk dari calon partner."
    >
      <main className="partnership-inbox-page">
        <section className="partnership-inbox-overview">
          <div>
            <span className="partnership-eyebrow">
              <Inbox size={16} />
              Pengajuan Masuk
            </span>
            <h1>Daftar Pengajuan Masuk</h1>
            <p>
              Pantau proposal kerja sama yang masuk, buka detail pengajuan, lalu ambil keputusan review.
            </p>
          </div>

          <article className="partnership-inbox-highlight-card">
            <strong>{kpiTotal}</strong>
            <span>Total Masuk</span>
            <small>{kpiPending} perlu ditinjau</small>
          </article>
        </section>

        <section className="partnership-inbox-metric-grid">
          <article className="partnership-inbox-metric-card waiting">
            <Clock3 size={22} />
            <div>
              <span>Menunggu</span>
              <strong>{kpiPending}</strong>
              <small>Perlu ditinjau</small>
            </div>
          </article>

          <article className="partnership-inbox-metric-card active">
            <CheckCircle2 size={22} />
            <div>
              <span>Disetujui / Aktif</span>
              <strong>{kpiApproved}</strong>
              <small>Proses lanjut</small>
            </div>
          </article>

          <article className="partnership-inbox-metric-card rejected">
            <XCircle size={22} />
            <div>
              <span>Ditolak</span>
              <strong>{kpiRejected}</strong>
              <small>Tidak disetujui</small>
            </div>
          </article>

          <article className="partnership-inbox-metric-card total">
            <Inbox size={22} />
            <div>
              <span>Belum Dibaca</span>
              <strong>{visibleUnreadCount}</strong>
              <small>dari {visibleRequestCount} ditampilkan</small>
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
                placeholder="Cari pengirim, ID pengajuan, atau judul proposal..."
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
              <p>Memuat pengajuan masuk...</p>
            </section>
          ) : error ? (
            <section className="partnership-state-card error">
              <strong>Gagal memuat inbox</strong>
              <p>{error}</p>
              <button type="button" onClick={fetchInbox}>
                Coba Lagi
              </button>
            </section>
          ) : filteredItems.length === 0 ? (
            <section className="partnership-state-card">
              <strong>Belum ada pengajuan masuk</strong>
              <p>Tidak ada pengajuan yang cocok dengan pencarian atau filter saat ini.</p>
            </section>
          ) : (
            <>
              <div className="partnership-inbox-table">
                <div className="partnership-inbox-table-head">
                  <span>Pengaju UMKM</span>
                  <span>ID Pengajuan</span>
                  <span>Tanggal</span>
                  <span>Status</span>
                  <span>Aksi</span>
                </div>

                {filteredItems.map((item) => {
                  const isUnread = !readItems.has(item.pengajuanID);

                  return (
                    <article
                      className={`partnership-inbox-row ${isUnread ? "unread" : ""}`}
                      key={item.pengajuanID}
                    >
                      <div className="partnership-inbox-row-main">
                        <div className="partnership-inbox-avatar">{getInitials(item.pengirim)}</div>
                        <span>
                          <strong>{item.pengirim}</strong>
                          <small>{item.proposal_title || "Proposal kemitraan"}</small>
                        </span>
                        {isUnread ? <em>Baru</em> : null}
                      </div>

                      <div className="partnership-inbox-id">
                        <code>#{item.pengajuanID}</code>
                      </div>

                      <div className="partnership-inbox-date">{formatDate(item.tanggalPengajuan)}</div>

                      <div className="partnership-inbox-status">
                        <StatusBadge status={String(item.status)} />
                      </div>

                      <div className="partnership-inbox-actions">
                        <button
                          type="button"
                          className="view"
                          onClick={() => handleOpenDetail(item)}
                        >
                          <Eye size={15} />
                          Lihat Detail
                        </button>

                        {isUnread ? (
                          <button
                            type="button"
                            className="read"
                            disabled={markingId === item.pengajuanID}
                            onClick={() => handleMarkRead(item.pengajuanID)}
                          >
                            <ShieldCheck size={15} />
                            {markingId === item.pengajuanID ? "..." : "Dibaca"}
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>

              <section className="partnership-pagination">
                <p>
                  Menampilkan {currentStart}-{currentEnd} dari {totalItems} pengajuan
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
