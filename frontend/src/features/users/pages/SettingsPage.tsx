import { useEffect, useState } from "react";
import { User, Phone, Mail, Shield, CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getMyProfile, updateMyProfile, type UmkmProfile } from "../api";

export default function SettingsPage() {
  const user = getCurrentUser();
  const [profile, setProfile] = useState<UmkmProfile | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getMyProfile();
        const p = data.profile as UmkmProfile;
        setProfile(p);
        setPhoneNumber(p.phone_number || "");
      } catch {
        setError("Gagal memuat profil");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateMyProfile({ ...profile, phone_number: phoneNumber });
      setProfile(updated.profile as UmkmProfile);
      setMessage("Nomor HP berhasil diperbarui");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <UmkmLayout>
        <p>Sesi login tidak ditemukan.</p>
      </UmkmLayout>
    );
  }

  return (
    <UmkmLayout>
      <div className="umkm-profile-page">
        <div className="umkm-profile-header">
          <h1>Pengaturan</h1>
          <p>Informasi akun dan profil Anda.</p>
        </div>

        {message ? (
          <div className="umkm-save-message">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        ) : null}
        {error ? <div className="error-message">{error}</div> : null}

        {loading ? (
          <section className="umkm-form-section"><p>Memuat...</p></section>
        ) : (
          <>
            <section className="umkm-form-section">
              <h2>
                <span className="umkm-section-icon"><User size={18} /></span>
                Informasi Akun
              </h2>
              <div className="umkm-form-grid">
                <label>
                  Nama Lengkap
                  <div className="umkm-settings-readonly">
                    <User size={16} />
                    <span>{user.full_name}</span>
                  </div>
                </label>
                <label>
                  Role
                  <div className="umkm-settings-readonly">
                    <Shield size={16} />
                    <span>{user.role === "UMKM" ? "Owner UMKM" : user.role}</span>
                  </div>
                </label>
                <label>
                  Email
                  <div className="umkm-settings-readonly">
                    <Mail size={16} />
                    <span>{user.email}</span>
                  </div>
                </label>
                <label>
                  Nomor HP
                  <div className="umkm-settings-input-wrap">
                    <Phone size={16} />
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Masukkan nomor HP"
                    />
                  </div>
                </label>
              </div>
            </section>

            <div className="umkm-profile-actions">
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ marginLeft: "auto" }}
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </>
        )}
      </div>
    </UmkmLayout>
  );
}
