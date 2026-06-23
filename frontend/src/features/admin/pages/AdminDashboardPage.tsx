import { useEffect, useState } from "react";
import { AlertCircle, Banknote, Handshake, RotateCcw, Search, Store } from "lucide-react";
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
  { label: "Semua Bulan", value: -1 },
  { label: "Januari", value: 0 },
  { label: "Februari", value: 1 },
  { label: "Maret", value: 2 },
  { label: "April", value: 3 },
  { label: "Mei", value: 4 },
  { label: "Juni", value: 5 },
  { label: "Juli", value: 6 },
  { label: "Agustus", value: 7 },
  { label: "September", value: 8 },
  { label: "Oktober", value: 9 },
  { label: "November", value: 10 },
  { label: "Desember", value: 11 },
];

const YEARS = [2026, 2025, 2024];

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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [provinsi, setProvinsi] = useState("Seluruh Indonesia");
  const [bulan, setBulan] = useState(-1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [statusUmkm, setStatusUmkm] = useState("Semua Status");

  function buildFilterParams() {
    const params = new URLSearchParams();
    if (provinsi !== "Seluruh Indonesia") params.set("provinsi", provinsi);
    if (bulan >= 0) {
      const monthStr = `${tahun}-${String(bulan + 1).padStart(2, "0")}`;
      params.set("bulan", monthStr);
    }
    params.set("tahun", String(tahun));
    if (statusUmkm !== "Semua Status") params.set("status_umkm", statusUmkm);
    return params;
  }

  function fetchDashboard() {
    setLoading(true);
    setError("");

    const params = buildFilterParams();
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

  function resetFilters() {
    setProvinsi("Seluruh Indonesia");
    setBulan(-1);
    setTahun(new Date().getFullYear());
    setStatusUmkm("Semua Status");
    fetchDashboard();
  }

  useEffect(() => {
    let ignore = false;
    const params = buildFilterParams();
    const qs = params.toString() ? `?${params.toString()}` : "";

    getDashboard(qs)
      .then((result) => { if (!ignore) { setData(result); setError(""); } })
      .catch((err) => { if (!ignore) setError(err instanceof Error ? err.message : "Gagal memuat data dashboard"); })
      .finally(() => { if (!ignore) setLoading(false); });

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
      icon: AlertCircle, label: "UMKM Tidak Aktif", value: s ? formatNumber(s.total_umkm_tidak_aktif) : "—",
      sub: "Nonaktif / suspend / arsip", color: "purple" as const,
    },
    {
      icon: Banknote, label: "Total Omzet", value: s ? formatRupiah(s.total_laba) : "—",
      sub: "Akumulasi omzet tercatat", color: "orange" as const,
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
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
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
            <Search size={16} style={{ marginRight: 8 }} /> Terapkan
          </button>
          <button className="filter-btn filter-btn--secondary" onClick={resetFilters} style={{ marginLeft: 8 }}>
            <RotateCcw size={16} style={{ marginRight: 8 }} /> Reset
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

    </AdminLayout>
  );
}
