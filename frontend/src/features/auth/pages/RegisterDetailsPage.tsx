import {
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type MouseEvent,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowLeft, ArrowRight, Bell, HelpCircle, Upload, UserCircle, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import {
  getRegistrationProfile,
  getRegistrationFlowStatus,
  saveMitraRegistrationDetails,
  saveUmkmRegistrationDetails,
  uploadRegistrationDocument,
  type RegistrationDocumentCategory,
} from "../api";

type RegisterDetailRole = "umkm" | "mitra";

const MB = 1024 * 1024;

const uploadRules = {
  umkmPhoto: {
    label: "Foto usaha",
    maxBytes: 2 * MB,
    allowedTypes: ["image/jpeg", "image/png"],
    allowedLabel: "JPG/PNG",
    accept: "image/jpeg,image/png",
  },
  umkmLegal: {
    label: "Dokumen pendukung",
    maxBytes: 2 * MB,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    allowedLabel: "PDF/JPG/PNG",
    accept: "application/pdf,image/jpeg,image/png",
  },
  mitraLegal: {
    label: "Legalitas perusahaan",
    maxBytes: 5 * MB,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    allowedLabel: "PDF/JPG/PNG",
    accept: "application/pdf,image/jpeg,image/png",
  },
  mitraCommitment: {
    label: "Surat komitmen",
    maxBytes: 2 * MB,
    allowedTypes: ["application/pdf"],
    allowedLabel: "PDF",
    accept: "application/pdf",
  },
  mitraCompanyProfile: {
    label: "Profil perusahaan",
    maxBytes: 10 * MB,
    allowedTypes: ["application/pdf"],
    allowedLabel: "PDF",
    accept: "application/pdf",
  },
} as const;

const UMKM_CATEGORY_OPTIONS = [
  { value: "KULINER", label: "Makanan dan Minuman" },
  { value: "DIGITAL", label: "Produk Digital" },
  { value: "FASHION", label: "Fashion dan Tekstil" },
  { value: "JASA", label: "Jasa Kreatif" },
  { value: "PERDAGANGAN", label: "Perdagangan Eceran" },
  { value: "KERAJINAN", label: "Kerajinan Tangan" },
  { value: "AGRIBISNIS", label: "Pertanian Olahan" },
  { value: "KECANTIKAN", label: "Kecantikan dan Perawatan" },
  { value: "EDUKASI", label: "Edukasi" },
  { value: "KESEHATAN", label: "Kesehatan" },
  { value: "OTOMOTIF", label: "Otomotif" },
  { value: "KRIYA", label: "Kriya" },
] as const;

const uploadCategoryByKey: Record<UploadKey, RegistrationDocumentCategory> = {
  umkmPhoto: "PRODUCT_IMAGE",
  umkmLegal: "GENERAL_DOCUMENT",
  mitraLegal: "CERTIFICATE",
  mitraCommitment: "PARTNERSHIP_FILE",
  mitraCompanyProfile: "GENERAL_DOCUMENT",
};

type UploadKey = keyof typeof uploadRules;

function formatMb(bytes: number) {
  return `${Math.round(bytes / MB)}MB`;
}

function validateUploadFile(field: UploadKey, file: File) {
  const rule = uploadRules[field];

  if (!(rule.allowedTypes as readonly string[]).includes(file.type)) {
    return `${rule.label} harus berformat ${rule.allowedLabel}.`;
  }

  if (file.size > rule.maxBytes) {
    return `${rule.label} terlalu besar. Maksimal ${formatMb(rule.maxBytes)}.`;
  }

  return "";
}

function onlyDigits(value: string, maxLength?: number) {
  const digits = value.replace(/\D/g, "");
  return typeof maxLength === "number" ? digits.slice(0, maxLength) : digits;
}

type UploadState = {
  file: File | null;
  documentId: string | null;
  uploading: boolean;
  error: string;
};

const initialUpload: UploadState = {
  file: null,
  documentId: null,
  uploading: false,
  error: "",
};

function normalizePhone(value?: string | null) {
  if (!value) return "";
  return value.replace(/^\+?62/, "").replace(/^0/, "").replace(/\D/g, "");
}

function stringValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function registrationDraftKey(role: RegisterDetailRole, accountID?: string) {
  return accountID ? `registration-details:${role}:${accountID}` : "";
}

function readRegistrationDraft(key: string) {
  if (!key) return null;

  try {
    return JSON.parse(sessionStorage.getItem(key) || "null") as {
      umkmForm?: Record<string, unknown>;
      mitraForm?: Record<string, unknown>;
      uploads?: Record<string, { documentId?: string | null }>;
    } | null;
  } catch {
    return null;
  }
}

function writeRegistrationDraft(
  key: string,
  value: {
    umkmForm?: Record<string, unknown>;
    mitraForm?: Record<string, unknown>;
    uploads?: Record<string, { documentId?: string | null }>;
  },
) {
  if (!key) return;
  sessionStorage.setItem(key, JSON.stringify(value));
}

function uploadStateWithDocumentId(current: UploadState, documentId?: string | null): UploadState {
  if (!documentId) return current;

  return {
    ...current,
    documentId,
    uploading: false,
    error: "",
  };
}

export default function RegisterDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentUserID = currentUser?.id ?? "";
  const currentUserRole = currentUser?.role ?? "";

  const role = useMemo<RegisterDetailRole>(() => {
    return params.role === "mitra" ? "mitra" : "umkm";
  }, [params.role]);

  const draftKey = useMemo(() => {
    return registrationDraftKey(role, currentUserID);
  }, [role, currentUserID]);

  const [checkingFlowStatus, setCheckingFlowStatus] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role !== "UMKM" && currentUser.role !== "MITRA") {
      setCheckingFlowStatus(false);
      return;
    }

    let cancelled = false;

    async function checkFlowStatus() {
      try {
        const flowStatus = await getRegistrationFlowStatus();

        if (cancelled) return;

        if (
          flowStatus.next_route === "/register/pending" ||
          flowStatus.next_route === "/register/rejected" ||
          flowStatus.next_route === "/umkm" ||
          flowStatus.next_route === "/mitra"
        ) {
          navigate(flowStatus.next_route, { replace: true });
          return;
        }
      } catch {
        // Keep details page usable if status check fails.
      } finally {
        if (!cancelled) {
          setCheckingFlowStatus(false);
        }
      }
    }

    checkFlowStatus();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.role, navigate]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [loadingExistingProfile, setLoadingExistingProfile] = useState(false);

  const [umkmForm, setUmkmForm] = useState({
    namaUmkm: "",
    nikPemilik: currentUser?.nik ?? "",
    namaPemilik: currentUser?.full_name ?? "",
    phone: normalizePhone(currentUser?.phone_number),
    kategoriUsaha: "",
    deskripsiUsaha: "",
    alamatUsaha: "",
    kotaKabupaten: "",
    provinsi: "",
    produkUtama: "",
  });

  const [mitraForm, setMitraForm] = useState({
    namaOrganisasi: "",
    jenisMitra: "",
    nib: "",
    npwp: "",
    namaPic: currentUser?.full_name ?? "",
    jabatanPic: "",
    emailPic: currentUser?.email ?? "",
    phonePic: normalizePhone(currentUser?.phone_number),
    alamatKantor: "",
    kotaKabupaten: "",
    provinsi: "",
    bidangKemitraan: "",
    wilayahOperasional: "",
    jenisDukungan: "",
    skalaKerjaSama: "",
    deskripsiTujuan: "",
  });

  const [uploads, setUploads] = useState<Record<UploadKey, UploadState>>({
    umkmPhoto: { ...initialUpload },
    umkmLegal: { ...initialUpload },
    mitraLegal: { ...initialUpload },
    mitraCommitment: { ...initialUpload },
    mitraCompanyProfile: { ...initialUpload },
  });

  useEffect(() => {
    if (!currentUserID) {
      navigate("/login", { replace: true });
      return;
    }

    if (role === "umkm" && currentUserRole !== "UMKM") {
      navigate("/register/mitra/details", { replace: true });
    }

    if (role === "mitra" && currentUserRole !== "MITRA") {
      navigate("/register/umkm/details", { replace: true });
    }
  }, [currentUserID, currentUserRole, navigate, role]);

  useEffect(() => {
    if (!currentUserID) return;

    let cancelled = false;

    async function loadExistingProfile() {
      setLoadingExistingProfile(true);

      const draft = readRegistrationDraft(draftKey);
      const draftUploads = draft?.uploads ?? {};

      try {
        const response = await getRegistrationProfile();
        const profile = response.profile;

        if (cancelled) return;

        if (role === "umkm") {
          const draftUmkm = draft?.umkmForm ?? {};

          setUmkmForm((prev) => ({
            ...prev,
            namaUmkm: stringValue(profile.business_name) || prev.namaUmkm,
            nikPemilik: onlyDigits(stringValue(profile.nik), 16) || prev.nikPemilik,
            namaPemilik: stringValue(profile.owner_name) || prev.namaPemilik,
            phone: normalizePhone(stringValue(profile.phone_number)) || prev.phone,
            kategoriUsaha: stringValue(profile.business_category) || prev.kategoriUsaha,
            deskripsiUsaha: stringValue(profile.business_description) || prev.deskripsiUsaha,
            alamatUsaha: stringValue(profile.address) || prev.alamatUsaha,
            kotaKabupaten: stringValue(profile.city) || prev.kotaKabupaten,
            provinsi: stringValue(profile.province) || prev.provinsi,

            // backend currently does not return products from /profiles/me,
            // so keep it from session draft if user came back from review.
            produkUtama: stringValue(draftUmkm.produkUtama) || prev.produkUtama,
          }));

          setUploads((prev) => ({
            ...prev,
            umkmPhoto: uploadStateWithDocumentId(
              prev.umkmPhoto,
              draftUploads.umkmPhoto?.documentId,
            ),
            umkmLegal: uploadStateWithDocumentId(
              prev.umkmLegal,
              draftUploads.umkmLegal?.documentId,
            ),
          }));
        } else {
          const draftMitra = draft?.mitraForm ?? {};

          setMitraForm((prev) => ({
            ...prev,
            namaOrganisasi: stringValue(profile.organization_name) || prev.namaOrganisasi,
            jenisMitra: stringValue(profile.organization_type) || prev.jenisMitra,
            nib: onlyDigits(stringValue(profile.nib), 13) || prev.nib,
            npwp: onlyDigits(stringValue(profile.npwp), 15) || prev.npwp,
            namaPic: stringValue(profile.contact_person) || prev.namaPic,
            jabatanPic: stringValue(profile.contact_person_title) || prev.jabatanPic,
            emailPic: stringValue(profile.email) || prev.emailPic,
            phonePic: normalizePhone(stringValue(profile.phone_number)) || prev.phonePic,
            alamatKantor: stringValue(profile.address) || prev.alamatKantor,
            kotaKabupaten: stringValue(profile.city) || prev.kotaKabupaten,
            provinsi: stringValue(profile.province) || prev.provinsi,
            wilayahOperasional: stringValue(profile.operational_area) || prev.wilayahOperasional,
            skalaKerjaSama: stringValue(profile.cooperation_scale) || prev.skalaKerjaSama,
            deskripsiTujuan: stringValue(profile.description) || prev.deskripsiTujuan,

            // backend does not return these as separate fields yet.
            bidangKemitraan:
              stringValue(profile.partnership_field) ||
              stringValue(draftMitra.bidangKemitraan) ||
              prev.bidangKemitraan,
            jenisDukungan:
              stringValue(profile.support_type) ||
              stringValue(draftMitra.jenisDukungan) ||
              prev.jenisDukungan,
          }));

          setUploads((prev) => ({
            ...prev,
            mitraLegal: uploadStateWithDocumentId(
              prev.mitraLegal,
              draftUploads.mitraLegal?.documentId,
            ),
            mitraCommitment: uploadStateWithDocumentId(
              prev.mitraCommitment,
              draftUploads.mitraCommitment?.documentId,
            ),
            mitraCompanyProfile: uploadStateWithDocumentId(
              prev.mitraCompanyProfile,
              draftUploads.mitraCompanyProfile?.documentId,
            ),
          }));
        }
      } catch {
        // First-time users may not have a profile yet. Keep the form empty.
      } finally {
        if (!cancelled) {
          setLoadingExistingProfile(false);
        }
      }
    }

    loadExistingProfile();

    return () => {
      cancelled = true;
    };
  }, [currentUserID, draftKey, role]);

  function selectFile(key: UploadKey, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setUploads((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          file,
          documentId: null,
          uploading: false,
          error: "",
        },
      }));
      return;
    }

    const validationError = validateUploadFile(key, file);

    setUploads((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        file: validationError ? null : file,
        documentId: null,
        uploading: false,
        error: validationError,
      },
    }));

    if (validationError) {
      event.target.value = "";
    }
  }

  function clearUpload(key: UploadKey) {
    setUploads((prev) => ({
      ...prev,
      [key]: { ...initialUpload },
    }));

    const draft = readRegistrationDraft(draftKey);

    writeRegistrationDraft(draftKey, {
      ...(draft ?? {}),
      uploads: {
        ...(draft?.uploads ?? {}),
        [key]: { documentId: null },
      },
    });
  }

  async function uploadIfNeeded(key: UploadKey) {
    const item = uploads[key];

    if (item?.documentId) return item.documentId;
    if (!item?.file) return null;

    setUploads((prev) => ({
      ...prev,
      [key]: { ...prev[key], uploading: true, error: "" },
    }));

    try {
      const result = await uploadRegistrationDocument(item.file, uploadCategoryByKey[key]);
      const documentId = result.document.id;

      setUploads((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          documentId,
          uploading: false,
          error: "",
        },
      }));

      return documentId;
    } catch (err) {
      const uploadError =
        err instanceof TypeError
          ? "Gagal terhubung ke document-service. Cek koneksi, CORS, atau batas ukuran upload di backend."
          : err instanceof Error
            ? err.message
            : "Gagal mengunggah dokumen.";

      setUploads((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          uploading: false,
          error: uploadError,
        },
      }));

      throw new Error(uploadError);
    }
  }

  function validateUmkmDetails() {
    const requiredUmkmFields: Array<[string, string]> = [
      [umkmForm.namaUmkm, "Nama UMKM wajib diisi."],
      [umkmForm.namaPemilik, "Nama pemilik wajib diisi."],
      [umkmForm.phone, "Nomor WhatsApp wajib diisi."],
      [umkmForm.kategoriUsaha, "Kategori usaha wajib dipilih."],
      [umkmForm.deskripsiUsaha, "Deskripsi usaha wajib diisi."],
      [umkmForm.alamatUsaha, "Alamat usaha wajib diisi."],
      [umkmForm.kotaKabupaten, "Kota/kabupaten wajib diisi."],
      [umkmForm.provinsi, "Provinsi wajib diisi."],
      [umkmForm.produkUtama, "Produk utama wajib diisi."],
    ];

    const missingUmkmField = requiredUmkmFields.find(([value]) => !value.trim());

    if (missingUmkmField) {
      return missingUmkmField[1];
    }

    const validUmkmCategory = UMKM_CATEGORY_OPTIONS.some(
      (option) => option.value === umkmForm.kategoriUsaha
    );

    if (!validUmkmCategory) {
      return "Kategori usaha wajib dipilih dari daftar.";
    }

    if (umkmForm.nikPemilik.length !== 16) {
      return "NIK pemilik wajib 16 digit.";
    }

    if (umkmForm.phone.length < 8 || umkmForm.phone.length > 13) {
      return "Nomor WhatsApp wajib 8–13 digit setelah kode +62.";
    }

    if (!uploads.umkmPhoto.file && !uploads.umkmPhoto.documentId) {
      return "Foto usaha wajib diunggah.";
    }

    if (!uploads.umkmLegal.file && !uploads.umkmLegal.documentId) {
      return "Dokumen pendukung wajib diunggah.";
    }

    return "";
  }

  function validateMitraDetails() {
    const requiredMitraFields: Array<[string, string]> = [
      [mitraForm.namaOrganisasi, "Nama perusahaan/institusi wajib diisi."],
      [mitraForm.jenisMitra, "Jenis mitra wajib dipilih."],
      [mitraForm.namaPic, "Nama PIC wajib diisi."],
      [mitraForm.phonePic, "Nomor WhatsApp PIC wajib diisi."],
      [mitraForm.alamatKantor, "Alamat kantor wajib diisi."],
      [mitraForm.kotaKabupaten, "Kota/kabupaten wajib diisi."],
      [mitraForm.provinsi, "Provinsi wajib diisi."],
      [mitraForm.bidangKemitraan, "Bidang kemitraan wajib dipilih."],
      [mitraForm.wilayahOperasional, "Wilayah operasional wajib diisi."],
      [mitraForm.jenisDukungan, "Jenis dukungan wajib diisi."],
      [mitraForm.skalaKerjaSama, "Skala kerja sama wajib dipilih."],
      [mitraForm.deskripsiTujuan, "Deskripsi tujuan kemitraan wajib diisi."],
    ];

    const missingMitraField = requiredMitraFields.find(([value]) => !value.trim());

    if (missingMitraField) {
      return missingMitraField[1];
    }

    if (mitraForm.phonePic.length < 8 || mitraForm.phonePic.length > 13) {
      return "Nomor WhatsApp PIC wajib 8–13 digit setelah kode +62.";
    }

    if (mitraForm.emailPic.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mitraForm.emailPic.trim())) {
      return "Format email PIC tidak valid.";
    }

    if (mitraForm.nib.trim() && mitraForm.nib.length !== 13) {
      return "NIB perusahaan wajib 13 digit jika diisi.";
    }

    if (mitraForm.npwp.trim() && mitraForm.npwp.length !== 15) {
      return "NPWP Badan wajib 15 digit jika diisi.";
    }

    if (!uploads.mitraLegal.file && !uploads.mitraLegal.documentId) {
      return "Dokumen legalitas perusahaan wajib diunggah.";
    }

    if (!uploads.mitraCommitment.file && !uploads.mitraCommitment.documentId) {
      return "Surat komitmen wajib diunggah.";
    }

    if (!uploads.mitraCompanyProfile.file && !uploads.mitraCompanyProfile.documentId) {
      return "Profil perusahaan wajib diunggah.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    const uploadError = Object.values(uploads).find((item) => item.error)?.error;
    if (uploadError) {
      setError(uploadError);
      return;
    }

    if (role === "umkm") {
      const validationError = validateUmkmDetails();

      if (validationError) {
        setError(validationError);
        return;
      }
    } else {
      const validationError = validateMitraDetails();

      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setSaving(true);

    try {
      if (role === "umkm") {
        const photoDocumentId = await uploadIfNeeded("umkmPhoto");
        const legalDocumentId = await uploadIfNeeded("umkmLegal");

        await saveUmkmRegistrationDetails({
          business_name: umkmForm.namaUmkm.trim(),
          business_category: umkmForm.kategoriUsaha,
          jenis_umkm_id: umkmForm.kategoriUsaha,
          business_description: umkmForm.deskripsiUsaha,
          owner_name: umkmForm.namaPemilik,
          phone_number: `62${umkmForm.phone}`,
          nik: umkmForm.nikPemilik,
          address: umkmForm.alamatUsaha.trim(),
          city: umkmForm.kotaKabupaten.trim(),
          province: umkmForm.provinsi.trim(),
          products: umkmForm.produkUtama,
          photo_document_id: photoDocumentId,
          legal_document_id: legalDocumentId,
        });
        writeRegistrationDraft(draftKey, {
          umkmForm,
          uploads: {
            umkmPhoto: { documentId: photoDocumentId },
            umkmLegal: { documentId: legalDocumentId },
          },
        });
      } else {
        const legalDocumentId = await uploadIfNeeded("mitraLegal");
        const commitmentDocumentId = await uploadIfNeeded("mitraCommitment");
        const companyProfileDocumentId = await uploadIfNeeded("mitraCompanyProfile");

        await saveMitraRegistrationDetails({
          organization_name: mitraForm.namaOrganisasi.trim(),
          organization_type: mitraForm.jenisMitra,
          legal_name: mitraForm.namaOrganisasi.trim(),
          nib: mitraForm.nib,
          npwp: mitraForm.npwp,
          description: mitraForm.deskripsiTujuan,
          support_description: mitraForm.deskripsiTujuan,

          address: mitraForm.alamatKantor.trim(),
          city: mitraForm.kotaKabupaten.trim(),
          province: mitraForm.provinsi.trim(),

          contact_person: mitraForm.namaPic,
          contact_person_title: mitraForm.jabatanPic,
          email: mitraForm.emailPic,
          phone_number: `62${mitraForm.phonePic}`,

          partnership_field: mitraForm.bidangKemitraan,
          operational_area: mitraForm.wilayahOperasional,
          support_type: mitraForm.jenisDukungan,
          cooperation_scale: mitraForm.skalaKerjaSama,

          legal_document_id: legalDocumentId,
          commitment_document_id: commitmentDocumentId,
          company_profile_document_id: companyProfileDocumentId,
        });
        writeRegistrationDraft(draftKey, {
          mitraForm,
          uploads: {
            mitraLegal: { documentId: legalDocumentId },
            mitraCommitment: { documentId: commitmentDocumentId },
            mitraCompanyProfile: { documentId: companyProfileDocumentId },
          },
        });
      }

      navigate(`/register/${role}/review`, {
        state: {
          message: "Data berhasil disimpan. Silakan review pendaftaran Anda.",
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data pendaftaran.");
    } finally {
      setSaving(false);
    }
  }

  if (checkingFlowStatus) {
    return (
      <main className="register-detail-page">
        <section className="register-detail-shell">
          <div className="register-detail-card">
            <p>Memeriksa status pendaftaran...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="register-detail-page">
      <header className="register-detail-navbar">
        <Link to="/" className="register-detail-brand">
          <img src="/tumbuh.png" alt="UMKM Tumbuh" />
          <span>UMKM Tumbuh</span>
        </Link>

        <nav>
          <a href="#">Tentang Kami</a>
          <a href="#">Program</a>
          <i />
          <Bell size={18} />
          <HelpCircle size={18} />
          <div className="register-detail-avatar">
            <UserCircle size={30} />
          </div>
        </nav>
      </header>

      <section className="register-detail-shell">
        <div className="register-detail-top">
          <div>
            <p className="register-detail-breadcrumb">
              Pendaftaran <span>›</span> {role === "mitra" ? "Data Mitra" : "Data UMKM"}
            </p>
            <h1>{role === "mitra" ? "Lengkapi Data Mitra" : "Lengkapi Data Usaha"}</h1>
            <p>
              {role === "mitra"
                ? "Masukkan data organisasi dan informasi kemitraan untuk proses verifikasi."
                : "Masukkan data usaha dan legalitas dasar untuk proses verifikasi."}
            </p>
          </div>

          <span className="register-detail-draft">
            {loadingExistingProfile ? "• Memuat data..." : "• Draft"}
          </span>
        </div>

        <form className="register-detail-form" onSubmit={handleSubmit}>
          {role === "umkm" ? (
            <UmkmFields
              form={umkmForm}
              setForm={setUmkmForm}
              uploads={uploads}
              selectFile={selectFile}
              clearUpload={clearUpload}
            />
          ) : (
            <MitraFields
              form={mitraForm}
              setForm={setMitraForm}
              uploads={uploads}
              selectFile={selectFile}
              clearUpload={clearUpload}
            />
          )}

          {message ? <div className="success-message">{message}</div> : null}
          {error ? <div className="error-message">{error}</div> : null}

          <div className="register-detail-actions">
            <button
              type="button"
              className="register-detail-back"
              onClick={() => navigate("/login")}
            >
              <ArrowLeft size={18} />
              Kembali
            </button>

            <button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Lanjut ke Review"}
              <ArrowRight size={18} />
            </button>
          </div>
        </form>

        <footer>© 2026 UMKM TUMBUH — INDONESIA MAJU MELALUI DIGITALISASI</footer>
      </section>
    </main>
  );
}

function SectionTitle({
  number,
  title,
  icon,
}: {
  number?: number;
  title: string;
  icon?: "line";
}) {
  return (
    <div className="register-detail-section-title">
      {number ? <span>{number}</span> : <i data-line={icon === "line"} />}
      <h2>{title}</h2>
    </div>
  );
}

function UploadBox({
  id,
  label,
  hint,
  value,
  accept,
  onChange,
  onClear,
}: {
  id: string;
  label: string;
  hint: string;
  value: UploadState;
  accept: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasValue = Boolean(value.file || value.documentId);

  function handleClear(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    onClear?.();
  }

  return (
    <label
      className={`register-upload-box ${value.documentId ? "filled" : ""} ${
        value.error ? "invalid" : ""
      }`}
      htmlFor={id}
    >
      {hasValue ? (
        <button
          type="button"
          className="register-upload-clear"
          aria-label={`Hapus ${label}`}
          onClick={handleClear}
        >
          <X size={16} />
        </button>
      ) : null}

      <input ref={inputRef} id={id} type="file" onChange={onChange} accept={accept} />
      <span>
        <Upload size={22} />
      </span>
      <strong>{value.file ? value.file.name : label}</strong>
      <small>
        {value.uploading
          ? "Mengunggah..."
          : value.error
            ? value.error
            : value.documentId
              ? "Dokumen tersimpan"
              : value.file
                ? "Siap diunggah"
                : hint}
      </small>
    </label>
  );
}

function UmkmFields({
  form,
  setForm,
  uploads,
  selectFile,
  clearUpload,
}: {
  form: any;
  setForm: Dispatch<SetStateAction<any>>;
  uploads: Record<string, UploadState>;
  selectFile: (key: UploadKey, event: ChangeEvent<HTMLInputElement>) => void;
  clearUpload: (key: UploadKey) => void;
}) {
  return (
    <>
      <section className="register-detail-card">
        <SectionTitle number={1} title="Informasi Identitas" />

        <div className="register-detail-grid">
          <label>
            Nama UMKM
            <input
              value={form.namaUmkm}
              onChange={(e) => setForm((p: any) => ({ ...p, namaUmkm: e.target.value }))}
              placeholder="Contoh: Kopi Tumbuh Nusantara"
              required
            />
          </label>

          <label>
            <div className="register-field-label-row">
              <span>NIK Pemilik</span>
              <span className={form.nikPemilik.length === 16 ? "field-counter ok" : "field-counter"}>
                {form.nikPemilik.length}/16
              </span>
            </div>

            <input
              value={form.nikPemilik}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  nikPemilik: onlyDigits(e.target.value, 16),
                }))
              }
              inputMode="numeric"
              maxLength={16}
              placeholder="16 digit nomor induk kependudukan"
            />
          </label>

          <label>
            Nama Pemilik
            <input
              value={form.namaPemilik}
              onChange={(e) => setForm((p: any) => ({ ...p, namaPemilik: e.target.value }))}
              placeholder="Sesuai KTP"
              required
            />
          </label>

          <label>
            Nomor WhatsApp
            <div className="register-phone-input">
              <span>+62</span>
              <input
                value={form.phone}
                onChange={(e) => setForm((p: any) => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))}
                placeholder="8123456789"
              />
            </div>
          </label>
        </div>

        <SectionTitle number={2} title="Kategori Usaha" />
        <div className="register-detail-grid register-detail-grid--single">
          <label>
            Kategori Usaha
            <select
              value={form.kategoriUsaha}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  kategoriUsaha: e.target.value,
                }))
              }
              required
            >
              <option value="">Kategori Usaha</option>
              {UMKM_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <SectionTitle number={3} title="Deskripsi Usaha" />
        <label>
          <textarea
            value={form.deskripsiUsaha}
            onChange={(e) => setForm((p: any) => ({ ...p, deskripsiUsaha: e.target.value }))}
            placeholder="Ceritakan sejarah singkat, keunikan, dan visi usaha Anda..."
            required
          />
        </label>

        <SectionTitle number={4} title="Alamat Usaha" />
        <label>
          <textarea
            value={form.alamatUsaha}
            onChange={(e) => setForm((p: any) => ({ ...p, alamatUsaha: e.target.value }))}
            placeholder="Alamat lengkap (Jalan, No, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten)"
            required
          />
        </label>

        <div className="register-detail-grid">
          <label>
            Kota/Kabupaten
            <input
              value={form.kotaKabupaten}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, kotaKabupaten: e.target.value }))
              }
              placeholder="Contoh: Surakarta"
              required
            />
          </label>

          <label>
            Provinsi
            <input
              value={form.provinsi}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, provinsi: e.target.value }))
              }
              placeholder="Contoh: Jawa Tengah"
              required
            />
          </label>
        </div>

        <SectionTitle number={5} title="Produk" />
        <div className="register-detail-grid register-detail-grid--single">
          <label>
            Produk Utama
            <input
              value={form.produkUtama}
              onChange={(e) => setForm((p: any) => ({ ...p, produkUtama: e.target.value }))}
              placeholder="Nama produk yang paling laku"
            />
          </label>
        </div>

        <SectionTitle number={6} title="Legalitas & Visual" />
        <div className="register-upload-grid">
          <UploadBox
            id="umkm-photo"
            label="Upload Foto Usaha"
            hint="Tampak depan atau area produksi (Max 2MB)"
            value={uploads.umkmPhoto}
            accept={uploadRules.umkmPhoto.accept}
            onChange={(e) => selectFile("umkmPhoto", e)}
            onClear={() => clearUpload("umkmPhoto")}
          />
          <UploadBox
            id="umkm-legal"
            label="Upload Dokumen Pendukung"
            hint="NIB, SKU, atau IUMK (PDF/JPG)"
            value={uploads.umkmLegal}
            accept={uploadRules.umkmLegal.accept}
            onChange={(e) => selectFile("umkmLegal", e)}
            onClear={() => clearUpload("umkmLegal")}
          />
        </div>
      </section>
    </>
  );
}

function MitraFields({
  form,
  setForm,
  uploads,
  selectFile,
  clearUpload,
}: {
  form: any;
  setForm: Dispatch<SetStateAction<any>>;
  uploads: Record<UploadKey, UploadState>;
  selectFile: (key: UploadKey, event: ChangeEvent<HTMLInputElement>) => void;
  clearUpload: (key: UploadKey) => void;
}) {
  return (
    <>
      <section className="register-detail-flat">
        <SectionTitle title="Informasi Organisasi" icon="line" />

        <div className="register-detail-grid">
          <label>
            Nama perusahaan / institusi
            <input
              value={form.namaOrganisasi}
              onChange={(e) => setForm((p: any) => ({ ...p, namaOrganisasi: e.target.value }))}
              placeholder="Contoh: PT Global Solusi UMKM"
              required
            />
          </label>

          <label>
            Jenis mitra
            <select
              value={form.jenisMitra}
              onChange={(e) => setForm((p: any) => ({ ...p, jenisMitra: e.target.value }))}
              required
            >
              <option value="">Pilih jenis mitra</option>
              <option value="Inkubator Bisnis">Inkubator Bisnis</option>
              <option value="Lembaga Keuangan">Lembaga Keuangan</option>
              <option value="Lembaga Pelatihan">Lembaga Pelatihan</option>
              <option value="Komunitas Bisnis">Komunitas Bisnis</option>
              <option value="Korporasi Swasta">Korporasi Swasta</option>
              <option value="Pemerintah Daerah">Pemerintah Daerah</option>
            </select>
          </label>

          <label>
            <div className="register-field-label-row">
              <span>NIB perusahaan</span>
              <span className={form.nib.length === 13 ? "field-counter ok" : "field-counter"}>
                {form.nib.length}/13
              </span>
            </div>

            <input
              value={form.nib}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  nib: onlyDigits(e.target.value, 13),
                }))
              }
              inputMode="numeric"
              maxLength={13}
              placeholder="Masukkan 13 digit NIB"
            />
          </label>

          <label>
            <div className="register-field-label-row">
              <span>NPWP Badan</span>
              <span className={form.npwp.length === 15 ? "field-counter ok" : "field-counter"}>
                {form.npwp.length}/15
              </span>
            </div>

            <input
              value={form.npwp}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  npwp: onlyDigits(e.target.value, 15),
                }))
              }
              inputMode="numeric"
              maxLength={15}
              placeholder="15 digit NPWP badan"
            />
          </label>
        </div>

        <SectionTitle title="Penanggung Jawab (PIC)" icon="line" />
        <div className="register-detail-grid">
          <label>
            Nama PIC
            <input
              value={form.namaPic}
              onChange={(e) => setForm((p: any) => ({ ...p, namaPic: e.target.value }))}
              placeholder="Nama lengkap sesuai identitas"
              required
            />
          </label>

          <label>
            Jabatan
            <input
              value={form.jabatanPic}
              onChange={(e) => setForm((p: any) => ({ ...p, jabatanPic: e.target.value }))}
              placeholder="Contoh: Manager Operasional"
            />
          </label>

          <label>
            Email PIC
            <input
              type="email"
              value={form.emailPic}
              onChange={(e) => setForm((p: any) => ({ ...p, emailPic: e.target.value }))}
              placeholder="nama@perusahaan.com"
            />
          </label>

          <label>
            Nomor WhatsApp PIC
            <div className="register-phone-input">
              <span>+62</span>
              <input
                value={form.phonePic}
                onChange={(e) => setForm((p: any) => ({ ...p, phonePic: e.target.value.replace(/\D/g, "") }))}
                placeholder="812xxxxxx"
              />
            </div>
          </label>
        </div>

        <SectionTitle title="Alamat Kantor" icon="line" />
        <div className="register-detail-grid">
          <label>
            Alamat kantor
            <textarea
              value={form.alamatKantor}
              onChange={(e) => setForm((p: any) => ({ ...p, alamatKantor: e.target.value }))}
              placeholder="Alamat lengkap kantor / institusi"
            />
          </label>

          <label>
            Kota/Kabupaten
            <input
              value={form.kotaKabupaten}
              onChange={(e) => setForm((p: any) => ({ ...p, kotaKabupaten: e.target.value }))}
              placeholder="Contoh: Surakarta"
            />
          </label>

          <label>
            Provinsi
            <input
              value={form.provinsi}
              onChange={(e) => setForm((p: any) => ({ ...p, provinsi: e.target.value }))}
              placeholder="Contoh: Jawa Tengah"
            />
          </label>
        </div>

        <SectionTitle title="Profil Kemitraan" icon="line" />
        <div className="register-detail-grid">
          <label>
            Bidang kemitraan
            <select
              value={form.bidangKemitraan}
              onChange={(e) => setForm((p: any) => ({ ...p, bidangKemitraan: e.target.value }))}
            >
              <option value="">Pilih bidang</option>
              <option value="Akses Permodalan">Akses Permodalan</option>
              <option value="Pelatihan">Pelatihan</option>
              <option value="Marketplace">Marketplace</option>
              <option value="Promosi Digital">Promosi Digital</option>
              <option value="Legalitas Usaha">Legalitas Usaha</option>
              <option value="Distribusi">Distribusi</option>
            </select>
          </label>

          <label>
            Wilayah operasional
            <input
              value={form.wilayahOperasional}
              onChange={(e) => setForm((p: any) => ({ ...p, wilayahOperasional: e.target.value }))}
              placeholder="Contoh: Seluruh Indonesia"
            />
          </label>

          <label>
            Jenis dukungan
            <input
              value={form.jenisDukungan}
              onChange={(e) => setForm((p: any) => ({ ...p, jenisDukungan: e.target.value }))}
              placeholder="Contoh: Akses Permodalan"
            />
          </label>

          <label>
            Skala kerja sama
            <select
              value={form.skalaKerjaSama}
              onChange={(e) => setForm((p: any) => ({ ...p, skalaKerjaSama: e.target.value }))}
            >
              <option value="">Pilih skala</option>
              <option value="Lokal">Lokal</option>
              <option value="Kabupaten/Kota">Kabupaten/Kota</option>
              <option value="Provinsi">Provinsi</option>
              <option value="Nasional">Nasional</option>
            </select>
          </label>
        </div>

        <label>
          Deskripsi tujuan kemitraan
          <textarea
            value={form.deskripsiTujuan}
            onChange={(e) => setForm((p: any) => ({ ...p, deskripsiTujuan: e.target.value }))}
            placeholder="Jelaskan secara singkat visi dan misi dari kemitraan yang akan dijalin..."
          />
        </label>

        <SectionTitle title="Dokumen Pendukung" icon="line" />
        <div className="register-upload-grid register-upload-grid--mitra">
          <UploadBox
            id="mitra-legal"
            label="Upload legalitas perusahaan"
            hint="PDF, JPG, PNG (Max 5MB)"
            value={uploads.mitraLegal}
            accept={uploadRules.mitraLegal.accept}
            onChange={(e) => selectFile("mitraLegal", e)}
            onClear={() => clearUpload("mitraLegal")}
          />
          <UploadBox
            id="mitra-commitment"
            label="Upload surat komitmen"
            hint="PDF Only (Max 2MB)"
            value={uploads.mitraCommitment}
            accept={uploadRules.mitraCommitment.accept}
            onChange={(e) => selectFile("mitraCommitment", e)}
            onClear={() => clearUpload("mitraCommitment")}
          />
          <UploadBox
            id="mitra-company-profile"
            label="Upload profil perusahaan"
            hint="Company profile dalam format PDF (Max 10MB)"
            value={uploads.mitraCompanyProfile}
            accept={uploadRules.mitraCompanyProfile.accept}
            onChange={(e) => selectFile("mitraCompanyProfile", e)}
            onClear={() => clearUpload("mitraCompanyProfile")}
          />
        </div>
      </section>
    </>
  );
}