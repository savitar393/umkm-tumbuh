import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile } from "../api";
import type { MitraProfilePayload } from "../api";

export default function EditMitraProfilePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<MitraProfilePayload>({
    organization_name: "",
    organization_type: "",
    description: "",
    contact_person: "",
    phone_number: "",
    address: "",
    city: "",
    province: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getProfile()
      .then((res) => {
        const p = res.profile;
        setForm({
          organization_name: p.name || "",
          organization_type: p.category || "",
          description: p.description || "",
          contact_person: p.person || "",
          phone_number: p.phone_number || "",
          address: p.address || "",
          city: p.city || "",
          province: p.province || "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await updateProfile(form);
      setSuccess("Profil Mitra berhasil disimpan!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof MitraProfilePayload>(key: K, value: MitraProfilePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p>Memuat profil...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card" style={{ maxWidth: 640 }}>
        <h1>Edit Profil Mitra</h1>
        <p>Lengkapi data organisasi / perusahaan mitra.</p>

        {success && <p className="success-message">{success}</p>}
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>
            Nama Organisasi *
            <input
              value={form.organization_name}
              onChange={(e) => set("organization_name", e.target.value)}
              required
            />
          </label>

          <label>
            Tipe Organisasi
            <input
              value={form.organization_type}
              onChange={(e) => set("organization_type", e.target.value)}
              placeholder="Misal: Korporasi, Yayasan, BUMN"
            />
          </label>

          <label>
            Deskripsi
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              style={{ minHeight: 80, font: "inherit", padding: "12px 14px", borderRadius: 14, border: "1px solid var(--border)", background: "#f9fafb", resize: "vertical" }}
            />
          </label>

          <label>
            Contact Person
            <input
              value={form.contact_person}
              onChange={(e) => set("contact_person", e.target.value)}
            />
          </label>

          <label>
            No. Telepon
            <input
              value={form.phone_number}
              onChange={(e) => set("phone_number", e.target.value)}
            />
          </label>

          <label>
            Alamat
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label>
              Kota
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </label>
            <label>
              Provinsi
              <input
                value={form.province}
                onChange={(e) => set("province", e.target.value)}
              />
            </label>
          </div>

          <button type="submit" disabled={saving} style={{ marginTop: 8 }}>
            {saving ? "Menyimpan..." : "Simpan Profil"}
          </button>

          <button
            type="button"
            className="button secondary"
            onClick={() => navigate("/mitra")}
            style={{ width: "100%" }}
          >
            Kembali ke Dashboard
          </button>
        </form>
      </section>
    </main>
  );
}
