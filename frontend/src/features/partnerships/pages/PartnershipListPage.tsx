import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Handshake, MapPin, Search, UsersRound } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getCurrentUser } from "../../../shared/auth/currentUser";
import { partnershipsApi, type PartnerListItem } from "../api";

const ITEMS_PER_PAGE = 10;

const UMKM_TYPES = [
  "all",
  "Agribisnis",
  "Digital",
  "Edukasi",
  "Fashion",
  "Jasa",
  "Kecantikan",
  "Kerajinan",
  "Kesehatan",
  "Kriya",
  "Kuliner",
  "Otomotif",
  "Perdagangan",
  "Usaha Mikro, Kecil, dan Menengah",
];

const MITRA_TYPES = [
  "all",
  "BUMN",
  "Inkubator Bisnis",
  "Komunitas",
  "Komunitas Bisnis",
  "Koperasi",
  "Lainnya",
  "Lembaga Keuangan",
  "Lembaga Pelatihan",
  "Lembaga Pendidikan",
  "Logistik",
  "Marketplace",
  "Media Promosi",
  "Pemerintah",
  "Pemerintah Daerah",
  "Perguruan Tinggi",
  "Perusahaan",
  "Perusahaan Swasta",
];

function getBasePath(role?: string) {
  if (role === "MITRA") return "/mitra/partnerships";
  if (role === "UMKM") return "/umkm/partnerships";
  return "/partnerships";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
}

function getPageRange(currentPage: number, totalPages: number) {
  const pages: Array<number | "…"> = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i += 1) pages.push(i);
    return pages;
  }

  pages.push(1);

  if (currentPage > 3) pages.push("…");

  for (
    let page = Math.max(2, currentPage - 1);
    page <= Math.min(totalPages - 1, currentPage + 1);
    page += 1
  ) {
    pages.push(page);
  }

  if (currentPage < totalPages - 2) pages.push("…");

  pages.push(totalPages);

  return pages;
}

export default function PartnershipListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = getCurrentUser();

  const isMitra = user?.role === "MITRA";
  const basePath = getBasePath(user?.role);
  const categories = isMitra ? UMKM_TYPES : MITRA_TYPES;

  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") ?? "");

  const [selectedCategory, setSelectedCategory] = useState(() => {
    const category = searchParams.get("type") ?? "all";
    return categories.includes(category) ? category : "all";
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const page = Number(searchParams.get("page") ?? "1");
    return Number.isFinite(page) && page > 0 ? page : 1;
  });
  
  const [totalItems, setTotalItems] = useState(0);
  const [partnerList, setPartnerList] = useState<PartnerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const title = isMitra ? "Temukan UMKM Potensial" : "Temukan Mitra Strategis";
  const subtitle = isMitra
    ? "Cari UMKM yang sesuai dengan program, jaringan, atau peluang kolaborasi mitra."
    : "Cari lembaga, komunitas, perusahaan, atau instansi yang dapat membantu pertumbuhan usaha Anda.";

  const targetLabel = isMitra ? "UMKM" : "Mitra";
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const visibleRange = useMemo(() => getPageRange(currentPage, totalPages), [currentPage, totalPages]);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (searchTerm.trim()) nextParams.set("q", searchTerm.trim());
    if (selectedCategory !== "all") nextParams.set("type", selectedCategory);
    if (currentPage > 1) nextParams.set("page", String(currentPage));

    setSearchParams(nextParams, { replace: true });
  }, [searchTerm, selectedCategory, currentPage, setSearchParams]);

  useEffect(() => {
    let ignore = false;

    async function fetchData() {
      setLoading(true);
      setError("");

      try {
        const fetchFn = isMitra ? partnershipsApi.listUMKM : partnershipsApi.listMitra;

        const response = await fetchFn({
          q: searchTerm.trim() || undefined,
          filterType: selectedCategory !== "all" ? selectedCategory : undefined,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        });

        if (ignore) return;

        const items = isMitra ? response.umkm ?? [] : response.mitra ?? [];

        setPartnerList(items);
        setTotalItems(response.pagination.total);
      } catch (err) {
        if (ignore) return;

        setError(err instanceof Error ? err.message : "Gagal memuat data kemitraan.");
        setPartnerList([]);
        setTotalItems(0);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchData();

    return () => {
      ignore = true;
    };
  }, [currentPage, isMitra, searchTerm, selectedCategory]);

  function handleCategoryChange(category: string) {
    setSelectedCategory(category);
    setCurrentPage(1);
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value);
    setCurrentPage(1);
  }

  function handlePageChange(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <UmkmLayout title="Kemitraan" subtitle={subtitle}>
      <main className="partnership-page">
        <section className="partnership-hero">
          <div>
            <span className="partnership-eyebrow">
              <Handshake size={16} />
              Direktori Kemitraan
            </span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="partnership-hero-card">
            <strong>{totalItems}</strong>
            <span>{targetLabel} tersedia</span>
          </div>
        </section>

        <section className="partnership-toolbar">
          <label className="partnership-search">
            <Search size={18} />
            <input
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder={isMitra ? "Cari nama UMKM, kota, atau kategori..." : "Cari nama mitra, kota, atau jenis mitra..."}
            />
          </label>

          <div className="partnership-filter-row" aria-label="Filter kategori kemitraan">
            {categories.map((category) => (
              <button
                type="button"
                className={selectedCategory === category ? "active" : ""}
                key={category}
                onClick={() => handleCategoryChange(category)}
              >
                {category === "all" ? "Semua" : category}
              </button>
            ))}
          </div>
        </section>

        <section className="partnership-summary-grid">
          <article>
            <UsersRound size={20} />
            <div>
              <strong>{totalItems}</strong>
              <span>Total {targetLabel}</span>
            </div>
          </article>

          <article>
            <Building2 size={20} />
            <div>
              <strong>{selectedCategory === "all" ? "Semua" : selectedCategory}</strong>
              <span>Filter aktif</span>
            </div>
          </article>

          <article>
            <Handshake size={20} />
            <div>
              <strong>{currentPage}/{totalPages}</strong>
              <span>Halaman</span>
            </div>
          </article>
        </section>

        {loading ? (
          <section className="partnership-state-card">
            <div className="partnership-spinner" />
            <p>Memuat data kemitraan...</p>
          </section>
        ) : error ? (
          <section className="partnership-state-card error">
            <strong>Gagal memuat data</strong>
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Coba Lagi
            </button>
          </section>
        ) : partnerList.length === 0 ? (
          <section className="partnership-state-card">
            <strong>Tidak ada data ditemukan</strong>
            <p>Coba gunakan kata kunci lain atau ubah filter kategori.</p>
          </section>
        ) : (
          <>
            <section className="partnership-card-grid">
              {partnerList.map((partner) => (
                <article className="partnership-card" key={partner.id}>
                  <div className="partnership-card-header">
                    <div className="partnership-avatar">{getInitials(partner.name)}</div>

                    <div>
                      <h3>{partner.name}</h3>
                      <span>{partner.type || "Kategori belum tersedia"}</span>
                    </div>
                  </div>

                  <p className="partnership-card-description">
                    {partner.description || "Deskripsi profil belum tersedia."}
                  </p>

                  <div className="partnership-card-meta">
                    <MapPin size={16} />
                    <span>
                      {partner.city || "Kota belum tersedia"}
                      {partner.province ? `, ${partner.province}` : ""}
                    </span>
                  </div>

                  {partner.operational_area ? (
                    <div className="partnership-card-meta">
                      <Building2 size={16} />
                      <span>{partner.operational_area}</span>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      const returnTo = `${location.pathname}${location.search}`;
                      navigate(`${basePath}/${partner.id}?returnTo=${encodeURIComponent(returnTo)}`);
                    }}
                  >
                    Lihat Profil
                    <ArrowRight size={16} />
                  </button>
                </article>
              ))}
            </section>

            {totalPages > 1 ? (
              <section className="partnership-pagination">
                <p>
                  Menampilkan {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} dari {totalItems} data
                </p>

                <div>
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Halaman sebelumnya"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  {visibleRange.map((page, index) =>
                    page === "…" ? (
                      <span key={`ellipsis-${index}`}>…</span>
                    ) : (
                      <button
                        type="button"
                        className={page === currentPage ? "active" : ""}
                        key={page}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Halaman berikutnya"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>
    </UmkmLayout>
  );
}
