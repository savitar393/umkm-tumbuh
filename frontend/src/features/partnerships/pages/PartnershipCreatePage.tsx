import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  Handshake,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import { partnershipsApi } from "../api";
import type { CreatePartnershipRequest } from "../types";

type FileKey = "nib_ktp" | "pdf_kemitraan" | "sertifikat";

type FileState = Record<FileKey, string | null>;
type FileErrors = Partial<Record<FileKey, string>>;

type UploadCardProps = {
  label: string;
  hint: string;
  optional?: boolean;
  icon: ReactNode;
  value: string | null;
  error?: string;
  onChange: (filename: string | null, error?: string) => void;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

function getBasePath(role?: string) {
  if (role === "MITRA") return "/mitra/partnerships";
  if (role === "UMKM") return "/umkm/partnerships";
  return "/partnerships";
}

function validateContact(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "Kontak person wajib diisi.";

  if (trimmed.includes("@")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
      ? ""
      : "Format email tidak valid.";
  }

  const digits = trimmed.replace(/\D/g, "");

  if (digits.startsWith("08") && digits.length >= 10 && digits.length <= 13) return "";
  if (digits.startsWith("62") && digits.length >= 11 && digits.length <= 15) return "";

  return "Nomor WhatsApp harus diawali 08 atau 62 dan berisi 10–15 digit.";
}

function getFileValidationError(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    return "File terlalu besar. Maksimal 10MB.";
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return "Hanya file PDF, JPG, dan PNG yang diperbolehkan.";
  }

  return "";
}

function UploadCard({ label, hint, optional, icon, value, error, onChange }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const validationError = getFileValidationError(file);

    if (validationError) {
      onChange(null, validationError);
      event.target.value = "";
      return;
    }

    onChange(file.name);
  }

  return (
    <div
      className={`partnership-upload-card ${value ? "has-file" : ""} ${error ? "has-error" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFile}
      />

      <div className="partnership-upload-icon">{value ? <CheckCircle2 size={26} /> : icon}</div>

      <strong>
        {value || label}
        {optional && !value ? <span>Opsional</span> : null}
      </strong>

      <p>{value ? "Klik untuk mengganti file." : hint}</p>

      {value ? (
        <button
          type="button"
          className="partnership-upload-remove"
          onClick={(event) => {
            event.stopPropagation();
            onChange(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          aria-label={`Hapus ${label}`}
        >
          <X size={15} />
        </button>
      ) : null}

      {error ? <em>{error}</em> : null}
    </div>
  );
}

export default function PartnershipCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  const isMitra = user?.role === "MITRA";
  const basePath = getBasePath(user?.role);

  const params = new URLSearchParams(location.search);
  const preselectedReceiverId = params.get("receiver_id") || "";
  const isFromDetail = Boolean(preselectedReceiverId);

  const [partnerList, setPartnerList] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [partnerError, setPartnerError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPartnerName, setSelectedPartnerName] = useState("");

  const [formData, setFormData] = useState({
    receiver_id: preselectedReceiverId,
    business_name: user?.full_name || "",
    contact_person: user?.email || "",
    product_description: "",
    reason_for_partnership: "",
  });

  const [files, setFiles] = useState<FileState>({
    nib_ktp: null,
    pdf_kemitraan: null,
    sertifikat: null,
  });

  const [fileErrors, setFileErrors] = useState<FileErrors>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const targetLabel = isMitra ? "UMKM" : "Mitra";
  const requesterLabel = isMitra ? "Mitra" : "UMKM";

  const filteredList = useMemo(
    () =>
      partnerList.filter((partner) =>
        partner.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [partnerList, searchQuery],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function fetchPartnerList() {
      setLoadingPartners(true);
      setPartnerError("");

      try {
        if (isMitra) {
          const response = await partnershipsApi.listUMKM({ page: 1, limit: 100 });

          if (!ignore) {
            setPartnerList((response.umkm ?? []).map((item) => ({ id: item.id, name: item.name })));
          }

          return;
        }

        const response = await partnershipsApi.listMitra({ page: 1, limit: 100 });

        if (!ignore) {
          setPartnerList((response.mitra ?? []).map((item) => ({ id: item.id, name: item.name })));
        }
      } catch (err) {
        if (!ignore) {
          setPartnerError(err instanceof Error ? err.message : "Gagal memuat daftar tujuan.");
        }
      } finally {
        if (!ignore) setLoadingPartners(false);
      }
    }

    fetchPartnerList();

    return () => {
      ignore = true;
    };
  }, [isMitra]);

  useEffect(() => {
    if (!preselectedReceiverId || partnerList.length === 0) return;

    const found = partnerList.find((partner) => partner.id === preselectedReceiverId);

    if (found) setSelectedPartnerName(found.name);
  }, [partnerList, preselectedReceiverId]);

  function updateField(name: keyof typeof formData, value: string) {
    setSubmitError("");

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function handleSelectPartner(id: string, name: string) {
    updateField("receiver_id", id);
    setSelectedPartnerName(name);
    setSearchQuery("");
    setShowDropdown(false);
  }

  function handleFileChange(key: FileKey) {
    return (filename: string | null, error?: string) => {
      setSubmitError("");

      if (error) {
        setFiles((current) => ({ ...current, [key]: null }));
        setFileErrors((current) => ({ ...current, [key]: error }));
        return;
      }

      setFiles((current) => ({ ...current, [key]: filename }));
      setFileErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    };
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    const nextFileErrors: FileErrors = {};

    if (!formData.business_name.trim()) {
      nextErrors.business_name = `Nama ${requesterLabel.toLowerCase()} wajib diisi.`;
    }

    const contactError = validateContact(formData.contact_person);
    if (contactError) nextErrors.contact_person = contactError;

    if (!formData.receiver_id) {
      nextErrors.receiver_id = `Pilih ${targetLabel.toLowerCase()} tujuan.`;
    }

    if (formData.product_description.trim().length < 20) {
      nextErrors.product_description = "Deskripsi produk/profil minimal 20 karakter.";
    }

    if (formData.reason_for_partnership.trim().length < 20) {
      nextErrors.reason_for_partnership = "Alasan bermitra minimal 20 karakter.";
    }

    if (!files.nib_ktp) {
      nextFileErrors.nib_ktp = "Dokumen NIB/KTP wajib dilampirkan.";
    }

    if (!files.pdf_kemitraan) {
      nextFileErrors.pdf_kemitraan = "Dokumen pengajuan kemitraan wajib dilampirkan.";
    }

    setErrors(nextErrors);
    setFileErrors(nextFileErrors);

    return Object.keys(nextErrors).length === 0 && Object.keys(nextFileErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    if (!validate()) {
      requestAnimationFrame(() => {
        document
          .querySelector(".partnership-create-field.has-error, .partnership-upload-card.has-error")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      return;
    }

    setLoading(true);

    try {
      const attachments = [files.nib_ktp, files.pdf_kemitraan, files.sertifikat].filter(Boolean) as string[];

      const payload: CreatePartnershipRequest = {
        receiver_id: formData.receiver_id,
        proposal_title: `Pengajuan Kemitraan - ${formData.business_name.trim()}`,
        proposal_description: [
          formData.product_description.trim(),
          `Alasan Bermitra: ${formData.reason_for_partnership.trim()}`,
        ].join("\n\n"),
        attachment_files: attachments,
      };

      const response = await partnershipsApi.create(payload);

      if (response.success === true && response.data?.pengajuanID) {
        navigate(`${basePath}/success?id=${response.data.pengajuanID}`, {
          state: { pengajuanID: response.data.pengajuanID },
        });
        return;
      }

      setSubmitError(response.message || "Gagal mengirim pengajuan.");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal mengirim pengajuan.");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    if (!window.confirm("Batalkan pengajuan? Data yang sudah diisi akan hilang.")) return;

    if (isFromDetail && preselectedReceiverId) {
      navigate(`${basePath}/${preselectedReceiverId}`);
      return;
    }

    navigate(basePath);
  }

  return (
    <UmkmLayout
      title="Ajukan Kemitraan"
      subtitle={`Lengkapi formulir untuk mengajukan kerja sama dengan ${targetLabel.toLowerCase()} pilihan.`}
    >
      <main className="partnership-create-page">
        <button
          className="partnership-back-button"
          type="button"
          onClick={() => (isFromDetail ? navigate(`${basePath}/${preselectedReceiverId}`) : navigate(basePath))}
        >
          <ArrowLeft size={17} />
          {isFromDetail ? "Kembali ke Detail" : "Kembali ke Daftar"}
        </button>

        <section className="partnership-create-hero">
          <div>
            <span className="partnership-eyebrow">
              <Handshake size={16} />
              Formulir Pengajuan
            </span>
            <h1>Pengajuan Kemitraan</h1>
            <p>
              {isFromDetail
                ? `Anda akan mengajukan kemitraan dengan ${selectedPartnerName || `${targetLabel.toLowerCase()} terpilih`}.`
                : `Pilih ${targetLabel.toLowerCase()} tujuan, lengkapi profil pengajuan, lalu lampirkan dokumen pendukung.`}
            </p>
          </div>

          <aside className="partnership-create-progress">
            <strong>3 langkah</strong>
            <span>Pilih tujuan → Isi profil → Lampirkan dokumen</span>
          </aside>
        </section>

        <form className="partnership-create-layout" onSubmit={handleSubmit} noValidate>
          <section className="partnership-create-card">
            <h2>
              <UserRound size={20} />
              Informasi Pengaju
            </h2>

            <div className="partnership-create-grid">
              <label className={`partnership-create-field ${errors.business_name ? "has-error" : ""}`}>
                <span>Nama {requesterLabel}</span>
                <input
                  name="business_name"
                  value={formData.business_name}
                  onChange={(event) => updateField("business_name", event.target.value)}
                  placeholder={`Masukkan nama ${requesterLabel.toLowerCase()}`}
                />
                {errors.business_name ? <em>{errors.business_name}</em> : null}
              </label>

              <label className={`partnership-create-field ${errors.contact_person ? "has-error" : ""}`}>
                <span>Kontak Person</span>
                <input
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={(event) => updateField("contact_person", event.target.value)}
                  placeholder="081234567890 atau email@usaha.com"
                />
                {errors.contact_person ? <em>{errors.contact_person}</em> : null}
              </label>
            </div>
          </section>

          <section className="partnership-create-card">
            <h2>
              <Building2 size={20} />
              Tujuan Kemitraan
            </h2>

            <div className={`partnership-create-field ${errors.receiver_id ? "has-error" : ""}`}>
              <span>{targetLabel} Tujuan</span>

              {isFromDetail ? (
                <div className="partnership-readonly-target">
                  <ShieldCheck size={18} />
                  <strong>{selectedPartnerName || "Memuat tujuan..."}</strong>
                </div>
              ) : (
                <div className="partnership-select-search" ref={dropdownRef}>
                  <Search size={18} />
                  <input
                    value={searchQuery || selectedPartnerName}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSearchQuery(value);
                      setShowDropdown(true);

                      if (!value) {
                        setSelectedPartnerName("");
                        updateField("receiver_id", "");
                      }
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={
                      loadingPartners
                        ? "Memuat data..."
                        : partnerError
                          ? "Gagal memuat data"
                          : `Cari ${targetLabel.toLowerCase()}...`
                    }
                  />

                  {showDropdown ? (
                    <div className="partnership-select-dropdown">
                      {loadingPartners ? (
                        <p>Memuat data...</p>
                      ) : partnerError ? (
                        <p>{partnerError}</p>
                      ) : filteredList.length === 0 ? (
                        <p>Tidak ditemukan</p>
                      ) : (
                        filteredList.map((partner) => (
                          <button
                            type="button"
                            key={partner.id}
                            onClick={() => handleSelectPartner(partner.id, partner.name)}
                          >
                            {partner.name}
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {errors.receiver_id ? <em>{errors.receiver_id}</em> : null}
            </div>
          </section>

          <section className="partnership-create-card">
            <h2>
              <FileText size={20} />
              Detail Pengajuan
            </h2>

            <label className={`partnership-create-field ${errors.product_description ? "has-error" : ""}`}>
              <span>Deskripsi Produk / Profil</span>
              <textarea
                name="product_description"
                value={formData.product_description}
                onChange={(event) => updateField("product_description", event.target.value)}
                rows={5}
                placeholder={
                  isMitra
                    ? "Jelaskan program, jaringan, atau bentuk dukungan yang ingin ditawarkan kepada UMKM..."
                    : "Ceritakan produk utama, keunggulan usaha, kapasitas produksi, dan kebutuhan pengembangan..."
                }
              />
              {errors.product_description ? <em>{errors.product_description}</em> : null}
            </label>

            <label className={`partnership-create-field ${errors.reason_for_partnership ? "has-error" : ""}`}>
              <span>Alasan Ingin Bermitra</span>
              <textarea
                name="reason_for_partnership"
                value={formData.reason_for_partnership}
                onChange={(event) => updateField("reason_for_partnership", event.target.value)}
                rows={4}
                placeholder={`Jelaskan alasan memilih ${targetLabel.toLowerCase()} ini dan bentuk kolaborasi yang diharapkan...`}
              />
              {errors.reason_for_partnership ? <em>{errors.reason_for_partnership}</em> : null}
            </label>
          </section>

          <section className="partnership-create-card">
            <h2>
              <Paperclip size={20} />
              Dokumen Pendukung
            </h2>

            <p className="partnership-create-note">
              Upload dokumen masih berupa validasi dan pencatatan nama file sesuai implementasi branch saat ini.
              Integrasi upload document-service/Garage bisa dikerjakan setelah flow pengajuan stabil.
            </p>

            <div className="partnership-upload-grid">
              <UploadCard
                label="NIB / KTP"
                hint="PDF, JPG, PNG · Maks. 10MB"
                icon={<UploadCloud size={28} />}
                value={files.nib_ktp}
                onChange={handleFileChange("nib_ktp")}
                error={fileErrors.nib_ktp}
              />

              <UploadCard
                label="Dokumen Pengajuan"
                hint="PDF, JPG, PNG · Maks. 10MB"
                icon={<FileText size={28} />}
                value={files.pdf_kemitraan}
                onChange={handleFileChange("pdf_kemitraan")}
                error={fileErrors.pdf_kemitraan}
              />

              <UploadCard
                label="Sertifikat Halal/PIRT"
                hint="Opsional jika tersedia"
                optional
                icon={<ShieldCheck size={28} />}
                value={files.sertifikat}
                onChange={handleFileChange("sertifikat")}
                error={fileErrors.sertifikat}
              />
            </div>
          </section>

          {submitError ? (
            <div className="partnership-submit-error">
              <strong>Pengajuan gagal dikirim</strong>
              <p>{submitError}</p>
            </div>
          ) : null}

          <section className="partnership-create-actions">
            <button type="button" className="umkm-secondary-btn" onClick={handleCancel}>
              Batalkan
            </button>

            <button type="submit" disabled={loading}>
              {loading ? "Mengirim..." : "Kirim Pengajuan"}
              <Send size={17} />
            </button>
          </section>
        </form>
      </main>
    </UmkmLayout>
  );
}
