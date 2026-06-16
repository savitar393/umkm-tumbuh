import { useEffect, useState } from "react";
import { AlertCircle, Banknote, Handshake, Search, Store, TrendingUp } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import StatCard from "../components/StatCard";
import IndonesiaMap from "../components/IndoMaps";
import {
  RegistrationTrendChart,
  StatusDonutChart,
  OmzetTrendChart,
  RegionBarChart,
  CategoryBarChart,
} from "../components/Charts";
import { getDashboard, type DashboardData } from "../api";

const PROVINSI_LIST = [
  "Seluruh Indonesia", "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi",
  "Sumatera Selatan", "Bengkulu", "Lampung", "Bangka Belitung", "Kepulauan Riau",
  "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur",
  "Banten", "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat",
  "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
  "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara",
  "Gorontalo", "Sulawesi Barat", "Maluku", "Maluku Utara", "Papua", "Papua Barat",
  "Papua Selatan", "Papua Tengah", "Papua Pegunungan",
];

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const YEARS = [2026, 2025, 2024, 2023];

const STATUS_OPTIONS = ["Semua Status", "AKTIF", "NONAKTIF", "SUSPEND", "ARSIP"];

function formatRupiah(value: number): string {
  if (value >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toFixed(1)} T`;
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("id-ID");
}

export default function AdminDashboardPage() {
  const now = new Date();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [provinsi, setProvinsi] = useState("Seluruh Indonesia");
  const [bulan, setBulan] = useState(now.getMonth());
  const [tahun, setTahun] = useState(now.getFullYear());
  const [statusUmkm, setStatusUmkm] = useState("Semua Status");

  function fetchDashboard() {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (provinsi !== "Seluruh Indonesia") params.set("provinsi", provinsi);
    const monthStr = `${tahun}-${String(bulan + 1).padStart(2, "0")}`;
    params.set("bulan", monthStr);
    params.set("tahun", String(tahun));
    if (statusUmkm !== "Semua Status") params.set("status_umkm", statusUmkm);

    const qs = params.toString() ? `?${params.toString()}` : "";

    getDashboard(qs)
      .then((result) => {
        setData(result);
        setError("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal memuat data dashboard");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams();
    if (provinsi !== "Seluruh Indonesia") params.set("provinsi", provinsi);
    const monthStr = `${tahun}-${String(bulan + 1).padStart(2, "0")}`;
    params.set("bulan", monthStr);
    params.set("tahun", String(tahun));
    if (statusUmkm !== "Semua Status") params.set("status_umkm", statusUmkm);
    const qs = params.toString() ? `?${params.toString()}` : "";

    getDashboard(qs)
      .then((result) => {
        if (!ignore) {
          setData(result);
          setError("");
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Gagal memuat data dashboard");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => { ignore = true; };
  }, []);

  const s = data?.summary;

  const stats = [
    {
      icon: Store, label: "Total UMKM", value: s ? formatNumber(s.total_umkm) : "—",
      sub: "Terdaftar di database", color: "blue" as const,
    },
    {
      icon: Handshake, label: "UMKM Aktif", value: s ? formatNumber(s.total_umkm_aktif) : "—",
      sub: "Status aktif saat ini", color: "green" as const,
    },
    {
      icon: TrendingUp, label: "UMKM Berkembang", value: s ? formatNumber(s.total_umkm_berkembang) : "—",
      sub: "Tren naik / ekspansi", color: "yellow" as const,
    },
    {
      icon: AlertCircle, label: "UMKM Tidak Aktif", value: s ? formatNumber(s.total_umkm_tidak_aktif) : "—",
      sub: "Nonaktif / suspend / arsip", color: "purple" as const,
    },
    {
      icon: Banknote, label: "Total Laba", value: s ? formatRupiah(s.total_laba) : "—",
      sub: "Akumulasi laba tercatat", color: "orange" as const,
    },
  ];

  return (
    <AdminLayout>
      {/* Filter Bar */}
      <div className="dashboard-filter-bar-v2">
        <div className="filter-group">
          <label className="filter-label">PROVINSI</label>
          <select className="filter-select" value={provinsi} onChange={(e) => setProvinsi(e.target.value)}>
            {PROVINSI_LIST.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">BULAN</label>
          <select className="filter-select" value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">TAHUN</label>
          <select className="filter-select" value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">STATUS UMKM</label>
          <select className="filter-select" value={statusUmkm} onChange={(e) => setStatusUmkm(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="filter-group filter-group--btn">
          <label className="filter-label">&nbsp;</label>
          <button className="filter-btn" onClick={fetchDashboard}>
            <Search size={16} style={{ marginRight: 8 }} /> Terapkan Filter
          </button>
        </div>
      </div>

      {loading && <p style={{ color: "#6b7280", fontSize: 14 }}>Memuat data dashboard...</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="stat-cards-grid">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <IndonesiaMap mapData={data?.map_data ?? []} />

      <div className="charts-row">
        <RegistrationTrendChart data={data?.registration_trend ?? []} />
        <StatusDonutChart data={data?.status_distribution ?? []} />
      </div>

      <OmzetTrendChart data={data?.laba_trend ?? []} />

      <div className="charts-row">
        <RegionBarChart data={data?.top_wilayah ?? []} />
        <CategoryBarChart data={data?.kategori_performa ?? []} />
      </div>

      <div className="charts-row">
        <div className="info-card">
          <div className="chart-card__title">Tren Pertumbuhan</div>
          <p>
            {data
              ? `Total ${formatNumber(data.summary.total_umkm)} UMKM terdaftar dengan ${formatNumber(data.summary.total_umkm_aktif)} aktif. Terdapat ${formatNumber(data.summary.total_umkm_berkembang)} UMKM dalam tren berkembang.`
              : "Memuat data pertumbuhan..."}
          </p>
        </div>
        <div className="info-card warning">
          <div className="chart-card__title">Atensi Khusus</div>
          <p>
            {data?.atensi
              ? `Terdapat ${formatNumber(data.atensi.total_umkm_perlu_atensi)} UMKM perlu perhatian dan ${formatNumber(data.atensi.total_umkm_berisiko)} UMKM berisiko di ${formatNumber(data.atensi.total_provinsi_terdampak)} provinsi.`
              : "Memuat data atensi..."}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}