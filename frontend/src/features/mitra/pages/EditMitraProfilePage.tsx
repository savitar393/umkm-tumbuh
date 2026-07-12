import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, FileText, Handshake, MapPin, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getProfile, updateProfile, type MitraProfile, type MitraProfilePayload } from "../api";
import "./mitra-profile.css";

type FormErrors = Partial<Record<keyof MitraProfilePayload, string>>;

const ORGANIZATION_TYPES = [
  "Perusahaan Swasta",
  "Pemerintah Daerah",
  "Perguruan Tinggi",
  "Komunitas Bisnis",
  "Koperasi",
  "Lembaga Keuangan",
  "Lembaga Pelatihan",
  "Marketplace",
  "Logistik",
  "Inkubator Bisnis",
  "BUMN",
  "Lainnya",
];

const COOPERATION_SCALES = ["Lokal", "Regional", "Nasional", "Internasional"];

const emptyForm: MitraProfilePayload = {
  organization_name: "",
  organization_type: "",
  legal_name: "",
  nib: "",
  npwp: "",
  description: "",
  contact_person: "",
  contact_person_title: "",
  phone_number: "",
  address: "",
  city: "",
  province: "",
  district: "",
  village: "",
  postal_code: "",
  operational_area: "",
  cooperation_scale: "",
};

function onlyDigits(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

function toLocalIndonesiaPhone(value?: string | null) {
  let digits = onlyDigits(value);

  if (digits.startsWith("62")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);

  return digits;
}

function optional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function mapProfileToForm(profile: MitraProfile): MitraProfilePayload {
  return {
    organization_name: profile.organization_name ?? profile.name ?? "",
    organization_type: profile.organization_type ?? profile.category ?? "",
    legal_name: profile.legal_name ?? "",
    nib: profile.nib ?? "",
    npwp: profile.npwp ?? "",
    description: profile.description ?? "",
    contact_person: profile.contact_person ?? profile.person ?? "",
    contact_person_title: profile.contact_person_title ?? "",
    phone_number: toLocalIndonesiaPhone(profile.phone_number),
    address: profile.address ?? "",
    city: profile.city ?? "",
    province: profile.province ?? "",
    district: profile.district ?? "",
    village: profile.village ?? "",
    postal_code: profile.postal_code ?? "",
    operational_area: profile.operational_area ?? "",
    cooperation_scale: profile.cooperation_scale ?? "",
  };
}

function validateForm(form: MitraProfilePayload): FormErrors {
  const errors: FormErrors = {};
  const phone = toLocalIndonesiaPhone(form.phone_number);

  if (!form.organization_name.trim()) {
    errors.organization_name = "Nama organisasi wajib diisi.";
  }

  if (!form.organization_type?.trim()) {
    errors.organization_type = "Jenis organisasi wajib dipilih.";
  }

  if (!form.contact_person?.trim()) {
    errors.contact_person = "Contact person wajib diisi.";
  } else if (!/^[A-Za-zÀ-ÿ'.\s-]+$/.test(form.contact_person.trim())) {
    errors.contact_person = "Nama contact person hanya boleh berisi huruf, spasi, titik, apostrof, atau tanda hubung.";
  }

  if (!phone) {
    errors.phone_number = "Nomor telepon wajib diisi.";
  } else if (phone.length < 9 || phone.length > 13) {
    errors.phone_number = "Nomor telepon harus berisi 9–13 digit setelah +62.";
  }

  if (!form.address?.trim()) {
    errors.address = "Alamat lengkap wajib diisi.";
  }

  if (!form.city?.trim()) {
    errors.city = "Kota wajib diisi.";
  }

  if (!form.province?.trim()) {
    errors.province = "Provinsi wajib diisi.";
  }

  if (form.postal_code && !/^\d{5}$/.test(form.postal_code.trim())) {
    errors.postal_code = "Kode pos harus berisi 5 digit.";
  }

  if (form.nib && !/^\d{10,20}$/.test(onlyDigits(form.nib))) {
    errors.nib = "NIB hanya boleh berisi angka, sekitar 10–20 digit.";
  }

  return errors;
}

function FieldError({ message }: { message?: string }) {
  return message ? <em className="mitra-profile-field-error">{message}</em> : null;
}

export default function EditMitraProfilePage() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [profile, setProfile] = useState<MitraProfile | null>(null);
  const [form, setForm] = useState<MitraProfilePayload>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setLoading(true);
      setPageError("");

      try {
        const response = await getProfile();
        if (ignore) return;

        setProfile(response.profile);
        setForm(mapProfileToForm(response.profile));
      } catch (err) {
        if (ignore) return;

        setPageError(err instanceof Error ? err.message : "Gagal memuat profil mitra.");
        setForm({
          ...emptyForm,
          contact_person: user?.full_name ?? "",
        });
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [user?.full_name]);

  function updateField(field: keyof MitraProfilePayload, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function cancelEdit() {
    navigate("/mitra/profile");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const localPhone = toLocalIndonesiaPhone(form.phone_number);

    const payload: MitraProfilePayload = {
      organization_name: form.organization_name.trim(),
      organization_type: optional(form.organization_type),
      legal_name: optional(form.legal_name),
      nib: optional(form.nib),
      npwp: optional(form.npwp),
      description: optional(form.description),
      contact_person: optional(form.contact_person),
      contact_person_title: optional(form.contact_person_title),
      phone_number: localPhone ? `62${localPhone}` : undefined,
      address: optional(form.address),
      city: optional(form.city),
      province: optional(form.province),
      district: optional(form.district),
      village: optional(form.village),
      postal_code: optional(form.postal_code),
      operational_area: optional(form.operational_area),
      cooperation_scale: optional(form.cooperation_scale),
    };

    setSaving(true);
    setPageError("");

    try {
      await updateProfile(payload);
      navigate("/mitra/profile", { state: { saved: true } });
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Gagal menyimpan profil mitra.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <main className="mitra-profile-page">
        <section className="mitra-profile-card">
          <h1>Edit Profil Mitra</h1>
          <p>Sesi login tidak ditemukan.</p>
        </section>
      </main>
    );
  }

  return (
    <UmkmLayout
      title="Edit Informasi Mitra"
      subtitle="Ubah data organisasi, kontak, lokasi, dan kapasitas kerja sama mitra."
    >
      <main className="mitra-profile-page">
        {pageError ? <div className="mitra-profile-error">{pageError}</div> : null}

      {loading ? (
        <section className="mitra-profile-card">
          <p>Memuat profil mitra...</p>
        </section>
      ) : (
        <form className="mitra-profile-form" onSubmit={handleSubmit}>
          <section className="mitra-profile-card">
            <h2>
              <span>
                <Building2 size={18} />
              </span>
              Informasi Organisasi
            </h2>

            <div className="mitra-profile-form-grid">
              <label className={errors.organization_name ? "has-error" : ""}>
                <span className="mitra-profile-label-text">
                  Nama Organisasi <strong>*</strong>
                </span>
                <input
                  value={form.organization_name}
                  onChange={(event) => updateField("organization_name", event.target.value)}
                  placeholder="Contoh: Inkubator Mandiri Sejahtera"
                />
                <FieldError message={errors.organization_name} />
              </label>

              <label className={errors.organization_type ? "has-error" : ""}>
                <span className="mitra-profile-label-text">
                  Jenis Organisasi <strong>*</strong>
                </span>
                <select
                  value={form.organization_type ?? ""}
                  onChange={(event) => updateField("organization_type", event.target.value)}
                >
                  <option value="">Pilih jenis organisasi</option>
                  {ORGANIZATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.organization_type} />
              </label>

              <label>
                Nama Legal
                <input
                  value={form.legal_name ?? ""}
                  onChange={(event) => updateField("legal_name", event.target.value)}
                  placeholder="Contoh: PT Inkubator Mandiri Sejahtera"
                />
              </label>

              <div className="mitra-profile-readonly-status">
                <span>Status Profil</span>
                <strong>{profile?.status ?? "AKTIF"}</strong>
              </div>

              <label className={errors.nib ? "has-error" : ""}>
                NIB
                <input
                  value={form.nib ?? ""}
                  onChange={(event) => updateField("nib", event.target.value)}
                  placeholder="Nomor Induk Berusaha"
                />
                <FieldError message={errors.nib} />
              </label>

              <label>
                NPWP
                <input
                  value={form.npwp ?? ""}
                  onChange={(event) => updateField("npwp", event.target.value)}
                  placeholder="Contoh: 01.234.567.8-001.000"
                />
              </label>

              <label className="full">
                Deskripsi Organisasi
                <textarea
                  value={form.description ?? ""}
                  onChange={(event) => updateField("description", event.target.value)}
                  rows={4}
                  placeholder="Jelaskan bidang, pengalaman, dan bentuk dukungan organisasi."
                />
              </label>
            </div>
          </section>

          <section className="mitra-profile-card">
            <h2>
              <span>
                <MapPin size={18} />
              </span>
              Kontak & Lokasi
            </h2>

            <div className="mitra-profile-form-grid">
              <label className={errors.contact_person ? "has-error" : ""}>
                <span className="mitra-profile-label-text">
                  Contact Person <strong>*</strong>
                </span>
                <input
                  value={form.contact_person ?? ""}
                  onChange={(event) => updateField("contact_person", event.target.value)}
                  placeholder="Nama PIC utama"
                />
                <FieldError message={errors.contact_person} />
              </label>

              <label>
                Jabatan Contact Person
                <input
                  value={form.contact_person_title ?? ""}
                  onChange={(event) => updateField("contact_person_title", event.target.value)}
                  placeholder="Contoh: Koordinator Kemitraan"
                />
              </label>

              <label className={errors.phone_number ? "has-error" : ""}>
                <span className="mitra-profile-label-text">
                  Nomor Telepon <strong>*</strong>
                </span>
                <div className="mitra-phone-input">
                  <span>+62</span>
                  <input
                    value={form.phone_number ?? ""}
                    onChange={(event) => updateField("phone_number", event.target.value.replace(/\D/g, ""))}
                    placeholder="81234567890"
                  />
                </div>
                <FieldError message={errors.phone_number} />
              </label>

              <label className={errors.city ? "has-error" : ""}>
                <span className="mitra-profile-label-text">
                  Kota <strong>*</strong>
                </span>
                <input
                  value={form.city ?? ""}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="Contoh: Sleman"
                />
                <FieldError message={errors.city} />
              </label>

              <label className={errors.province ? "has-error" : ""}>
                <span className="mitra-profile-label-text">
                  Provinsi <strong>*</strong>
                </span>
                <input
                  value={form.province ?? ""}
                  onChange={(event) => updateField("province", event.target.value)}
                  placeholder="Contoh: DI Yogyakarta"
                />
                <FieldError message={errors.province} />
              </label>

              <label>
                Kecamatan
                <input
                  value={form.district ?? ""}
                  onChange={(event) => updateField("district", event.target.value)}
                  placeholder="Contoh: Depok"
                />
              </label>

              <label>
                Kelurahan/Desa
                <input
                  value={form.village ?? ""}
                  onChange={(event) => updateField("village", event.target.value)}
                  placeholder="Contoh: Caturtunggal"
                />
              </label>

              <label className={errors.postal_code ? "has-error" : ""}>
                Kode Pos
                <input
                  value={form.postal_code ?? ""}
                  onChange={(event) => updateField("postal_code", event.target.value.replace(/\D/g, ""))}
                  placeholder="Contoh: 55281"
                  maxLength={5}
                />
                <FieldError message={errors.postal_code} />
              </label>

              <label className={`full ${errors.address ? "has-error" : ""}`}>
                <span className="mitra-profile-label-text">
                  Alamat Lengkap <strong>*</strong>
                </span>
                <textarea
                  value={form.address ?? ""}
                  onChange={(event) => updateField("address", event.target.value)}
                  rows={3}
                  placeholder="Alamat kantor atau lokasi operasional utama."
                />
                <FieldError message={errors.address} />
              </label>
            </div>
          </section>

          <section className="mitra-profile-card">
            <h2>
              <span>
                <Handshake size={18} />
              </span>
              Kapasitas Kerja Sama
            </h2>

            <div className="mitra-profile-form-grid">
              <label>
                Skala Kerja Sama
                <select
                  value={form.cooperation_scale ?? ""}
                  onChange={(event) => updateField("cooperation_scale", event.target.value)}
                >
                  <option value="">Pilih skala kerja sama</option>
                  {COOPERATION_SCALES.map((scale) => (
                    <option key={scale} value={scale}>
                      {scale}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Wilayah Operasional
                <input
                  value={form.operational_area ?? ""}
                  onChange={(event) => updateField("operational_area", event.target.value)}
                  placeholder="Contoh: Jawa-Bali / Nasional / Online Nasional"
                />
              </label>
            </div>
          </section>

          <section className="mitra-profile-card">
            <h2>
              <span>
                <ShieldCheck size={18} />
              </span>
              Legalitas & Dokumen
            </h2>

            <div className="mitra-profile-document-placeholder">
              <FileText size={22} />
              <div>
                <strong>Upload dokumen belum tersambung.</strong>
                <p>
                  NIB, NPWP, dan dokumen pendukung akan dikelola melalui document-service pada milestone berikutnya.
                </p>
              </div>
            </div>
          </section>

          <div className="mitra-profile-actions">
            <button type="button" className="secondary" onClick={cancelEdit}>
              Batal
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      )}
      </main>
    </UmkmLayout>
  );
}
