import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Download,
  Handshake,
  Mail,
  MapPin,
  Phone,
  ScrollText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import { partnershipsApi, type MitraDetail, type UMKMDetail } from "../api";
import { Icon } from "@iconify/react";
import {
  hasAnySocialMedia,
  parseSocialMediaValue,
} from "../../../shared/utils/socialMedia";

type PartnershipProfileDetail = UMKMDetail & MitraDetail;

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "P"
  );
}

function hasValue(value?: string | null) {
  return Boolean(value && value.trim());
}

function getFullLocation(detail: PartnershipProfileDetail) {
  return [detail.city, detail.province].filter(Boolean).join(", ");
}

function getFullAddress(detail: PartnershipProfileDetail) {
  return [detail.address, detail.city, detail.province].filter(Boolean).join(", ");
}

function getBasePath(role?: string) {
  if (role === "MITRA") return "/mitra/partnerships";
  if (role === "UMKM") return "/umkm/partnerships";
  return "/partnerships";
}

function downloadPartnershipTemplate() {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Template Pengajuan Kemitraan UMKM Tumbuh</title>
<style>
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; margin: 2.5cm; line-height: 1.5; }
  h1 { text-align: center; font-size: 16pt; margin-bottom: 30pt; }
  h2 { font-size: 14pt; margin-top: 20pt; }
  table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
  td { padding: 6pt 10pt; border: 1px solid #000; vertical-align: top; }
  .label { font-weight: bold; width: 35%; }
  .field { min-height: 20pt; color: #888; }
  ol { margin-top: 0; }
</style>
</head>
<body>
<h1>SURAT PENGAJUAN KEMITRAAN<br>UMKM Tumbuh</h1>

<table>
  <tr><td class="label">Nama Usaha</td><td class="field">............................</td></tr>
  <tr><td class="label">Nama Pemilik</td><td class="field">............................</td></tr>
  <tr><td class="label">Jenis Usaha</td><td class="field">............................</td></tr>
  <tr><td class="label">Alamat</td><td class="field">............................</td></tr>
  <tr><td class="label">Kota/Kabupaten</td><td class="field">............................</td></tr>
  <tr><td class="label">Provinsi</td><td class="field">............................</td></tr>
  <tr><td class="label">No. Telepon/WhatsApp</td><td class="field">............................</td></tr>
  <tr><td class="label">Email</td><td class="field">............................</td></tr>
  <tr><td class="label">Tahun Berdiri</td><td class="field">............................</td></tr>
  <tr><td class="label">NIB / Legalitas</td><td class="field">............................</td></tr>
</table>

<h2>Deskripsi Usaha / Profil Mitra</h2>
<p>............................<br>............................<br>............................</p>

<h2>Alasan Bermitra</h2>
<p>............................<br>............................<br>............................</p>

<h2>Bentuk Dukungan / Kolaborasi yang Diharapkan</h2>
<p>............................<br>............................<br>............................</p>

<br><br>
<table>
  <tr>
    <td style="border: none; width: 50%; text-align: center;">
      <br><br><br>
      (............................)<br>
      <em>Tanda Tangan &amp; Nama Lengkap</em>
    </td>
    <td style="border: none; width: 50%; text-align: center;">
      <br><br><br>
      (............................)<br>
      <em>Tanggal</em>
    </td>
  </tr>
</table>
</body>
</html>`;

  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "Template_Pengajuan_Kemitraan.doc";

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="partnership-detail-info-item">
      {icon}
      <div>
        <span>{label}</span>
        <strong>{value || "Belum tersedia"}</strong>
      </div>
    </div>
  );
}

type SocialPlatform = "instagram" | "tiktok" | "shopee" | "tokopedia" | "website";

const socialIconMap: Record<SocialPlatform, string> = {
  instagram: "simple-icons:instagram",
  tiktok: "simple-icons:tiktok",
  shopee: "simple-icons:shopee",
  tokopedia: "simple-icons:tokopedia",
  website: "lucide:globe",
};

function withoutAt(value: string) {
  return value.trim().replace(/^@+/, "");
}

function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function getSocialDisplayLabel(platform: SocialPlatform, label: string) {
  const value = label.trim();

  if (platform === "website") {
    try {
      const url = new URL(normalizeWebsiteUrl(value));
      return url.hostname.replace(/^www\./, "");
    } catch {
      return value.replace(/^https?:\/\//i, "").replace(/^www\./, "");
    }
  }

  return value;
}

function getSocialUrl(platform: SocialPlatform, label: string) {
  const value = label.trim();
  if (!value) return "";

  switch (platform) {
    case "instagram":
      return `https://www.instagram.com/${withoutAt(value)}`;
    case "tiktok":
      return `https://www.tiktok.com/@${withoutAt(value)}`;
    case "shopee":
      return `https://shopee.co.id/search?keyword=${encodeURIComponent(value)}`;
    case "tokopedia":
      return `https://www.tokopedia.com/search?st=shop&q=${encodeURIComponent(value)}`;
    case "website":
      return normalizeWebsiteUrl(value);
    default:
      return "";
  }
}

function SocialBrandIcon({ platform }: { platform: SocialPlatform }) {
  return (
    <span className={`partnership-social-brand-icon ${platform}`}>
      <Icon icon={socialIconMap[platform]} width={16} height={16} />
    </span>
  );
}

function SocialProfileLinks({ value }: { value?: string | null }) {
  const socialLinks = parseSocialMediaValue(value);

  if (!hasAnySocialMedia(socialLinks)) return null;

  const items = [
    socialLinks.instagram ? { platform: "instagram" as const, label: socialLinks.instagram } : null,
    socialLinks.tiktok ? { platform: "tiktok" as const, label: socialLinks.tiktok } : null,
    socialLinks.shopee ? { platform: "shopee" as const, label: socialLinks.shopee } : null,
    socialLinks.tokopedia ? { platform: "tokopedia" as const, label: socialLinks.tokopedia } : null,
    socialLinks.website ? { platform: "website" as const, label: socialLinks.website } : null,
  ].filter(Boolean) as Array<{ platform: SocialPlatform; label: string }>;

  return (
    <div className="partnership-social-chip-list">
      {items.map((item) => (
        <a
          key={`${item.platform}-${item.label}`}
          href={getSocialUrl(item.platform, item.label)}
          target="_blank"
          rel="noreferrer"
          title={item.label}
        >
          <SocialBrandIcon platform={item.platform} />
          <strong>{getSocialDisplayLabel(item.platform, item.label)}</strong>
        </a>
      ))}
    </div>
  );
}

export default function PartnershipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();

  const isMitra = user?.role === "MITRA";
  const basePath = getBasePath(user?.role);
  const rawReturnTo = searchParams.get("returnTo");
  const decodedReturnTo = rawReturnTo ? decodeURIComponent(rawReturnTo) : "";

  const returnPath = decodedReturnTo.startsWith(basePath)
    ? decodedReturnTo
    : basePath;

  function goBackToList() {
    navigate(returnPath);
  }
  const profileKind = isMitra ? "UMKM" : "Mitra";

  const [detail, setDetail] = useState<UMKMDetail | MitraDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const data = detail as PartnershipProfileDetail | null;

  const fullLocation = useMemo(() => (data ? getFullLocation(data) : ""), [data]);
  const fullAddress = useMemo(() => (data ? getFullAddress(data) : ""), [data]);

  useEffect(() => {
    if (!id) {
      setError("ID profil kemitraan tidak ditemukan.");
      setLoading(false);
      return;
    }

    const detailId = id;
    let ignore = false;

    async function fetchDetail() {
      setLoading(true);
      setError("");

      try {
        if (isMitra) {
          const response = await partnershipsApi.getUMKMDetail(detailId);

          if (!ignore) {
            if (response.success === true && response.data?.umkm) {
              setDetail(response.data.umkm);
            } else {
              setError("UMKM tidak ditemukan.");
            }
          }

          return;
        }

        const response = await partnershipsApi.getMitraDetail(detailId);

        if (!ignore) {
          if (response.success === true && response.data?.mitra) {
            setDetail(response.data.mitra);
          } else {
            setError("Mitra tidak ditemukan.");
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Gagal memuat detail kemitraan.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchDetail();

    return () => {
      ignore = true;
    };
  }, [id, isMitra]);

  function handleApplyPartnership() {
    const query = new URLSearchParams();

    if (id) query.set("receiver_id", id);
    if (data?.name) query.set("receiver_name", data.name);

    navigate(`${basePath}/create?${query.toString()}`);
  }

  return (
    <UmkmLayout
      title="Detail Kemitraan"
      subtitle={`Lihat detail ${profileKind.toLowerCase()} sebelum mengajukan kerja sama.`}
    >
      <main className="partnership-detail-page">
        <button className="partnership-back-button" type="button" onClick={goBackToList}>
          <ArrowLeft size={17} />
          Kembali ke Daftar
        </button>

        {loading ? (
          <section className="partnership-state-card">
            <div className="partnership-spinner" />
            <p>Memuat detail {profileKind.toLowerCase()}...</p>
          </section>
        ) : error || !data ? (
          <section className="partnership-state-card error">
            <strong>{profileKind} tidak ditemukan</strong>
            <p>{error || "Data tidak tersedia."}</p>
            <button type="button" onClick={goBackToList}>
              Kembali
            </button>
          </section>
        ) : (
          <>
            <section className="partnership-detail-hero">
              <div className="partnership-detail-avatar">{getInitials(data.name)}</div>

              <div>
                <span className="partnership-eyebrow">
                  <Handshake size={16} />
                  Profil {profileKind}
                </span>
                <h1>{data.name}</h1>

                <div className="partnership-detail-chip-row">
                  {data.type ? <span>{data.type}</span> : null}
                  {fullLocation ? <span>{fullLocation}</span> : null}
                  {"year_established" in data && data.year_established ? (
                    <span>Berdiri {data.year_established}</span>
                  ) : null}
                  <span className="verified">
                    <ShieldCheck size={14} />
                    Terverifikasi
                  </span>
                </div>
              </div>
            </section>

            <section className="partnership-detail-layout">
              <div className="partnership-detail-main">
                <article className="partnership-detail-card">
                  <h2>Deskripsi {profileKind}</h2>
                  <p>
                    {hasValue(data.description)
                      ? data.description
                      : `Deskripsi ${profileKind.toLowerCase()} belum tersedia.`}
                  </p>
                </article>

                {"social_media_marketplace" in data && hasValue(data.social_media_marketplace) ? (
                  <article className="partnership-detail-card">
                    <h2>Media Sosial / Marketplace</h2>
                    <SocialProfileLinks value={data.social_media_marketplace} />
                  </article>
                ) : null}

                <article className="partnership-detail-card">
                  <h2>Informasi Profil</h2>

                  <div className="partnership-detail-info-grid">
                    <InfoItem icon={<UserRound size={18} />} label="Penanggung Jawab" value={data.owner_name} />
                    <InfoItem icon={<Building2 size={18} />} label="Jenis/Kategori" value={data.type} />
                    <InfoItem icon={<MapPin size={18} />} label="Alamat" value={fullAddress} />
                    <InfoItem icon={<MapPin size={18} />} label="Wilayah Operasional" value={data.operational_area} />
                    <InfoItem icon={<Phone size={18} />} label="Telepon/WhatsApp" value={data.phone_number} />
                    <InfoItem icon={<Mail size={18} />} label="Email" value={data.email} />
                    {"year_established" in data ? (
                      <InfoItem
                        icon={<CalendarDays size={18} />}
                        label="Tahun Berdiri"
                        value={data.year_established}
                      />
                    ) : null}
                    <InfoItem icon={<ScrollText size={18} />} label="Produk/Layanan" value={data.products} />
                  </div>
                </article>
              </div>

              <aside className="partnership-action-panel">
                <div className="partnership-action-panel__header">
                  <Handshake size={24} />
                  <div>
                    <span>Pengajuan Kemitraan</span>
                    <strong>Siap mengajukan?</strong>
                  </div>
                </div>

                <p>
                  Unduh template bila diperlukan, lalu lanjutkan ke formulir pengajuan untuk mengirim proposal kerja sama.
                </p>

                <button className="partnership-template-button" type="button" onClick={downloadPartnershipTemplate}>
                  <Download size={17} />
                  Download Template
                </button>

                <div className="partnership-action-summary">
                  <div>
                    <span>Target</span>
                    <strong>{data.name}</strong>
                  </div>
                  <div>
                    <span>Jenis</span>
                    <strong>{data.type || "-"}</strong>
                  </div>
                  <div>
                    <span>Lokasi</span>
                    <strong>{fullLocation || "-"}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong className="verified">Terverifikasi</strong>
                  </div>
                </div>

                <button className="partnership-apply-button" type="button" onClick={handleApplyPartnership}>
                  Ajukan Kemitraan
                  <Handshake size={17} />
                </button>
              </aside>
            </section>
          </>
        )}
      </main>
    </UmkmLayout>
  );
}
