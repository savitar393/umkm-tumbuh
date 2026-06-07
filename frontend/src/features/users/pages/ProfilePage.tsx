import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../../../shared/auth/currentUser";
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

        setProfile(response.profile);
        setForm({
          business_name: response.profile.business_name ?? "",
          business_category: response.profile.business_category ?? "",
          business_description: response.profile.business_description ?? "",
          owner_name: response.profile.owner_name ?? "",
          nik: response.profile.nik ?? "",
          phone_number: response.profile.phone_number ?? "",
          address: response.profile.address ?? "",
          city: response.profile.city ?? "",
          province: response.profile.province ?? "",
          district: response.profile.district ?? "",
          village: response.profile.village ?? "",
          postal_code: response.profile.postal_code ?? "",
        });
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await updateMyProfile(form);
      setProfile(response.profile);
      setMessage("Profil UMKM berhasil disimpan.");
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
    <main className="dashboard-page">
      <section className="dashboard-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <h1>Profil UMKM</h1>
            <p>Login sebagai: {user.full_name}</p>
          </div>
          <Link to="/umkm">Kembali ke Dashboard</Link>
        </div>

        {loading ? <p>Memuat profil...</p> : null}
        {message ? <p>{message}</p> : null}
        {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

        {!loading ? (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
            <label>
              Nama Usaha
              <input
                value={form.business_name}
                onChange={(e) => updateField("business_name", e.target.value)}
                required
              />
            </label>

            <label>
              Kategori Usaha
              <input
                value={form.business_category}
                onChange={(e) => updateField("business_category", e.target.value)}
                required
              />
            </label>

            <label>
              Deskripsi Usaha
              <textarea
                value={form.business_description}
                onChange={(e) => updateField("business_description", e.target.value)}
                rows={3}
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
              NIK
              <input
                value={form.nik}
                onChange={(e) => updateField("nik", e.target.value)}
                required
                minLength={16}
                maxLength={16}
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
              Alamat
              <textarea
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                required
                rows={2}
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

            <button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : profile ? "Simpan Perubahan" : "Buat Profil"}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
