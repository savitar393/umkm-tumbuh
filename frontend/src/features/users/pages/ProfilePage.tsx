import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CheckCircle2, FileText, ImagePlus, MapPin, Store } from "lucide-react";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import {
  getMyProfile,
  updateMyProfile,
  type UmkmProfile,
  type UmkmProfilePayload,
} from "../api";

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

export default function ProfilePage() {
  const user = getCurrentUser();
  const [profile, setProfile] = useState<UmkmProfile | null>(null);
  const [form, setForm] = useState<UmkmProfilePayload>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setLoading(true);
      setError("");
      setMessage("");

      try {
        const response = await getMyProfile();

        if (ignore) return;

        const profile = response.profile as UmkmProfile;

        setProfile(profile);
        setForm(mapProfileToForm(profile));
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

  function updateField(field: keyof UmkmProfilePayload, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    if (profile) {
      setForm(mapProfileToForm(profile));
      setMessage("Perubahan dibatalkan.");
      setError("");
      return;
    }

    setForm({
      ...emptyForm,
      owner_name: user?.full_name ?? "",
    });
    setMessage("Form dikosongkan kembali.");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await updateMyProfile(form);
      const profile = response.profile as UmkmProfile;

      setProfile(profile);
      setForm(mapProfileToForm(profile));
      setMessage("Data berhasil diperbarui");
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
      <form className="umkm-profile-page" onSubmit={handleSubmit}>
        <div className="umkm-profile-header">
          {message ? (
            <div className="umkm-save-message">
              <CheckCircle2 size={18} />
              <span>{message}</span>
            </div>
          ) : null}

          {error ? <div className="error-message">{error}</div> : null}

          <h1>Kelola Informasi UMKM</h1>
          <p>Perbarui profil bisnis Anda untuk meningkatkan kepercayaan pelanggan dan mitra.</p>
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
                <label>
                  Nama UMKM
                  <input
                    value={form.business_name}
                    onChange={(e) => updateField("business_name", e.target.value)}
                    required
                  />
                </label>

                <label>
                  Nama Pemilik
                  <input
                    value={form.owner_name}
                    onChange={(e) => updateField("owner_name", e.target.value)}
                    required
                  />
                </label>

                <label>
                  Kategori Usaha
                  <select
                    value={form.business_category}
                    onChange={(e) => updateField("business_category", e.target.value)}
                    required
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
                </label>

                <label>
                  Tahun Berdiri
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    value={form.established_year ?? ""}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        established_year: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                  />
                </label>

                <label className="umkm-field-full">
                  Deskripsi Usaha
                  <textarea
                    value={form.business_description}
                    onChange={(e) => updateField("business_description", e.target.value)}
                    rows={4}
                  />
                </label>

                <label>
                  NIK Pemilik
                  <input
                    value={form.nik}
                    onChange={(e) => updateField("nik", e.target.value)}
                    required
                    minLength={16}
                    maxLength={16}
                    inputMode="numeric"
                  />
                </label>

                <label>
                  Status Profil
                  <input value={profile?.status ?? "Belum dibuat"} disabled />
                </label>
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
                <label>
                  Nomor WhatsApp
                  <input
                    value={form.phone_number}
                    onChange={(e) => updateField("phone_number", e.target.value)}
                    required
                  />
                </label>

                <label>
                  Email Bisnis
                  <input
                    type="email"
                    value={form.business_email}
                    onChange={(e) => updateField("business_email", e.target.value)}
                  />
                </label>

                <label className="umkm-field-full">
                  Alamat Lengkap
                  <textarea
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    required
                    rows={3}
                  />
                </label>

                <label>
                  Kota
                  <input
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    required
                  />
                </label>

                <label>
                  Provinsi
                  <input
                    value={form.province}
                    onChange={(e) => updateField("province", e.target.value)}
                    required
                  />
                </label>

                <label>
                  Kecamatan
                  <input
                    value={form.district}
                    onChange={(e) => updateField("district", e.target.value)}
                  />
                </label>

                <label>
                  Kelurahan/Desa
                  <input
                    value={form.village}
                    onChange={(e) => updateField("village", e.target.value)}
                  />
                </label>

                <label>
                  Kode Pos
                  <input
                    value={form.postal_code}
                    onChange={(e) => updateField("postal_code", e.target.value)}
                  />
                </label>

                <label>
                  Jam Operasional
                  <input
                    value={form.operating_hours}
                    onChange={(e) => updateField("operating_hours", e.target.value)}
                    placeholder="Contoh: Senin - Sabtu (08.00 - 17.00)"
                  />
                </label>

                <label className="umkm-field-full">
                  Media Sosial / Marketplace
                  <input
                    value={form.social_media_marketplace}
                    onChange={(e) => updateField("social_media_marketplace", e.target.value)}
                    placeholder="Contoh: Instagram @usahaku | Shopee Usahaku"
                  />
                </label>
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
                Cancel
              </button>
              <button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : profile ? "Save Changes" : "Buat Profil"}
              </button>
            </div>
          </>
        )}
      </form>
    </UmkmLayout>
  );
}
