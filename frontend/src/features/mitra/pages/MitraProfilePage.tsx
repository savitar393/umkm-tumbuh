import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Edit3,
  FileText,
  Globe2,
  Handshake,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  // User,
} from "lucide-react";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getProfile, type MitraProfile } from "../api";
import "./mitra-profile.css";

function fallback(value?: string | null, fallbackValue = "-") {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallbackValue;
}

function profileName(profile: MitraProfile | null, userName?: string) {
  return fallback(profile?.organization_name ?? profile?.name, userName || "Profil Mitra");
}

function profileType(profile: MitraProfile | null) {
  return fallback(profile?.organization_type ?? profile?.category, "Jenis belum diisi");
}

function contactName(profile: MitraProfile | null) {
  return fallback(profile?.contact_person ?? profile?.person, "PIC belum diisi");
}

function formatPhone(value?: string | null) {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return "-";

  if (digits.startsWith("62")) return `+${digits}`;
  if (digits.startsWith("0")) return `+62 ${digits.slice(1)}`;

  return `+62 ${digits}`;
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fullAddress(profile: MitraProfile | null) {
  const parts = [
    profile?.address,
    profile?.village,
    profile?.district,
    profile?.city,
    profile?.province,
    profile?.postal_code,
  ]
    .map((item) => item?.trim())
    .filter(Boolean);

  return parts.length ? parts.join(", ") : "-";
}

function FieldCard({
  label,
  value,
  large,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className={large ? "mitra-profile-field large" : "mitra-profile-field"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function MitraProfilePage() {
  const user = getCurrentUser();
  const location = useLocation();
  const [profile, setProfile] = useState<MitraProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const saved = Boolean((location.state as { saved?: boolean } | null)?.saved);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await getProfile();
        if (!ignore) setProfile(response.profile);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Gagal memuat profil mitra.");
          setProfile(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  const completeness = useMemo(() => {
    const checks = [
      {
        label: "Profil organisasi",
        done: Boolean(profileName(profile, user?.full_name) && profileType(profile) !== "Jenis belum diisi"),
      },
      {
        label: "Kontak mitra",
        done: Boolean(contactName(profile) !== "PIC belum diisi" && profile?.phone_number),
      },
      {
        label: "Lokasi operasional",
        done: Boolean(profile?.address && profile?.city && profile?.province),
      },
      {
        label: "Kapasitas kerja sama",
        done: Boolean(profile?.operational_area || profile?.cooperation_scale),
      },
      {
        label: "Legalitas dasar",
        done: Boolean(profile?.nib || profile?.npwp),
      },
    ];

    const doneCount = checks.filter((item) => item.done).length;
    return {
      checks,
      percent: Math.round((doneCount / checks.length) * 100),
    };
  }, [profile, user?.full_name]);

  if (!user) {
    return (
      <main className="mitra-profile-page">
        <section className="mitra-profile-card">
          <h1>Informasi Mitra</h1>
          <p>Sesi login tidak ditemukan.</p>
          <Link to="/login">Kembali ke login</Link>
        </section>
      </main>
    );
  }

  return (
    <UmkmLayout
      title="Informasi Mitra"
      subtitle="Lihat profil organisasi yang digunakan UMKM dan admin untuk menilai kapasitas kerja sama."
    >
      <main className="mitra-profile-page">
        <div className="mitra-profile-page-toolbar">
          <Link className="mitra-profile-edit-button" to="/mitra/profile/edit">
            <Edit3 size={18} />
            Edit Profil
          </Link>
        </div>

      {saved ? (
        <div className="mitra-profile-toast">
          <CheckCircle2 size={18} />
          Profil mitra berhasil diperbarui.
        </div>
      ) : null}

      {error ? <div className="mitra-profile-error">{error}</div> : null}

      {loading ? (
        <section className="mitra-profile-card">
          <p>Memuat profil mitra...</p>
        </section>
      ) : (
        <>
          <section className="mitra-profile-hero-grid">
            <article className="mitra-profile-hero">
              <div className="mitra-profile-badges">
                <span>Profil Mitra</span>
                <span className="success">{fallback(profile?.status, "Aktif")}</span>
              </div>

              <h2>{profileName(profile, user.full_name)}</h2>
              <p>{fallback(profile?.description, "Deskripsi organisasi belum diisi.")}</p>

              <div className="mitra-profile-tags">
                <span>{profileType(profile)}</span>
                <span>{fallback(profile?.cooperation_scale, "Skala belum diisi")}</span>
                <span>{fallback(profile?.city, "Lokasi belum diisi")}</span>
              </div>

              <div className="mitra-profile-contact-list">
                <span>
                  <Phone size={18} />
                  {formatPhone(profile?.phone_number)}
                </span>
                <span>
                  <Mail size={18} />
                  {fallback(profile?.email, user.email)}
                </span>
                <span>
                  <MapPin size={18} />
                  {fullAddress(profile)}
                </span>
                <span>
                  <Globe2 size={18} />
                  {fallback(profile?.operational_area, "Wilayah operasional belum diisi")}
                </span>
              </div>
            </article>

            <aside className="mitra-profile-credibility">
              <span className="mitra-profile-card-label">Status Kredibilitas</span>
              <strong>{completeness.percent}% lengkap</strong>
              <div className="mitra-profile-progress">
                <span style={{ width: `${completeness.percent}%` }} />
              </div>

              <div className="mitra-profile-checklist">
                {completeness.checks.map((item) => (
                  <div key={item.label} className={item.done ? "done" : ""}>
                    <CheckCircle2 size={16} />
                    {item.label}
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <section className="mitra-profile-section-grid">
            <article className="mitra-profile-card">
              <h2>
                <span>
                  <Building2 size={18} />
                </span>
                Informasi Organisasi
              </h2>

              <div className="mitra-profile-fields">
                <FieldCard label="Nama Organisasi" value={profileName(profile, user.full_name)} />
                <FieldCard label="Jenis Organisasi" value={profileType(profile)} />
                <FieldCard label="Nama Legal" value={fallback(profile?.legal_name)} />
                <FieldCard label="Status Profil" value={fallback(profile?.status, "Aktif")} />
                <FieldCard label="NIB" value={fallback(profile?.nib)} />
                <FieldCard label="NPWP" value={fallback(profile?.npwp)} />
                <FieldCard
                  label="Deskripsi Organisasi"
                  value={fallback(profile?.description, "Deskripsi organisasi belum diisi.")}
                  large
                />
                <FieldCard label="Terakhir Diperbarui" value={formatDate(profile?.updated_at)} />
              </div>
            </article>

            <article className="mitra-profile-card">
              <h2>
                <span>
                  <MapPin size={18} />
                </span>
                Kontak & Lokasi
              </h2>

              <div className="mitra-profile-fields">
                <FieldCard label="Contact Person" value={contactName(profile)} />
                <FieldCard label="Jabatan PIC" value={fallback(profile?.contact_person_title)} />
                <FieldCard label="Nomor Telepon" value={formatPhone(profile?.phone_number)} />
                <FieldCard label="Email" value={fallback(profile?.email, user.email)} />
                <FieldCard label="Kota" value={fallback(profile?.city)} />
                <FieldCard label="Provinsi" value={fallback(profile?.province)} />
                <FieldCard label="Kecamatan" value={fallback(profile?.district)} />
                <FieldCard label="Kelurahan/Desa" value={fallback(profile?.village)} />
                <FieldCard label="Alamat Lengkap" value={fullAddress(profile)} large />
              </div>
            </article>
          </section>

          <section className="mitra-profile-section-grid">
            <article className="mitra-profile-card">
              <h2>
                <span>
                  <Handshake size={18} />
                </span>
                Kapasitas Kerja Sama
              </h2>

              <div className="mitra-profile-fields">
                <FieldCard label="Skala Kerja Sama" value={fallback(profile?.cooperation_scale)} />
                <FieldCard label="Wilayah Operasional" value={fallback(profile?.operational_area)} />
                <FieldCard
                  label="Bentuk Dukungan"
                  value={fallback(profile?.description, "Belum ada detail dukungan.")}
                  large
                />
              </div>
            </article>

            <article className="mitra-profile-card">
              <h2>
                <span>
                  <ShieldCheck size={18} />
                </span>
                Legalitas & Dokumen
              </h2>

              <div className="mitra-profile-doc-list">
                <div>
                  <FileText size={18} />
                  <span>NIB / Legalitas Organisasi</span>
                  <strong>{profile?.nib ? "Terisi" : "Belum terisi"}</strong>
                </div>
                <div>
                  <FileText size={18} />
                  <span>NPWP</span>
                  <strong>{profile?.npwp ? "Terisi" : "Belum terisi"}</strong>
                </div>
                <div className="muted">
                  <FileText size={18} />
                  <span>Dokumen Pendukung</span>
                  <strong>Coming soon</strong>
                </div>
              </div>

              <p className="mitra-profile-note">
                Upload dokumen legalitas akan disambungkan melalui document-service pada milestone berikutnya.
              </p>
            </article>
          </section>
        </>
      )}
      </main>
    </UmkmLayout>
  );
}
