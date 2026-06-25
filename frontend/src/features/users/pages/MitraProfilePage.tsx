import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CheckCircle2, FileText, Handshake, MapPin } from "lucide-react";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import {
  getMyProfile,
  updateMyProfile,
  type MitraProfile,
  type MitraProfilePayload,
} from "../api";

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

function mapProfileToForm(profile: MitraProfile): MitraProfilePayload {
  return {
    organization_name: profile.organization_name ?? "",
    organization_type: profile.organization_type ?? "",
    legal_name: profile.legal_name ?? "",
    nib: profile.nib ?? "",
    npwp: profile.npwp ?? "",
    description: profile.description ?? "",
    contact_person: profile.contact_person ?? "",
    contact_person_title: profile.contact_person_title ?? "",
    phone_number: profile.phone_number ?? "",
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

export default function MitraProfilePage() {
  const user = getCurrentUser();
  const [profile, setProfile] = useState<MitraProfile | null>(null);
  const [form, setForm] = useState<MitraProfilePayload>(emptyForm);
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
        const profile = response.profile as MitraProfile;

        if (ignore) return;

        setProfile(profile);
        setForm(mapProfileToForm(profile));
      } catch (err) {
        if (ignore) return;

        const msg = err instanceof Error ? err.message : "Gagal memuat profil mitra.";

        if (msg.toLowerCase().includes("profil belum dibuat")) {
          setProfile(null);
          setForm({
            ...emptyForm,
            contact_person: user?.full_name ?? "",
          });
          setMessage("Profil mitra belum dibuat. Lengkapi data organisasi terlebih dahulu.");
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

  function updateField(field: keyof MitraProfilePayload, value: string) {
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
      contact_person: user?.full_name ?? "",
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
      const profile = response.profile as MitraProfile;

      setProfile(profile);
      setForm(mapProfileToForm(profile));
      setMessage("Profil mitra berhasil diperbarui.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil mitra.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-card">
          <h1>Profil Mitra</h1>
          <p>Sesi login tidak ditemukan.</p>
          <Link to="/login">Kembali ke login</Link>
        </section>
      </main>
    );
  }

  if (user.role !== "MITRA") {
    return (
      <main className="dashboard-page">
        <section className="dashboard-card">
          <h1>Profil Mitra</h1>
          <p>Halaman ini hanya tersedia untuk akun Mitra.</p>
          <Link to="/umkm">Kembali</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <form className="umkm-profile-page" onSubmit={handleSubmit}>
        <div className="umkm-profile-header">
          {message ? (
            <div className="umkm-save-message">
              <CheckCircle2 size={18} />
              <span>{message}</span>
            </div>
          ) : null}

          {error ? <div className="error-message">{error}</div> : null}

          <h1>Kelola Profil Mitra</h1>
          <p>
            Lengkapi informasi organisasi agar UMKM dan admin dapat memahami
            kapasitas kerja sama yang ditawarkan.
          </p>
        </div>

        {loading ? (
          <section className="umkm-form-section">
            <p>Memuat profil mitra...</p>
          </section>
        ) : (
          <>
            <section className="umkm-form-section">
              <h2>
                <span className="umkm-section-icon">
                  <Building2 size={18} />
                </span>
                Informasi Organisasi
              </h2>

              <div className="umkm-form-grid">
                <label>
                  Nama Organisasi
                  <input
                    value={form.organization_name}
                    onChange={(e) => updateField("organization_name", e.target.value)}
                    required
                  />
                </label>

                <label>
                  Jenis Organisasi
                  <select
                    value={form.organization_type}
                    onChange={(e) => updateField("organization_type", e.target.value)}
                    required
                  >
                    <option value="">Pilih jenis organisasi</option>
                    <option value="Perusahaan">Perusahaan</option>
                    <option value="Komunitas">Komunitas</option>
                    <option value="Lembaga Pendidikan">Lembaga Pendidikan</option>
                    <option value="Lembaga Keuangan">Lembaga Keuangan</option>
                    <option value="Pemerintah">Pemerintah</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </label>

                <label>
                  Nama Legal
                  <input
                    value={form.legal_name ?? ""}
                    onChange={(e) => updateField("legal_name", e.target.value)}
                    placeholder="Contoh: PT Mitra Sejahtera Indonesia"
                  />
                </label>

                <label>
                  Status Profil
                  <input value={profile?.status ?? "Belum dibuat"} disabled />
                </label>

                <label>
                  NIB
                  <input
                    value={form.nib ?? ""}
                    onChange={(e) => updateField("nib", e.target.value)}
                  />
                </label>

                <label>
                  NPWP
                  <input
                    value={form.npwp ?? ""}
                    onChange={(e) => updateField("npwp", e.target.value)}
                  />
                </label>

                <label className="umkm-field-full">
                  Deskripsi Organisasi
                  <textarea
                    value={form.description ?? ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={4}
                    placeholder="Jelaskan bidang, pengalaman, dan bentuk dukungan organisasi."
                  />
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
                  Contact Person
                  <input
                    value={form.contact_person}
                    onChange={(e) => updateField("contact_person", e.target.value)}
                    required
                  />
                </label>

                <label>
                  Jabatan Contact Person
                  <input
                    value={form.contact_person_title ?? ""}
                    onChange={(e) => updateField("contact_person_title", e.target.value)}
                    placeholder="Contoh: Partnership Manager"
                  />
                </label>

                <label>
                  Nomor Telepon
                  <input
                    value={form.phone_number}
                    onChange={(e) => updateField("phone_number", e.target.value)}
                    required
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
                    value={form.district ?? ""}
                    onChange={(e) => updateField("district", e.target.value)}
                  />
                </label>

                <label>
                  Kelurahan/Desa
                  <input
                    value={form.village ?? ""}
                    onChange={(e) => updateField("village", e.target.value)}
                  />
                </label>

                <label>
                  Kode Pos
                  <input
                    value={form.postal_code ?? ""}
                    onChange={(e) => updateField("postal_code", e.target.value)}
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
              </div>
            </section>

            <section className="umkm-form-section">
              <h2>
                <span className="umkm-section-icon">
                  <Handshake size={18} />
                </span>
                Kapasitas Kerja Sama
              </h2>

              <div className="umkm-form-grid">
                <label>
                  Skala Kerja Sama
                  <select
                    value={form.cooperation_scale ?? ""}
                    onChange={(e) => updateField("cooperation_scale", e.target.value)}
                  >
                    <option value="">Pilih skala</option>
                    <option value="Lokal">Lokal</option>
                    <option value="Regional">Regional</option>
                    <option value="Nasional">Nasional</option>
                    <option value="Internasional">Internasional</option>
                  </select>
                </label>

                <label>
                  Wilayah Operasional
                  <input
                    value={form.operational_area ?? ""}
                    onChange={(e) => updateField("operational_area", e.target.value)}
                    placeholder="Contoh: Surakarta dan sekitarnya"
                  />
                </label>

                <aside className="umkm-document-card umkm-field-full">
                  <h3>STATUS DOKUMEN MITRA</h3>

                  <div className="umkm-doc-row">
                    <span>NIB / Legalitas Organisasi</span>
                    <span>{form.nib ? "Terisi" : "Belum terisi"}</span>
                  </div>

                  <div className="umkm-doc-row">
                    <span>NPWP</span>
                    <span>{form.npwp ? "Terisi" : "Belum terisi"}</span>
                  </div>

                  <div className="umkm-doc-row pending">
                    <span>
                      <FileText size={16} /> Dokumen pendukung
                    </span>
                    <span>Via document-service nanti</span>
                  </div>
                </aside>
              </div>
            </section>

            <div className="umkm-profile-actions">
              <button className="umkm-secondary-btn" type="button" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : profile ? "Save Changes" : "Buat Profil Mitra"}
              </button>
            </div>
          </>
        )}
      </form>
    </main>
  );
}
