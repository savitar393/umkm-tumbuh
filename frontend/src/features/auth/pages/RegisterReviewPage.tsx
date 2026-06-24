import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import { http } from "../../../shared/api/http";
import { submitRegistration } from "../api";

type RegisterDetailRole = "umkm" | "mitra";

type ReviewProfileResponse = {
  profile: Record<string, unknown>;
};

type ReviewItem = [label: string, value: unknown];

type ReviewSectionData = {
  title: string;
  items: ReviewItem[];
};

function valueText(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function ReviewSection({
  title,
  items,
}: {
  title: string;
  items: ReviewItem[];
}) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: 20, marginBottom: 14 }}>{title}</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        {items.map(([label, value]) => (
          <div
            key={label}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: "14px 16px",
              background: "#f9fafb",
            }}
          >
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
              {label}
            </div>
            <div style={{ fontWeight: 700, color: "#0f172a", wordBreak: "break-word" }}>
              {valueText(value)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RegisterReviewPage() {
  const params = useParams();
  const location = useLocation();
  const currentUser = getCurrentUser();

  const role: RegisterDetailRole = params.role === "mitra" ? "mitra" : "umkm";

  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const expectedRole = role === "umkm" ? "UMKM" : "MITRA";
  const dashboardPath = role === "umkm" ? "/umkm" : "/mitra";
  const editPath = `/register/${role}/details`;

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await http<ReviewProfileResponse>("/profiles/me", {
          service: "user",
        });

        if (!cancelled) {
          setProfile(response.profile);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat data review.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const reviewSections = useMemo<ReviewSectionData[]>(() => {
    if (!profile) return [];

    if (role === "umkm") {
      return [
        {
          title: "Informasi Identitas",
          items: [
            ["Nama UMKM", profile.business_name],
            ["Nama Pemilik", profile.owner_name],
            ["NIK Pemilik", profile.nik],
            ["Nomor WhatsApp", profile.phone_number],
          ],
        },
        {
          title: "Profil Usaha",
          items: [
            ["Kategori Usaha", profile.business_category],
            ["Deskripsi Usaha", profile.business_description],
            ["Produk Utama", profile.products],
            ["Status", profile.status],
          ],
        },
        {
          title: "Alamat Usaha",
          items: [
            ["Alamat", profile.address],
            ["Kota/Kabupaten", profile.city],
            ["Provinsi", profile.province],
            ["Kecamatan", profile.district],
            ["Kelurahan", profile.village],
            ["Kode Pos", profile.postal_code],
          ],
        },
      ];
    }

    return [
      {
        title: "Informasi Organisasi",
        items: [
          ["Nama Organisasi", profile.organization_name],
          ["Jenis Mitra", profile.organization_type],
          ["Nama Badan Hukum", profile.legal_name],
          ["NIB", profile.nib],
          ["NPWP", profile.npwp],
          ["Status", profile.status],
        ],
      },
      {
        title: "Penanggung Jawab",
        items: [
          ["Nama PIC", profile.contact_person],
          ["Jabatan PIC", profile.contact_person_title],
          ["Email PIC", profile.email],
          ["Nomor WhatsApp PIC", profile.phone_number],
        ],
      },
      {
        title: "Alamat Kantor",
        items: [
          ["Alamat", profile.address],
          ["Kota/Kabupaten", profile.city],
          ["Provinsi", profile.province],
          ["Kecamatan", profile.district],
          ["Kelurahan", profile.village],
          ["Kode Pos", profile.postal_code],
        ],
      },
      {
        title: "Profil Kemitraan",
        items: [
          ["Wilayah Operasional", profile.operational_area],
          ["Skala Kerja Sama", profile.cooperation_scale],
          ["Deskripsi Dukungan", profile.description],
        ],
      },
    ];
  }, [profile, role]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role !== expectedRole) {
    return <Navigate to={`/register/${currentUser.role.toLowerCase()}/details`} replace />;
  }

  async function handleSubmitRegistration() {
    setError("");
    setSubmitMessage("");
    setSubmitting(true);

    try {
      const response = await submitRegistration();
      setSubmitMessage(response.message || "Pendaftaran berhasil dikirim. Menunggu review Admin.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim pendaftaran.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="register-detail-page">
      <header className="register-detail-navbar">
        <Link to="/" className="register-detail-brand">
          <img src="/tumbuh.png" alt="UMKM Tumbuh" />
          <span>UMKM Tumbuh</span>
        </Link>

        <nav>
          <Link to={editPath}>Edit Data</Link>
          <Link to={dashboardPath}>Dashboard</Link>
        </nav>
      </header>

      <section className="register-detail-shell">
        <div className="register-detail-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <CheckCircle size={32} color="#16a34a" />
            <div>
              <h1>Review Pendaftaran</h1>
              <p>
                {location.state?.message ??
                  "Data pendaftaran berhasil disimpan. Silakan cek kembali data Anda."}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="form-alert success" style={{ display: "flex", gap: 10 }}>
              <Loader2 size={18} />
              Memuat data review...
            </div>
          ) : error ? (
            <div className="form-alert error">{error}</div>
          ) : (
            <>
              <div className="form-alert success">
                Data profil berhasil dimuat. Silakan cek kembali sebelum melanjutkan.
              </div>

              {reviewSections.map((section) => (
                <ReviewSection
                  key={section.title}
                  title={section.title}
                  items={section.items}
                />
              ))}
            </>
          )}

          {submitMessage ? (
            <div className="form-alert success" style={{ marginTop: 18 }}>
              {submitMessage}
            </div>
          ) : null}

          {submitMessage ? (
            <Link to={dashboardPath} className="secondary-button">
              Ke Dashboard
            </Link>
          ) : null}

          <div className="register-detail-actions" style={{ marginTop: 32 }}>
            <Link to={editPath} className="secondary-button">
              Kembali Edit Data
            </Link>

            <button
              type="button"
              className="primary-button"
              disabled={loading || submitting || Boolean(error)}
              onClick={handleSubmitRegistration}
            >
              {submitting ? "Mengirim..." : "Kirim untuk Review Admin"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}