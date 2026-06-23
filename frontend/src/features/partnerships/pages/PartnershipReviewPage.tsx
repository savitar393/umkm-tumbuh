import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Handshake,
  Mail,
  MessageSquareText,
  Phone,
  ScrollText,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import { partnershipsApi } from "../api";

type PartnershipDetail = Record<string, unknown>;

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

const REJECTION_REASONS = [
  { value: "tidak_sesuai_kriteria", label: "Tidak sesuai dengan kriteria kemitraan" },
  { value: "dokumen_tidak_lengkap", label: "Dokumen tidak lengkap atau tidak valid" },
  { value: "proposal_tidak_jelas", label: "Proposal kurang jelas atau belum realistis" },
  { value: "duplikat_pengajuan", label: "Duplikat pengajuan yang sudah ada" },
  { value: "lainnya", label: "Lainnya" },
];

function getBasePath(role?: string, pathname = "") {
  if (pathname.includes("/mitra/") || role === "MITRA") return "/mitra/partnerships";
  if (pathname.includes("/umkm/") || role === "UMKM") return "/umkm/partnerships";
  return "/partnerships";
}

function getText(data: PartnershipDetail | null, keys: string[], fallback = "-") {
  if (!data) return fallback;

  for (const key of keys) {
    const value = data[key];

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return fallback;
}

function getOptionalText(data: PartnershipDetail | null, keys: string[]) {
  const value = getText(data, keys, "");
  return value || "";
}

function getStatusLabel(status: string) {
  if (!status) return "-";
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

function canReceiverReview(status: string) {
  return ["DRAFT", "SUBMITTED", "DIAJUKAN", "REVIEWED", "DITINJAU"].includes(status.toUpperCase());
}

function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

function splitProposalDescription(value: string) {
  const [descriptionPart, reasonPart] = value.split(/\n\s*\nAlasan Bermitra:\s*/i);

  return {
    description: descriptionPart?.trim() || value,
    reason: reasonPart?.trim() || "",
  };
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`partnership-status-badge ${getStatusClass(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function getStatusMeta(status: string) {
  const normalized = status.toUpperCase();
  const label = getStatusLabel(status);
  const tone = getStatusClass(status);

  if (["SUBMITTED", "DIAJUKAN", "DRAFT"].includes(normalized)) {
    return {
      tone,
      label,
      description: "Pengajuan sudah dikirim dan menunggu pihak tujuan meninjau detail proposal.",
      nextStep: "Pihak tujuan dapat menyetujui atau menolak pengajuan ini.",
    };
  }

  if (["REVIEWED", "DITINJAU"].includes(normalized)) {
    return {
      tone,
      label,
      description: "Pengajuan sedang dalam proses peninjauan oleh pihak tujuan.",
      nextStep: "Tunggu keputusan akhir atau lanjutkan proses persetujuan bila Anda pihak tujuan.",
    };
  }

  if (["WAITING_DOCUMENT", "MENUNGGU_DOKUMEN_TTD", "APPROVED"].includes(normalized)) {
    return {
      tone,
      label,
      description: "Pengajuan telah disetujui awal dan membutuhkan kontrak yang sudah ditandatangani.",
      nextStep: "Unggah kontrak final untuk mengaktifkan kemitraan.",
    };
  }

  if (["ACTIVE", "AKTIF"].includes(normalized)) {
    return {
      tone,
      label,
      description: "Pengajuan telah disetujui dan kerja sama sudah aktif.",
      nextStep: "Kemitraan dapat dilanjutkan melalui monitoring dan aktivitas kerja sama.",
    };
  }

  if (["COMPLETED", "SELESAI"].includes(normalized)) {
    return {
      tone,
      label,
      description: "Kerja sama pada pengajuan ini sudah selesai.",
      nextStep: "Riwayat pengajuan tetap dapat dilihat sebagai arsip.",
    };
  }

  if (["REJECTED", "DITOLAK"].includes(normalized)) {
    return {
      tone,
      label,
      description: "Pengajuan tidak disetujui oleh pihak tujuan.",
      nextStep: "Pengaju dapat memperbaiki proposal atau mengajukan kerja sama lain.",
    };
  }

  if (["CANCELLED", "DIBATALKAN"].includes(normalized)) {
    return {
      tone,
      label,
      description: "Pengajuan ini sudah dibatalkan dan tidak lagi diproses.",
      nextStep: "Buat pengajuan baru bila kerja sama masih ingin dilanjutkan.",
    };
  }

  return {
    tone: "default",
    label,
    description: "Status pengajuan belum dikenali oleh sistem.",
    nextStep: "Periksa kembali detail pengajuan.",
  };
}

// function StatusTimeline({ progress }: { progress: number }) {
//   const steps = ["Dikirim", "Ditinjau", "Dokumen", "Keputusan"];

//   return (
//     <div className="partnership-status-timeline">
//       {steps.map((step, index) => {
//         const active = index + 1 <= progress;

//         return (
//           <div className={active ? "active" : ""} key={step}>
//             <span>{active ? <CheckCircle2 size={13} /> : index + 1}</span>
//             <strong>{step}</strong>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="partnership-review-info-item">
      {icon}
      <div>
        <span>{label}</span>
        <strong>{value || "-"}</strong>
      </div>
    </div>
  );
}

export default function PartnershipReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  const basePath = getBasePath(user?.role, location.pathname);

  const [partnership, setPartnership] = useState<PartnershipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const status = getText(partnership, ["status", "statusPengajuan", "status_pengajuan"], "");
  const statusMeta = getStatusMeta(status);
  const requesterID = getOptionalText(partnership, ["requester_id", "requesterID", "pengaju_akun_id"]);
  const receiverID = getOptionalText(partnership, ["receiver_id", "receiverID", "penerima_akun_id"]);
  const isReceiver = Boolean(user?.id && receiverID && user.id === receiverID);
  const isRequester = Boolean(user?.id && requesterID && user.id === requesterID);

  const requesterName = getText(partnership, ["requester_name", "pengirim", "business_name", "nama_pengaju"], "Pengaju");
  const receiverName = getText(partnership, ["receiver_name", "mitraUmkmTujuan", "nama_penerima"], "Tujuan Kemitraan");
  const proposalTitle = getText(
    partnership,
    ["proposal_title", "proposalTitle"],
    requesterName !== "Pengaju" ? `Pengajuan Kemitraan - ${requesterName}` : "Proposal kemitraan",
  );
  const proposalDescription = getText(partnership, ["proposal_description", "proposalDescription"], "");
  const requestCode = getText(partnership, ["request_code", "pengajuanID", "id"], id ?? "-");
  const contactPerson = getOptionalText(partnership, ["contact_person", "email", "phone_number"]);
  const category = getOptionalText(partnership, ["category", "business_category", "type"]);
  const submittedAt = partnership?.submitted_at ?? partnership?.tanggalPengajuan ?? partnership?.created_at;
  const updatedAt = partnership?.updated_at;

  const parsedProposal = useMemo(() => splitProposalDescription(proposalDescription), [proposalDescription]);

  useEffect(() => {
    if (!id) {
      setError("ID pengajuan tidak ditemukan.");
      setLoading(false);
      return;
    }

    const detailId = id;
    let ignore = false;

    async function fetchPartnership() {
      setLoading(true);
      setError("");

      try {
        const response = await partnershipsApi.getDetail(detailId);

        if (!ignore) {
          if (response.success === true && response.data) {
            setPartnership(response.data);
          } else {
            setError(response.message || "Data pengajuan tidak ditemukan.");
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Gagal memuat data pengajuan.");
          setPartnership(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchPartnership();

    return () => {
      ignore = true;
    };
  }, [id]);

  function handleBack() {
    if (location.pathname.includes("/inbox") || isReceiver) {
      navigate(`${basePath}/inbox`);
      return;
    }

    if (isRequester) {
      navigate(`${basePath}/status`);
      return;
    }

    navigate(basePath);
  }

  function handleContinueApproval() {
    if (!id) return;
    navigate(`${basePath}/approve/${id}`);
  }

  async function handleReject() {
    if (!id) return;

    if (!rejectionReason) {
      setRejectionError("Alasan penolakan wajib dipilih.");
      return;
    }

    const selectedReason =
      REJECTION_REASONS.find((reason) => reason.value === rejectionReason)?.label ?? rejectionReason;

    const finalReason = rejectionNotes.trim()
      ? `${selectedReason} - ${rejectionNotes.trim()}`
      : selectedReason;

    setSubmitting(true);
    setRejectionError("");

    try {
      await partnershipsApi.reject(id, finalReason);
      setShowRejectModal(false);
      navigate(`${basePath}/inbox`, { state: { toast: "Pengajuan berhasil ditolak." } });
    } catch (err) {
      setRejectionError(err instanceof Error ? err.message : "Gagal menolak pengajuan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <UmkmLayout
      title="Review Pengajuan"
      subtitle="Tinjau detail pengajuan kemitraan sebelum mengambil keputusan."
    >
      <main className="partnership-review-page">
        <button className="partnership-back-button" type="button" onClick={handleBack}>
          <ArrowLeft size={17} />
          Kembali
        </button>

        {loading ? (
          <section className="partnership-state-card">
            <div className="partnership-spinner" />
            <p>Memuat detail pengajuan...</p>
          </section>
        ) : error || !partnership ? (
          <section className="partnership-state-card error">
            <strong>Data pengajuan tidak ditemukan</strong>
            <p>{error || "Data tidak tersedia."}</p>
            <button type="button" onClick={handleBack}>
              Kembali
            </button>
          </section>
        ) : (
          <>
            <section className="partnership-review-hero">
              <div className="partnership-review-avatar">{getInitials(requesterName)}</div>

              <div>
                <span className="partnership-eyebrow">
                  <ClipboardCheck size={16} />
                  Detail Pengajuan
                </span>

                <h1>{proposalTitle}</h1>

                <div className="partnership-review-chip-row">
                  <span>#{requestCode}</span>
                  <StatusBadge status={status} />
                  {category ? <span>{category}</span> : null}
                </div>
              </div>
            </section>

            <section className="partnership-review-layout">
              <div className="partnership-review-main">
                <article className="partnership-review-card">
                  <h2>
                    <UserRound size={20} />
                    Ringkasan Pengajuan
                  </h2>

                  <div className="partnership-review-info-grid">
                    <InfoItem icon={<Building2 size={18} />} label="Pengaju" value={requesterName} />
                    <InfoItem icon={<Handshake size={18} />} label="Tujuan" value={receiverName} />
                    <InfoItem icon={<CalendarDays size={18} />} label="Tanggal Pengajuan" value={formatDate(submittedAt)} />
                    <InfoItem icon={<CalendarDays size={18} />} label="Terakhir Diperbarui" value={formatDateTime(updatedAt)} />
                    <InfoItem icon={<Phone size={18} />} label="Kontak" value={contactPerson || "-"} />
                    <InfoItem icon={<Mail size={18} />} label="Kode Pengajuan" value={requestCode} />
                  </div>
                </article>

                <article className="partnership-review-card">
                  <h2>
                    <MessageSquareText size={20} />
                    Deskripsi Produk / Profil
                  </h2>

                  <p>{parsedProposal.description || "Deskripsi pengajuan belum tersedia."}</p>
                </article>

                <article className="partnership-review-card">
                  <h2>
                    <Handshake size={20} />
                    Alasan Bermitra
                  </h2>

                  <p>{parsedProposal.reason || "Alasan bermitra belum tersedia."}</p>
                </article>

                <article className="partnership-review-card">
                  <h2>
                    <FileText size={20} />
                    Dokumen Pendukung
                  </h2>

                  <p className="partnership-review-note">
                    Saat ini lampiran dari form pengajuan masih berupa referensi nama file sesuai implementasi awal
                    branch partnership. Integrasi preview/unduh dokumen asli dapat disambungkan setelah document-service stabil.
                  </p>

                  <div className="partnership-review-document-grid">
                    {Array.isArray(partnership.attachment_files) && partnership.attachment_files.length > 0 ? (
                      partnership.attachment_files.map((item, index) => (
                        <div className="partnership-review-document" key={`${String(item)}-${index}`}>
                          <ScrollText size={18} />
                          <strong>{String(item)}</strong>
                        </div>
                      ))
                    ) : (
                      <div className="partnership-review-document empty">
                        <ScrollText size={18} />
                        <strong>Belum ada lampiran terbaca</strong>
                      </div>
                    )}
                  </div>
                </article>
              </div>

              <aside className={`partnership-review-action-panel status-${statusMeta.tone}`}>
                <div className="partnership-status-card-header">
                  <div className="partnership-status-card-icon">
                    {statusMeta.tone === "active" ? (
                      <CheckCircle2 size={24} />
                    ) : statusMeta.tone === "rejected" || statusMeta.tone === "cancelled" ? (
                      <XCircle size={24} />
                    ) : (
                      <ShieldCheck size={24} />
                    )}
                  </div>

                  <div>
                    <span>Status Pengajuan</span>
                    <strong>{statusMeta.label}</strong>
                  </div>
                </div>

                <p className="partnership-status-description">{statusMeta.description}</p>

                <div className="partnership-action-summary">
                  <div>
                    <span>Pengaju</span>
                    <strong>{requesterName}</strong>
                  </div>
                  <div>
                    <span>Tujuan</span>
                    <strong>{receiverName}</strong>
                  </div>
                  <div>
                    <span>Tanggal</span>
                    <strong>{formatDate(submittedAt)}</strong>
                  </div>
                  <div>
                    <span>ID</span>
                    <strong>#{requestCode}</strong>
                  </div>
                </div>

                <div className="partnership-status-next-step">
                  <ClipboardCheck size={17} />
                  <p>{statusMeta.nextStep}</p>
                </div>

                {isReceiver && canReceiverReview(status) ? (
                  <div className="partnership-review-actions">
                    <button
                      type="button"
                      className="partnership-apply-button"
                      onClick={handleContinueApproval}
                    >
                      Lanjut ke Persetujuan
                      <CheckCircle2 size={17} />
                    </button>

                    <button
                      type="button"
                      className="partnership-danger-button"
                      onClick={() => setShowRejectModal(true)}
                    >
                      Tolak Pengajuan
                      <XCircle size={17} />
                    </button>
                  </div>
                ) : (
                  <p className="partnership-review-note">
                    {isRequester
                      ? "Anda adalah pengaju. Keputusan hanya dapat dilakukan oleh pihak tujuan kemitraan."
                      : "Pengajuan ini tidak berada pada status yang memerlukan tindakan review."}
                  </p>
                )}
              </aside>
            </section>
          </>
        )}

        {showRejectModal ? (
          <div className="partnership-modal-backdrop" role="presentation" onClick={() => setShowRejectModal(false)}>
            <section
              className="partnership-reject-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="reject-title"
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <XCircle size={24} />
                <div>
                  <h2 id="reject-title">Tolak Pengajuan?</h2>
                  <p>Berikan alasan agar pengaju memahami keputusan review.</p>
                </div>
              </header>

              <label>
                <span>Alasan Penolakan</span>
                <select
                  value={rejectionReason}
                  onChange={(event) => {
                    setRejectionReason(event.target.value);
                    setRejectionError("");
                  }}
                >
                  <option value="">Pilih alasan...</option>
                  {REJECTION_REASONS.map((reason) => (
                    <option value={reason.value} key={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Keterangan Tambahan</span>
                <textarea
                  value={rejectionNotes}
                  onChange={(event) => setRejectionNotes(event.target.value)}
                  rows={4}
                  placeholder="Tambahkan catatan opsional..."
                />
              </label>

              {rejectionError ? <p className="partnership-modal-error">{rejectionError}</p> : null}

              <footer>
                <button
                  type="button"
                  className="umkm-secondary-btn"
                  disabled={submitting}
                  onClick={() => setShowRejectModal(false)}
                >
                  Kembali
                </button>

                <button type="button" disabled={submitting} onClick={handleReject}>
                  {submitting ? "Memproses..." : "Konfirmasi Tolak"}
                </button>
              </footer>
            </section>
          </div>
        ) : null}
      </main>
    </UmkmLayout>
  );
}
