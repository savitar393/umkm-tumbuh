import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  ImagePlus,
  MapPin,
  MapPinned,
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
import {
  buildPhoneWithIndonesiaPrefix,
  getPhoneLocalValue,
  isValidIndonesianPhone,
} from "../../../shared/utils/phone";
import {
  emptySocialMediaLinks,
  parseSocialMediaValue,
  serializeSocialMediaValue,
  type SocialMediaLinks,
} from "../../../shared/utils/socialMedia";

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

const DEFAULT_OPERATING_DAYS = DAY_OPTIONS.map((day) => day.key);
const DEFAULT_OPEN_TIME = "10:00";
const DEFAULT_CLOSE_TIME = "22:00";

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

function normalizeTimeForInput(rawHour: string, rawMinute: string, meridiem?: string) {
  let hour = Number(rawHour);
  const minute = rawMinute.padStart(2, "0");
  const normalizedMeridiem = meridiem?.toUpperCase();

  if (normalizedMeridiem === "PM" && hour < 12) hour += 12;
  if (normalizedMeridiem === "AM" && hour === 12) hour = 0;

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function getDayIndexFromText(value: string) {
  const text = value.toLowerCase();

  return DAY_OPTIONS.findIndex((day) => {
    const full = day.full.toLowerCase();
    const key = day.key.toLowerCase();

    return text === full || text === key;
  });
}

function parseOperatingDays(daysText: string) {
  const normalized = daysText
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return DEFAULT_OPERATING_DAYS;
  if (normalized.includes("setiap hari")) return DEFAULT_OPERATING_DAYS;

  const rangeMatch = normalized.match(
    /(senin|selasa|rabu|kamis|jumat|sabtu|minggu|sen|sel|rab|kam|jum|sab|min)\s*(?:-|–|sampai|sd|s\/d)\s*(senin|selasa|rabu|kamis|jumat|sabtu|minggu|sen|sel|rab|kam|jum|sab|min)/i,
  );

  if (rangeMatch) {
    const startIndex = getDayIndexFromText(rangeMatch[1]);
    const endIndex = getDayIndexFromText(rangeMatch[2]);

    if (startIndex >= 0 && endIndex >= 0) {
      if (startIndex <= endIndex) {
        return DAY_OPTIONS.slice(startIndex, endIndex + 1).map((day) => day.key);
      }

      return [
        ...DAY_OPTIONS.slice(startIndex),
        ...DAY_OPTIONS.slice(0, endIndex + 1),
      ].map((day) => day.key);
    }
  }

  const selected = DAY_OPTIONS.filter((day) => {
    const full = day.full.toLowerCase();
    const key = day.key.toLowerCase();

    return new RegExp(`\\b(${full}|${key})\\b`, "i").test(normalized);
  }).map((day) => day.key);

  return selected.length > 0 ? selected : DEFAULT_OPERATING_DAYS;
}

function parseOperatingHours(value?: string | null) {
  const text = value?.trim() ?? "";

  const timeMatch = text.match(
    /(\d{1,2})[.:](\d{2})\s*(AM|PM)?\s*(?:–|-|sampai|to)\s*(\d{1,2})[.:](\d{2})\s*(AM|PM)?/i,
  );

  if (!timeMatch) {
    return {
      days: DEFAULT_OPERATING_DAYS,
      openTime: DEFAULT_OPEN_TIME,
      closeTime: DEFAULT_CLOSE_TIME,
    };
  }

  const daysText = text.slice(0, timeMatch.index).trim();

  return {
    days: parseOperatingDays(daysText),
    openTime: normalizeTimeForInput(timeMatch[1], timeMatch[2], timeMatch[3]),
    closeTime: normalizeTimeForInput(timeMatch[4], timeMatch[5], timeMatch[6]),
  };
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
    errors.phone_number = "Nomor WhatsApp harus valid. Contoh: +62 81234567890.";
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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="umkm-field-error">{message}</span>;
}

function RequiredMark() {
  return <span className="umkm-required-mark">*</span>;
}

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [profile, setProfile] = useState<UmkmProfile | null>(null);
  const [form, setForm] = useState<UmkmProfilePayload>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [selectedDays, setSelectedDays] = useState(DEFAULT_OPERATING_DAYS);
  const [openTime, setOpenTime] = useState(DEFAULT_OPEN_TIME);
  const [closeTime, setCloseTime] = useState(DEFAULT_CLOSE_TIME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const socialLinks = parseSocialMediaValue(form.social_media_marketplace);

  const fullAddress = useMemo(() => buildFullAddress(form), [form]);

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
        const nextForm = mapProfileToForm(nextProfile);
        const parsedOperatingHours = parseOperatingHours(nextForm.operating_hours);

        setSelectedDays(parsedOperatingHours.days);
        setOpenTime(parsedOperatingHours.openTime);
        setCloseTime(parsedOperatingHours.closeTime);
        setProfile(nextProfile);
        setForm(nextForm);
      } catch (err) {
        if (ignore) return;

        const msg = err instanceof Error ? err.message : "Gagal memuat profil.";

        if (msg.toLowerCase().includes("profil belum dibuat")) {
          setSelectedDays(DEFAULT_OPERATING_DAYS);
          setOpenTime(DEFAULT_OPEN_TIME);
          setCloseTime(DEFAULT_CLOSE_TIME);
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

  function updateSocialMediaField(field: keyof SocialMediaLinks, value: string) {
    const nextLinks = {
      ...emptySocialMediaLinks,
      ...socialLinks,
      [field]: value,
    };

    updateField("social_media_marketplace", serializeSocialMediaValue(nextLinks));
  }

  function resetForm() {
    navigate("/umkm/profile");
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
        phone_number: buildPhoneWithIndonesiaPrefix(form.phone_number ?? ""),
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
      navigate("/umkm/profile", { state: { profileUpdated: true } });
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
      <form className="umkm-profile-page umkm-profile-edit-page" onSubmit={handleSubmit} noValidate>
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
                  <div className="umkm-phone-input">
                    <span>+62</span>
                    <input
                      value={getPhoneLocalValue(form.phone_number ?? "")}
                      onChange={(e) =>
                        updateField("phone_number", buildPhoneWithIndonesiaPrefix(e.target.value))
                      }
                      placeholder="81234567890"
                      inputMode="numeric"
                    />
                  </div>
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
                  <div className="umkm-social-form">
                    <label>
                      <span>Instagram</span>
                      <div className="umkm-social-input">
                        <strong>@</strong>
                        <input
                          value={socialLinks.instagram.replace(/^@/, "")}
                          onChange={(e) => updateSocialMediaField("instagram", e.target.value)}
                          placeholder="namausaha"
                        />
                      </div>
                    </label>

                    <label>
                      <span>TikTok</span>
                      <div className="umkm-social-input">
                        <strong>@</strong>
                        <input
                          value={socialLinks.tiktok.replace(/^@/, "")}
                          onChange={(e) => updateSocialMediaField("tiktok", e.target.value)}
                          placeholder="namausaha"
                        />
                      </div>
                    </label>

                    <label>
                      <span>Shopee</span>
                      <input
                        value={socialLinks.shopee}
                        onChange={(e) => updateSocialMediaField("shopee", e.target.value)}
                        placeholder="Nama toko Shopee"
                      />
                    </label>

                    <label>
                      <span>Tokopedia</span>
                      <input
                        value={socialLinks.tokopedia}
                        onChange={(e) => updateSocialMediaField("tokopedia", e.target.value)}
                        placeholder="Nama toko Tokopedia"
                      />
                    </label>

                    <label className="umkm-social-form__full">
                      <span>Website / Katalog Online</span>
                      <input
                        value={socialLinks.website}
                        onChange={(e) => updateSocialMediaField("website", e.target.value)}
                        placeholder="https://contoh.com"
                      />
                    </label>
                  </div>
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
                  <ImagePlus size={18} />
                </span>
                Galeri Usaha
              </h2>

              <div className="umkm-gallery-edit-grid">
                <label>
                  Logo Usaha
                  <div className="umkm-placeholder-image" style={{ width: 160, maxWidth: 160, height: 160 }}>
                    <ImagePlus size={28} />
                    <span>Logo belum tersedia</span>
                  </div>
                </label>

                <label>
                  Foto Utama Usaha
                  <div className="umkm-placeholder-image">
                    <ImagePlus size={28} />
                    <span>Foto produk/toko belum tersedia</span>
                  </div>
                </label>

                <div className="umkm-soft-note">
                  <ImagePlus size={20} />
                  <div>
                    <strong>Upload gambar belum tersambung.</strong>
                    <p>
                      Bagian ini disiapkan untuk logo dan foto usaha. Integrasi upload akan
                      disambungkan melalui document-service/Garage pada milestone berikutnya.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="umkm-form-section">
              <h2>
                <span className="umkm-section-icon">
                  <Building2 size={18} />
                </span>
                Legalitas & Dokumen
              </h2>

              <div className="umkm-document-edit-grid">
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
                </aside>

                <div className="umkm-soft-note">
                  <FileText size={20} />
                  <div>
                    <strong>Dokumen legalitas belum dapat diunggah.</strong>
                    <p>
                      Status dokumen masih placeholder untuk demo. Nanti bagian ini dapat
                      dipakai untuk NIB, sertifikat halal, izin usaha, dan dokumen pendukung.
                    </p>
                  </div>
                </div>
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
