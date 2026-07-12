import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  Handshake,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import { partnershipsApi } from "../api";

type PartnershipDetail = Record<string, unknown>;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

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

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
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

  if (!status) return "-";
  return labels[status] ?? status;
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

function splitProposalDescription(value: string) {
  const [descriptionPart, reasonPart] = value.split(/\n\s*\nAlasan Bermitra:\s*/i);

  return {
    description: descriptionPart?.trim() || value,
    reason: reasonPart?.trim() || "",
  };
}

function validateSignedFile(file: File) {
  if (file.size > MAX_FILE_SIZE) return "File terlalu besar. Maksimal 10MB.";
  if (!ALLOWED_FILE_TYPES.includes(file.type)) return "Hanya file PDF, JPG, dan PNG yang diperbolehkan.";
  return "";
}

function downloadContractDraft(partnership: PartnershipDetail) {
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const requesterName = getText(partnership, ["requester_name", "business_name", "pengirim"], "____________________");
  const receiverName = getText(partnership, ["receiver_name", "mitraUmkmTujuan"], "____________________");
  const requestCode = getText(partnership, ["request_code", "pengajuanID", "id"], "____________________");
  const proposalTitle = getText(partnership, ["proposal_title", "proposalTitle"], "Pengajuan Kemitraan");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Draf Kontrak Kemitraan - ${requestCode}</title>
<style>
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; margin: 2.5cm; line-height: 1.6; }
  h1 { text-align: center; font-size: 16pt; margin-bottom: 20pt; text-transform: uppercase; }
  h2 { font-size: 14pt; margin-top: 18pt; margin-bottom: 8pt; }
  p { text-align: justify; margin: 8pt 0; }
  table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
  td { padding: 6pt 10pt; border: 1px solid #000; vertical-align: top; }
  .label { font-weight: bold; width: 32%; }
  .ttd { margin-top: 40pt; }
  .ttd td { border: none; text-align: center; width: 50%; }
  .center { text-align: center; }
</style>
</head>
<body>
  <h1>Draf Kontrak Kemitraan</h1>
  <p class="center">Nomor: ${requestCode}</p>
  <p class="center">Tanggal: ${today}</p>

  <p>Pada hari ini, para pihak sepakat untuk menjalin kerja sama berdasarkan proposal:</p>
  <p><strong>${proposalTitle}</strong></p>

  <table>
    <tr><td class="label">Pihak Pertama</td><td>${requesterName}</td></tr>
    <tr><td class="label">Pihak Kedua</td><td>${receiverName}</td></tr>
    <tr><td class="label">Kode Pengajuan</td><td>${requestCode}</td></tr>
  </table>

  <h2>Pasal 1 - Ruang Lingkup</h2>
  <p>Para pihak sepakat untuk menjalin kerja sama dalam pengembangan usaha, perluasan pasar, pendampingan, dan/atau bentuk dukungan lain sesuai kebutuhan yang telah diajukan.</p>

  <h2>Pasal 2 - Hak dan Kewajiban</h2>
  <p>Pihak pengaju wajib menyediakan informasi yang benar dan melaporkan perkembangan kerja sama secara berkala. Pihak penerima wajib memberikan dukungan sesuai ruang lingkup kerja sama yang disepakati.</p>

  <h2>Pasal 3 - Jangka Waktu</h2>
  <p>Kerja sama berlaku sejak dokumen ini ditandatangani dan dapat diperbarui sesuai kesepakatan para pihak.</p>

  <h2>Pasal 4 - Penutup</h2>
  <p>Dokumen ini dibuat sebagai dasar persetujuan kemitraan pada sistem UMKM Tumbuh.</p>

  <table class="ttd">
    <tr>
      <td><br><br><br>(${requesterName})<br><em>Pihak Pertama</em></td>
      <td><br><br><br>(${receiverName})<br><em>Pihak Kedua</em></td>
    </tr>
  </table>
</body>
</html>`;

  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `Draf_Kontrak_Kemitraan_${requestCode}.doc`;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`partnership-status-badge ${getStatusClass(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

export default function PartnershipApprovalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const basePath = getBasePath(user?.role, location.pathname);

  const [partnership, setPartnership] = useState<PartnershipDetail | null>(null);
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [documentUrl, setDocumentUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [error, setError] = useState("");

  const requestCode = getText(partnership, ["request_code", "pengajuanID", "id"], id ?? "-");
  const requesterName = getText(partnership, ["requester_name", "business_name", "pengirim"], "Pengaju");
  const receiverName = getText(partnership, ["receiver_name", "mitraUmkmTujuan"], "Tujuan Kemitraan");
  const rawProposalTitle = getText(partnership, ["proposal_title", "proposalTitle"], "");
  const proposalTitle =
    rawProposalTitle && !rawProposalTitle.includes("Alasan Bermitra:")
      ? rawProposalTitle
      : `Finalisasi Kemitraan ${requesterName} dan ${receiverName}`;
  const proposalDescription = getText(partnership, ["proposal_description", "proposalDescription"], "");
  const status = getText(partnership, ["status", "statusPengajuan", "status_pengajuan"], "");
  const submittedAt = partnership?.submitted_at ?? partnership?.tanggalPengajuan ?? partnership?.created_at;
  const parsedProposal = useMemo(() => splitProposalDescription(proposalDescription), [proposalDescription]);

  useEffect(() => {
    if (!id) {
      setError("ID pengajuan tidak ditemukan.");
      setLoading(false);
      return;
    }

    const approvalId = id;
    let ignore = false;

    async function fetchPartnership() {
      setLoading(true);
      setError("");

      try {
        const response = await partnershipsApi.getDetail(approvalId);

        if (ignore) return;

        if (response.success === true && response.data) {
          const data = response.data;
          setPartnership(data);

          const contractDocumentId =
            typeof data.contract_document_id === "string" ? data.contract_document_id : "";

          if (contractDocumentId) {
            try {
              const docResp = await partnershipsApi.getDocumentUrl(contractDocumentId);

              if (!ignore && docResp.data?.url) {
                setDocumentUrl(docResp.data.url);
              }
            } catch {
              // Existing document preview is optional.
            }
          }

          return;
        }

        setError(response.message || "Data pengajuan tidak ditemukan.");
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Gagal memuat data persetujuan.");
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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const validationError = validateSignedFile(file);

    if (validationError) {
      setSignedFile(null);
      setUploadError(validationError);
      event.target.value = "";
      return;
    }

    setSignedFile(file);
    setUploadError("");
  }

  async function handleApprove() {
    if (!id) return;

    if (!signedFile && !documentUrl) {
      setUploadError("Unggah dokumen kontrak yang sudah ditandatangani terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setUploadError("");
    setError("");

    try {
      if (signedFile) {
        const documentId = await partnershipsApi.uploadDocument(signedFile);
        await partnershipsApi.sign(id, documentId);
      }

      await partnershipsApi.approve(id);

      navigate(`${basePath}/approve/success?id=${id}`, {
        state: { pengajuanID: id },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyetujui pengajuan.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    if (id) {
      navigate(`${basePath}/review/${id}`);
      return;
    }

    navigate(`${basePath}/inbox`);
  }

  return (
    <UmkmLayout
      title="Persetujuan Kemitraan"
      subtitle="Unggah dokumen kontrak yang sudah ditandatangani untuk mengaktifkan kemitraan."
    >
      <main className="partnership-approval-page">
        <button className="partnership-back-button" type="button" onClick={handleBack}>
          <ArrowLeft size={17} />
          Kembali ke Review
        </button>

        {loading ? (
          <section className="partnership-state-card">
            <div className="partnership-spinner" />
            <p>Memuat data persetujuan...</p>
          </section>
        ) : error && !partnership ? (
          <section className="partnership-state-card error">
            <strong>Data persetujuan tidak ditemukan</strong>
            <p>{error}</p>
            <button type="button" onClick={handleBack}>
              Kembali
            </button>
          </section>
        ) : partnership ? (
          <>
            <section className="partnership-approval-hero">
              <div>
                <span className="partnership-eyebrow">
                  <ShieldCheck size={16} />
                  Tahap Persetujuan
                </span>

                <h1>{proposalTitle}</h1>

                <div className="partnership-review-chip-row">
                  <span>#{requestCode}</span>
                  <StatusBadge status={status} />
                </div>
              </div>

              <aside className="partnership-approval-hero-card">
                <FileCheck2 size={32} />
                <strong>Finalisasi</strong>
                <span>Upload kontrak bertanda tangan</span>
              </aside>
            </section>

            <section className="partnership-approval-layout">
              <div className="partnership-approval-main">
                <article className="partnership-review-card">
                  <h2>
                    <Handshake size={20} />
                    Ringkasan Kemitraan
                  </h2>

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
                      <span>Tanggal Pengajuan</span>
                      <strong>{formatDate(submittedAt)}</strong>
                    </div>
                    <div>
                      <span>ID</span>
                      <strong>#{requestCode}</strong>
                    </div>
                  </div>
                </article>

                <article className="partnership-review-card">
                  <h2>
                    <FileText size={20} />
                    Isi Proposal
                  </h2>

                  <p>{parsedProposal.description || "Deskripsi pengajuan belum tersedia."}</p>

                  {parsedProposal.reason ? (
                    <div className="partnership-approval-reason">
                      <strong>Alasan Bermitra</strong>
                      <p>{parsedProposal.reason}</p>
                    </div>
                  ) : null}
                </article>

                <article className="partnership-review-card">
                  <h2>
                    <Download size={20} />
                    Draf Kontrak
                  </h2>

                  <p className="partnership-review-note">
                    Unduh draf kontrak, tandatangani di luar sistem, lalu unggah kembali file yang sudah ditandatangani.
                  </p>

                  <button
                    type="button"
                    className="partnership-template-button"
                    onClick={() => downloadContractDraft(partnership)}
                  >
                    <Download size={17} />
                    Download Draf Kontrak
                  </button>
                </article>
              </div>

              <aside className="partnership-approval-panel">
                <div className="partnership-action-panel__header">
                  <UploadCloud size={24} />
                  <div>
                    <span>Dokumen Final</span>
                    <strong>Kontrak Ditandatangani</strong>
                  </div>
                </div>

                <div
                  className={`partnership-approval-upload ${signedFile || documentUrl ? "has-file" : ""} ${
                    uploadError ? "has-error" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />

                  {signedFile || documentUrl ? <CheckCircle2 size={34} /> : <UploadCloud size={34} />}

                  <strong>
                    {signedFile?.name || (documentUrl ? "Dokumen kontrak sudah tersedia" : "Upload Kontrak")}
                  </strong>

                  <p>
                    {signedFile || documentUrl
                      ? "Klik untuk mengganti dokumen."
                      : "PDF, JPG, atau PNG. Maksimal 10MB."}
                  </p>

                  {signedFile ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSignedFile(null);
                        setUploadError("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      aria-label="Hapus dokumen"
                    >
                      <X size={15} />
                    </button>
                  ) : null}
                </div>

                {uploadError ? <p className="partnership-upload-error">{uploadError}</p> : null}
                {error ? <p className="partnership-upload-error">{error}</p> : null}

                <div className="partnership-approval-checklist">
                  <div className="done">
                    <CheckCircle2 size={17} />
                    <span>Draf kontrak dapat diunduh</span>
                  </div>
                  <div className={signedFile || documentUrl ? "done" : ""}>
                    <CheckCircle2 size={17} />
                    <span>Dokumen final dilampirkan</span>
                  </div>
                  <div>
                    <CheckCircle2 size={17} />
                    <span>Persetujuan akan mengaktifkan kemitraan</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="partnership-apply-button"
                  disabled={submitting}
                  onClick={handleApprove}
                >
                  {submitting ? "Memproses..." : "Setujui & Aktifkan"}
                  <ShieldCheck size={17} />
                </button>
              </aside>
            </section>
          </>
        ) : null}
      </main>
    </UmkmLayout>
  );
}
