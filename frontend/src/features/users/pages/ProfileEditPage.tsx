import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  ImagePlus,
  MapPin,
  MapPinned,
  Phone,
  ShieldCheck,
  Store,
} from "lucide-react";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import {
  getMyProfile,
  updateMyProfile,
  type UmkmProfile,
  type UmkmProfilePayload,
} from "../api";

type FieldErrors = Partial<Record<keyof UmkmProfilePayload, string>>;

const DAY_OPTIONS = [
  { key: "Sen", label: "Sen", full: "Senin" },
  { key: "Sel", label: "Sel", full: "Selasa" },
  { key: "Rab", label: "Rab", full: "Rabu" },
  { key: "Kam", label: "Kam", full: "Kamis" },
  { key: "Jum", label: "Jum", full: "Jumat" },
  { key: "Sab", label: "Sab", full: "Sabtu" },
  { key: "Min", label: "Min", full: "Minggu" },
];

const emptyForm: UmkmProfilePayload = {
  business_name: "",
  business_category: "",
  business_description: "",
  established_year: undefined,
  business_email: "",
  operating_hours: "",
  social_media_marketplace: "",
  owner_name: "",
  nik: "",
  phone_number: "",
  address: "",
  city: "",
  province: "",
  district: "",
  village: "",
  postal_code: "",
};

function mapProfileToForm(profile: UmkmProfile): UmkmProfilePayload {
  return {
    business_name: profile.business_name ?? "",
    business_category: profile.business_category ?? "",
    business_description: profile.business_description ?? "",
    established_year: profile.established_year ?? undefined,
    business_email: profile.business_email ?? "",
    operating_hours: profile.operating_hours ?? "",
    social_media_marketplace: profile.social_media_marketplace ?? "",
    owner_name: profile.owner_name ?? "",
    nik: profile.nik ?? "",
    phone_number: profile.phone_number ?? "",
    address: profile.address ?? "",
    city: profile.city ?? "",
    province: profile.province ?? "",
    district: profile.district ?? "",
    village: profile.village ?? "",
    postal_code: profile.postal_code ?? "",
  };
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function hasTextLetter(value: string) {
  return /[A-Za-zÀ-ÿ\u00C0-\u024F\u1E00-\u1EFF]/.test(value.trim());
}

function isValidBusinessName(value: string) {
  const cleaned = value.trim();
  if (cleaned.length < 3 || cleaned.length > 120) return false;
  return /[A-Za-zÀ-ÿ\u00C0-\u024F\u1E00-\u1EFF0-9]/.test(cleaned);
}

function isValidEmail(value: string) {
  if (!value.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidIndonesianPhone(value: string) {
  const digits = onlyDigits(value);
  if (digits.length < 10 || digits.length > 15) return false;
  return digits.startsWith("08") || digits.startsWith("62");
}

function formatTimeLabel(value: string) {
  return value.replace(":", ".");
}

function describeDays(days: string[]) {
  const ordered = DAY_OPTIONS.filter((day) => days.includes(day.key)).map((day) => day.key);
  const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum"];
  const weekend = ["Sab", "Min"];

  if (ordered.length === 7) return "Setiap hari";
  if (ordered.join(",") === weekdays.join(",")) return "Senin–Jumat";
  if (ordered.join(",") === weekend.join(",")) return "Sabtu–Minggu";

  return DAY_OPTIONS.filter((day) => ordered.includes(day.key))
    .map((day) => day.full)
    .join(", ");
}

function buildOperatingHoursText(days: string[], openTime: string, closeTime: string) {
  if (days.length === 0) return "";
  return `${describeDays(days)} ${formatTimeLabel(openTime)}–${formatTimeLabel(closeTime)}`;
}

function buildFullAddress(form: UmkmProfilePayload) {
  return [
    form.address,
    form.village,
    form.district,
    form.city,
    form.province,
    form.postal_code,
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

function getProfileFormErrors(form: UmkmProfilePayload): FieldErrors {
  const errors: FieldErrors = {};
  const currentYear = new Date().getFullYear();

  if (!isValidBusinessName(form.business_name)) {
    errors.business_name = "Nama UMKM wajib diisi, minimal 3 karakter, dan tidak boleh hanya simbol.";
  }

  if (!form.owner_name?.trim()) {
    errors.owner_name = "Nama pemilik wajib diisi.";
  } else if (!hasTextLetter(form.owner_name)) {
    errors.owner_name = "Nama pemilik tidak boleh hanya angka atau simbol.";
  }

  if (!form.business_category?.trim()) {
    errors.business_category = "Kategori usaha wajib dipilih.";
  }

  const establishedYear = form.established_year;
  if (establishedYear != null) {
    if (establishedYear < 1900 || establishedYear > currentYear) {
      errors.established_year = `Tahun berdiri harus berada antara 1900 sampai ${currentYear}.`;
    }
  }

  const nik = onlyDigits(form.nik ?? "");
  if (!nik) {
    errors.nik = "NIK pemilik wajib diisi.";
  } else if (nik.length !== 16) {
    errors.nik = "NIK pemilik harus berisi tepat 16 digit angka.";
  }

  if (!isValidIndonesianPhone(form.phone_number ?? "")) {
    errors.phone_number = "Nomor WhatsApp harus berisi 10–15 digit dan diawali 08 atau 62.";
  }

  if (!isValidEmail(form.business_email ?? "")) {
    errors.business_email = "Format email bisnis tidak valid.";
  }

  if (!form.address?.trim()) {
    errors.address = "Alamat lengkap wajib diisi.";
  }

  if (!form.city?.trim()) {
    errors.city = "Kota wajib diisi.";
  } else if (!hasTextLetter(form.city)) {
    errors.city = "Kota tidak boleh hanya angka atau simbol.";
  }

  if (!form.province?.trim()) {
    errors.province = "Provinsi wajib diisi.";
  } else if (!hasTextLetter(form.province)) {
    errors.province = "Provinsi tidak boleh hanya angka atau simbol.";
  }

  const postalCode = onlyDigits(form.postal_code ?? "");
  if (postalCode && postalCode.length !== 5) {
    errors.postal_code = "Kode pos harus berisi tepat 5 digit angka.";
  }

  return errors;
}

function getCompletenessItems(form: UmkmProfilePayload) {
  return [
    {
      label: "Profil dasar",
      done:
        isValidBusinessName(form.business_name) &&
        hasTextLetter(form.owner_name ?? "") &&
        Boolean(form.business_category?.trim()) &&
        onlyDigits(form.nik ?? "").length === 16,
    },
    {
      label: "Kontak usaha",
      done: isValidIndonesianPhone(form.phone_number ?? "") && isValidEmail(form.business_email ?? ""),
    },
    {
      label: "Lokasi usaha",
      done: Boolean(form.address?.trim() && form.city?.trim() && form.province?.trim()),
    },
    {
      label: "Jam operasional",
      done: Boolean(form.operating_hours?.trim()),
    },
    {
      label: "Visual usaha",
      done: false,
    },
    {
      label: "Dokumen legalitas",
      done: false,
    },
  ];
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="umkm-field-error">{message}</span>;
}

function RequiredMark() {
  return <span className="umkm-required-mark">*</span>;
}

export default function ProfileEditPage() {
  const user = getCurrentUser();
  const [profile, setProfile] = useState<UmkmProfile | null>(null);
  const [form, setForm] = useState<UmkmProfilePayload>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [selectedDays, setSelectedDays] = useState(DAY_OPTIONS.map((day) => day.key));
  const [openTime, setOpenTime] = useState("10:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fullAddress = useMemo(() => buildFullAddress(form), [form]);

  const completenessItems = useMemo(() => getCompletenessItems(form), [form]);
  const completedCount = completenessItems.filter((item) => item.done).length;
  const completenessPercent = Math.round((completedCount / completenessItems.length) * 100);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setLoading(true);
      setError("");
      setMessage("");
      setFieldErrors({});

      try {
        const response = await getMyProfile();

        if (ignore) return;

        const nextProfile = response.profile as UmkmProfile;

        setProfile(nextProfile);
        setForm(mapProfileToForm(nextProfile));
      } catch (err) {
        if (ignore) return;

        const msg = err instanceof Error ? err.message : "Gagal memuat profil.";

        if (msg.toLowerCase().includes("profil belum dibuat")) {
          setProfile(null);
          setForm({
            ...emptyForm,
            owner_name: user?.full_name ?? "",
          });
          setMessage("Profil belum dibuat. Lengkapi data UMKM terlebih dahulu.");
        } else {
          setError(msg);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [user?.full_name]);

  function fieldClass(field: keyof UmkmProfilePayload, extra = "") {
    return `umkm-field ${extra} ${fieldErrors[field] ? "has-error" : ""}`.trim();
  }

  function updateField<K extends keyof UmkmProfilePayload>(field: K, value: UmkmProfilePayload[K]) {
    setError("");
    setMessage("");
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateOperatingHours(days: string[], nextOpenTime = openTime, nextCloseTime = closeTime) {
    setError("");
    setMessage("");
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.operating_hours;
      return next;
    });

    setSelectedDays(days);
    setOpenTime(nextOpenTime);
    setCloseTime(nextCloseTime);

    setForm((current) => ({
      ...current,
      operating_hours: buildOperatingHoursText(days, nextOpenTime, nextCloseTime),
    }));
  }

  function toggleOperatingDay(day: string) {
    const nextSet = new Set(selectedDays);

    if (nextSet.has(day)) {
      nextSet.delete(day);
    } else {
      nextSet.add(day);
    }

    const nextDays = DAY_OPTIONS.filter((item) => nextSet.has(item.key)).map((item) => item.key);
    updateOperatingHours(nextDays);
  }

  function resetForm() {
    if (profile) {
      setForm(mapProfileToForm(profile));
      setFieldErrors({});
      setMessage("Perubahan dibatalkan.");
      setError("");
      return;
    }

    setForm({
      ...emptyForm,
      owner_name: user?.full_name ?? "",
    });
    setFieldErrors({});
    setMessage("Form dikosongkan kembali.");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = getProfileFormErrors(form);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError("");
      setMessage("");

      requestAnimationFrame(() => {
        document
          .querySelector(".umkm-field.has-error")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload: UmkmProfilePayload = {
        ...form,
        business_name: form.business_name.trim(),
        business_category: form.business_category.trim(),
        business_description: form.business_description?.trim() || "",
        business_email: form.business_email?.trim() || "",
        operating_hours: form.operating_hours?.trim() || "",
        social_media_marketplace: form.social_media_marketplace?.trim() || "",
        owner_name: form.owner_name.trim(),
        nik: onlyDigits(form.nik ?? ""),
        phone_number: onlyDigits(form.phone_number ?? ""),
        address: form.address.trim(),
        city: form.city.trim(),
        province: form.province.trim(),
        district: form.district?.trim() || "",
        village: form.village?.trim() || "",
        postal_code: onlyDigits(form.postal_code ?? ""),
      };

      const response = await updateMyProfile(payload);
      const nextProfile = response.profile as UmkmProfile;

      setProfile(nextProfile);
      setForm(mapProfileToForm(nextProfile));
      setFieldErrors({});
      setMessage("Data berhasil diperbarui.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan profil.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-card">
          <h1>Profil</h1>
          <p>Sesi login tidak ditemukan.</p>
          <Link to="/login">Kembali ke login</Link>
        </section>
      </main>
    );
  }

  if (user.role !== "UMKM") {
    return (
      <main className="dashboard-page">
        <section className="dashboard-card">
          <h1>Profil</h1>
          <p>Halaman profil ini sementara hanya tersedia untuk akun UMKM.</p>
          <Link to={user.role === "MITRA" ? "/mitra" : "/"}>Kembali</Link>
        </section>
      </main>
    );
  }

  return (
    <UmkmLayout>
      <form className="umkm-profile-page" onSubmit={handleSubmit} noValidate>
        <div className="umkm-profile-header">
          {message ? (
            <div className="umkm-save-message">
              <CheckCircle2 size={18} />
              <span>{message}</span>
            </div>
          ) : null}

          {error ? <div className="error-message">{error}</div> : null}

          <h1>Edit Informasi UMKM</h1>
          <p>Ubah data bisnis, kontak, lokasi, dan informasi pendukung UMKM Anda.</p>
        </div>

        {loading ? (
          <section className="umkm-form-section">
            <p>Memuat profil...</p>
          </section>
        ) : (
          <>
            <section className="umkm-profile-preview-grid">
              <article className="umkm-profile-summary-card">
                <div className="umkm-preview-badge-row">
                  <span className="umkm-preview-type">Profil bisnis</span>
                  <strong className={`umkm-status-badge ${(profile?.status ?? "BELUM_DIBUAT").toLowerCase()}`}>
                    {profile?.status ?? "Belum dibuat"}
                  </strong>
                </div>

                <h2>{form.business_name || "Nama UMKM belum diisi"}</h2>
                <p>{form.business_description || "Deskripsi usaha belum diisi."}</p>

                <div className="umkm-preview-chip-row">
                  <span>{form.business_category || "Kategori belum dipilih"}</span>
                  <span>{form.established_year ? `Berdiri ${form.established_year}` : "Tahun berdiri belum diisi"}</span>
                </div>

                <div className="umkm-preview-contact-grid">
                  <div>
                    <Phone size={17} />
                    <span>{form.phone_number || "Nomor WhatsApp belum diisi"}</span>
                  </div>
                  <div>
                    <MapPin size={17} />
                    <span>{fullAddress || "Alamat belum lengkap"}</span>
                  </div>
                  <div>
                    <Clock3 size={17} />
                    <span>{form.operating_hours || "Jam operasional belum diisi"}</span>
                  </div>
                </div>
              </article>

              <aside className="umkm-credibility-card">
                <div className="umkm-credibility-card__header">
                  <ShieldCheck size={24} />
                  <div>
                    <span>Status Kredibilitas</span>
                    <strong>{completenessPercent}% lengkap</strong>
                  </div>
                </div>

                <div className="umkm-completeness-bar">
                  <span style={{ width: `${completenessPercent}%` }} />
                </div>

                <div className="umkm-completeness-list">
                  {completenessItems.map((item) => (
                    <div className={item.done ? "done" : ""} key={item.label}>
                      <CheckCircle2 size={16} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </aside>
            </section>

            <section className="umkm-form-section">
              <h2>
                <span className="umkm-section-icon">
                  <Store size={18} />
                </span>
                Informasi Dasar
              </h2>

              <div className="umkm-form-grid">
                <label className={fieldClass("business_name")}>
                  <span>
                    Nama UMKM <RequiredMark />
                  </span>
                  <input
                    value={form.business_name}
                    onChange={(e) => updateField("business_name", e.target.value)}
                  />
                  <FieldError message={fieldErrors.business_name} />
                </label>

                <label className={fieldClass("owner_name")}>
                  <span>
                    Nama Pemilik <RequiredMark />
                  </span>
                  <input
                    value={form.owner_name}
                    onChange={(e) => updateField("owner_name", e.target.value)}
                  />
                  <FieldError message={fieldErrors.owner_name} />
                </label>

                <label className={fieldClass("business_category")}>
                  <span>
                    Kategori Usaha <RequiredMark />
                  </span>
                  <select
                    value={form.business_category}
                    onChange={(e) => updateField("business_category", e.target.value)}
                  >
                    <option value="">Pilih kategori</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Kuliner">Kuliner</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Kerajinan">Kerajinan</option>
                    <option value="Jasa">Jasa</option>
                    <option value="Teknologi">Teknologi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <FieldError message={fieldErrors.business_category} />
                </label>

                <label className={fieldClass("established_year")}>
                  <span>Tahun Berdiri</span>
                  <input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={form.established_year ?? ""}
                    onChange={(e) =>
                      updateField(
                        "established_year",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                  <FieldError message={fieldErrors.established_year} />
                </label>

                <label className={fieldClass("business_description", "umkm-field-full")}>
                  <span>Deskripsi Usaha</span>
                  <textarea
                    value={form.business_description ?? ""}
                    onChange={(e) => updateField("business_description", e.target.value)}
                    rows={4}
                    placeholder="Ceritakan produk utama, keunggulan usaha, dan kanal penjualan."
                  />
                  <FieldError message={fieldErrors.business_description} />
                </label>

                <label className={fieldClass("nik")}>
                  <span>
                    NIK Pemilik <RequiredMark />
                  </span>
                  <input
                    value={form.nik}
                    onChange={(e) => updateField("nik", onlyDigits(e.target.value).slice(0, 16))}
                    maxLength={16}
                    inputMode="numeric"
                    placeholder="16 digit NIK pemilik"
                  />
                  <FieldError message={fieldErrors.nik} />
                </label>

                <div className="umkm-readonly-status">
                  <span>Status Profil</span>
                  <strong className={`umkm-status-badge ${(profile?.status ?? "BELUM_DIBUAT").toLowerCase()}`}>
                    {profile?.status ?? "Belum dibuat"}
                  </strong>
                </div>
              </div>
            </section>

            <section className="umkm-form-section">
              <h2>
                <span className="umkm-section-icon">
                  <MapPin size={18} />
                </span>
                Kontak & Lokasi
              </h2>

              <div className="umkm-form-grid">
                <label className={fieldClass("phone_number")}>
                  <span>
                    Nomor WhatsApp <RequiredMark />
                  </span>
                  <input
                    value={form.phone_number}
                    onChange={(e) =>
                      updateField("phone_number", e.target.value.replace(/[^0-9+\-\s]/g, ""))
                    }
                    placeholder="Contoh: 081234567890"
                  />
                  <FieldError message={fieldErrors.phone_number} />
                </label>

                <label className={fieldClass("business_email")}>
                  <span>Email Bisnis</span>
                  <input
                    type="email"
                    value={form.business_email ?? ""}
                    onChange={(e) => updateField("business_email", e.target.value)}
                    placeholder="Contoh: usaha@email.com"
                  />
                  <FieldError message={fieldErrors.business_email} />
                </label>

                <label className={fieldClass("address", "umkm-field-full")}>
                  <span>
                    Alamat Lengkap <RequiredMark />
                  </span>
                  <textarea
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    rows={3}
                  />
                  <FieldError message={fieldErrors.address} />
                </label>

                <label className={fieldClass("city")}>
                  <span>
                    Kota <RequiredMark />
                  </span>
                  <input
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                  <FieldError message={fieldErrors.city} />
                </label>

                <label className={fieldClass("province")}>
                  <span>
                    Provinsi <RequiredMark />
                  </span>
                  <input
                    value={form.province}
                    onChange={(e) => updateField("province", e.target.value)}
                  />
                  <FieldError message={fieldErrors.province} />
                </label>

                <label className={fieldClass("district")}>
                  <span>Kecamatan</span>
                  <input
                    value={form.district ?? ""}
                    onChange={(e) => updateField("district", e.target.value)}
                  />
                  <FieldError message={fieldErrors.district} />
                </label>

                <label className={fieldClass("village")}>
                  <span>Kelurahan/Desa</span>
                  <input
                    value={form.village ?? ""}
                    onChange={(e) => updateField("village", e.target.value)}
                  />
                  <FieldError message={fieldErrors.village} />
                </label>

                <label className={fieldClass("postal_code")}>
                  <span>Kode Pos</span>
                  <input
                    value={form.postal_code ?? ""}
                    onChange={(e) => updateField("postal_code", onlyDigits(e.target.value).slice(0, 5))}
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="Contoh: 17148"
                  />
                  <FieldError message={fieldErrors.postal_code} />
                </label>

                <div className={fieldClass("operating_hours")}>
                  <span className="umkm-field-label">Jam Operasional</span>

                  <div className="umkm-day-buttons">
                    {DAY_OPTIONS.map((day) => (
                      <button
                        type="button"
                        className={selectedDays.includes(day.key) ? "active" : ""}
                        key={day.key}
                        onClick={() => toggleOperatingDay(day.key)}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>

                  <div className="umkm-time-grid">
                    <label>
                      Jam buka
                      <input
                        type="time"
                        value={openTime}
                        onChange={(e) => updateOperatingHours(selectedDays, e.target.value, closeTime)}
                      />
                    </label>

                    <label>
                      Jam tutup
                      <input
                        type="time"
                        value={closeTime}
                        onChange={(e) => updateOperatingHours(selectedDays, openTime, e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="umkm-generated-hours">
                    <Clock3 size={16} />
                    <span>{form.operating_hours || "Pilih hari dan jam operasional."}</span>
                  </div>

                  <FieldError message={fieldErrors.operating_hours} />
                </div>

                <label className={fieldClass("social_media_marketplace", "umkm-field-full")}>
                  <span>Media Sosial / Marketplace</span>
                  <input
                    value={form.social_media_marketplace ?? ""}
                    onChange={(e) => updateField("social_media_marketplace", e.target.value)}
                    placeholder="Contoh: Instagram @usahaku | Shopee Usahaku"
                  />
                  <FieldError message={fieldErrors.social_media_marketplace} />
                </label>

                <div className="umkm-address-preview umkm-field-full">
                  <div>
                    <MapPinned size={20} />
                    <div>
                      <strong>Preview Alamat</strong>
                      <p>{fullAddress || "Lengkapi alamat untuk menampilkan preview lokasi usaha."}</p>
                    </div>
                  </div>

                  <div className="umkm-map-preview">
                    <MapPinned size={28} />
                    <span>Preview peta belum tersambung</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="umkm-form-section">
              <h2>
                <span className="umkm-section-icon">
                  <Building2 size={18} />
                </span>
                Legalitas & Visual
              </h2>

              <div className="umkm-visual-grid">
                <div>
                  <label>
                    Logo Usaha
                    <div className="umkm-placeholder-image" style={{ maxWidth: 130, height: 130 }}>
                      <ImagePlus size={28} />
                    </div>
                  </label>

                  <label style={{ marginTop: 24 }}>
                    Foto Utama Usaha
                    <div className="umkm-placeholder-image">
                      <span>Upload foto produk/toko belum tersedia</span>
                    </div>
                  </label>
                </div>

                <aside className="umkm-document-card">
                  <h3>STATUS DOKUMEN</h3>

                  <div className="umkm-doc-row">
                    <span>NIB / Legalitas Usaha</span>
                    <span>Placeholder</span>
                  </div>

                  <div className="umkm-doc-row">
                    <span>Dokumen Pendukung</span>
                    <span>Placeholder</span>
                  </div>

                  <div className="umkm-doc-row pending">
                    <span>
                      <FileText size={16} /> Upload dokumen
                    </span>
                    <span>Coming soon</span>
                  </div>

                  <p>
                    Fitur dokumen dan object storage akan disambungkan melalui document-service/Garage
                    pada milestone berikutnya.
                  </p>
                </aside>
              </div>
            </section>

            <div className="umkm-profile-actions">
              <button className="umkm-secondary-btn" type="button" onClick={resetForm}>
                Batal
              </button>
              <button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : profile ? "Simpan Perubahan" : "Buat Profil"}
              </button>
            </div>
          </>
        )}
      </form>
    </UmkmLayout>
  );
}
