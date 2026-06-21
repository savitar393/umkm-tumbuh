import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  ImagePlus,
  Mail,
  MapPin,
  MapPinned,
  Phone,
  ShieldCheck,
  Store,
} from "lucide-react";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getMyProfile, type UmkmProfile } from "../api";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function hasValue(value?: string | null) {
  return Boolean(value && value.trim());
}

function isValidEmail(value?: string | null) {
  if (!hasValue(value)) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function isValidIndonesianPhone(value?: string | null) {
  const digits = onlyDigits(value ?? "");
  if (digits.length < 10 || digits.length > 15) return false;
  return digits.startsWith("08") || digits.startsWith("62");
}

function buildFullAddress(profile: UmkmProfile) {
  return [
    profile.address,
    profile.village,
    profile.district,
    profile.city,
    profile.province,
    profile.postal_code,
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getCompletenessItems(profile: UmkmProfile) {
  return [
    {
      label: "Profil dasar",
      done:
        hasValue(profile.business_name) &&
        hasValue(profile.owner_name) &&
        hasValue(profile.business_category) &&
        onlyDigits(profile.nik ?? "").length === 16,
    },
    {
      label: "Kontak usaha",
      done: isValidIndonesianPhone(profile.phone_number) && isValidEmail(profile.business_email),
    },
    {
      label: "Lokasi usaha",
      done: hasValue(profile.address) && hasValue(profile.city) && hasValue(profile.province),
    },
    {
      label: "Jam operasional",
      done: hasValue(profile.operating_hours),
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

function EmptyText({ children = "Belum diisi" }: { children?: string }) {
  return <span className="umkm-empty-text">{children}</span>;
}

export default function ProfilePage() {
  const user = getCurrentUser();

  const [profile, setProfile] = useState<UmkmProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fullAddress = useMemo(() => (profile ? buildFullAddress(profile) : ""), [profile]);

  const completenessItems = useMemo(
    () => (profile ? getCompletenessItems(profile) : []),
    [profile],
  );

  const completedCount = completenessItems.filter((item) => item.done).length;
  const completenessPercent =
    completenessItems.length > 0
      ? Math.round((completedCount / completenessItems.length) * 100)
      : 0;

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await getMyProfile();
        if (!ignore) setProfile(response.profile as UmkmProfile);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Gagal memuat profil.");
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
      <main className="umkm-profile-page umkm-profile-view-page">
        <section className="umkm-profile-header umkm-profile-view-header">
          <div>
            <h1>Informasi UMKM</h1>
            <p>Lihat profil bisnis yang digunakan untuk membangun kredibilitas UMKM Anda.</p>
          </div>

          <Link className="button umkm-profile-edit-button" to="/umkm/profile/edit">
            <Edit3 size={18} />
            Edit Profil
          </Link>
        </section>

        {loading ? (
          <section className="umkm-form-section">
            <p>Memuat profil...</p>
          </section>
        ) : error ? (
          <section className="umkm-form-section">
            <p>{error}</p>
            <Link className="button" to="/umkm/profile/edit">
              Lengkapi Profil
            </Link>
          </section>
        ) : profile ? (
          <>
            <section className="umkm-profile-preview-grid">
              <article className="umkm-profile-summary-card">
                <div className="umkm-preview-badge-row">
                  <span className="umkm-preview-type">Profil bisnis</span>
                  <strong className={`umkm-status-badge ${profile.status.toLowerCase()}`}>
                    {profile.status}
                  </strong>
                </div>

                <h2>{profile.business_name}</h2>
                <p>{profile.business_description || "Deskripsi usaha belum diisi."}</p>

                <div className="umkm-preview-chip-row">
                  <span>{profile.business_category || "Kategori belum dipilih"}</span>
                  <span>
                    {profile.established_year
                      ? `Berdiri ${profile.established_year}`
                      : "Tahun berdiri belum diisi"}
                  </span>
                </div>

                <div className="umkm-preview-contact-grid">
                  <div>
                    <Phone size={17} />
                    <span>{profile.phone_number || "Nomor WhatsApp belum diisi"}</span>
                  </div>
                  <div>
                    <Mail size={17} />
                    <span>{profile.business_email || "Email bisnis belum diisi"}</span>
                  </div>
                  <div>
                    <MapPin size={17} />
                    <span>{fullAddress || "Alamat belum lengkap"}</span>
                  </div>
                  <div>
                    <Clock3 size={17} />
                    <span>{profile.operating_hours || "Jam operasional belum diisi"}</span>
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

            <section className="umkm-profile-view-grid">
              <article className="umkm-form-section umkm-profile-view-card">
                <h2>
                  <span className="umkm-section-icon">
                    <Store size={18} />
                  </span>
                  Informasi Dasar
                </h2>

                <div className="umkm-info-list">
                  <div>
                    <span>Nama UMKM</span>
                    <strong>{profile.business_name || <EmptyText />}</strong>
                  </div>
                  <div>
                    <span>Nama Pemilik</span>
                    <strong>{profile.owner_name || <EmptyText />}</strong>
                  </div>
                  <div>
                    <span>Kategori</span>
                    <strong>{profile.business_category || <EmptyText />}</strong>
                  </div>
                  <div>
                    <span>Tahun Berdiri</span>
                    <strong>{profile.established_year || <EmptyText />}</strong>
                  </div>
                  <div>
                    <span>NIK Pemilik</span>
                    <strong>{profile.nik ? `${profile.nik.slice(0, 4)}••••••••${profile.nik.slice(-4)}` : <EmptyText />}</strong>
                  </div>
                  <div>
                    <span>Terakhir Diperbarui</span>
                    <strong>{formatDate(profile.updated_at)}</strong>
                  </div>
                </div>
              </article>

              <article className="umkm-form-section umkm-profile-view-card">
                <h2>
                  <span className="umkm-section-icon">
                    <MapPin size={18} />
                  </span>
                  Kontak & Lokasi
                </h2>

                <div className="umkm-info-list">
                  <div>
                    <span>Nomor WhatsApp</span>
                    <strong>{profile.phone_number || <EmptyText />}</strong>
                  </div>
                  <div>
                    <span>Email Bisnis</span>
                    <strong>{profile.business_email || <EmptyText />}</strong>
                  </div>
                  <div>
                    <span>Alamat Lengkap</span>
                    <strong>{fullAddress || <EmptyText />}</strong>
                  </div>
                  <div>
                    <span>Jam Operasional</span>
                    <strong>{profile.operating_hours || <EmptyText />}</strong>
                  </div>
                  <div>
                    <span>Media Sosial / Marketplace</span>
                    <strong>{profile.social_media_marketplace || <EmptyText />}</strong>
                  </div>
                </div>

                <div className="umkm-map-preview umkm-profile-view-map">
                  <MapPinned size={28} />
                  <span>Preview peta belum tersambung</span>
                </div>
              </article>
            </section>

            <section className="umkm-form-section umkm-profile-view-card">
              <h2>
                <span className="umkm-section-icon">
                  <ImagePlus size={18} />
                </span>
                Galeri Usaha
              </h2>

              <div className="umkm-gallery-view-grid">
                <div className="umkm-placeholder-image">
                  <ImagePlus size={30} />
                  <span>Logo usaha belum tersedia</span>
                </div>

                <div className="umkm-placeholder-image">
                  <ImagePlus size={30} />
                  <span>Foto utama usaha belum tersedia</span>
                </div>
              </div>
            </section>

            <section className="umkm-form-section umkm-profile-view-card">
              <h2>
                <span className="umkm-section-icon">
                  <Building2 size={18} />
                </span>
                Legalitas & Dokumen
              </h2>

              <aside className="umkm-document-card umkm-document-card--wide">
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
            </section>
          </>
        ) : (
          <section className="umkm-form-section">
            <p>Profil UMKM belum tersedia.</p>
            <Link className="button" to="/umkm/profile/edit">
              Lengkapi Profil
            </Link>
          </section>
        )}
      </main>
    </UmkmLayout>
  );
}
