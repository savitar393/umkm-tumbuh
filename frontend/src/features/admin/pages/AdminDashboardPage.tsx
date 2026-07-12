import { useEffect, useState } from "react";
import { AlertCircle, Banknote, Handshake, Search, Store } from "lucide-react";
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
  "Seluruh Indonesia",
  "Bali",
  "DI Yogyakarta",
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "Sulawesi Selatan",
  "Sumatera Selatan",
  "Sumatera Utara",
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

const YEARS = [
  { label: "Semua Tahun", value: -1 },
  { label: "2026", value: 2026 },
  { label: "2025", value: 2025 },
  { label: "2024", value: 2024 },
];

const STATUS_OPTIONS = [
  "Semua Status",
  "AKTIF",
  "ARSIP",
  "DITOLAK",
  "MENUNGGU_VERIFIKASI",
  "NONAKTIF",
  "SUSPEND",
];

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
  const [tahun, setTahun] = useState(-1);
  const [statusUmkm, setStatusUmkm] = useState("Semua Status");

  function buildQuery(filters: { prov: string; bln: number; thn: number; statusUmkm: string }) {
    const params = new URLSearchParams();
    if (filters.prov !== "Seluruh Indonesia") params.set("provinsi", filters.prov);
    if (filters.thn >= 0) {
      if (filters.bln >= 0) {
        const monthStr = `${filters.thn}-${String(filters.bln + 1).padStart(2, "0")}`;
        params.set("bulan", monthStr);
      }
      params.set("tahun", String(filters.thn));
    }
    if (filters.statusUmkm !== "Semua Status") params.set("status_umkm", filters.statusUmkm);
    return params.toString() ? `?${params.toString()}` : "";
  }

  function fetchDashboard(filters?: { prov: string; bln: number; thn: number; statusUmkm: string }) {
    const f = filters ?? { prov: provinsi, bln: bulan, thn: tahun, statusUmkm };
    setLoading(true);
    setError("");

    getDashboard(buildQuery(f))
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
    const qs = buildQuery({ prov: provinsi, bln: bulan, thn: tahun, statusUmkm });

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
              <option key={y.value} value={y.value}>{y.label}</option>
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
          <button className="filter-btn" onClick={() => fetchDashboard()}>
            <Search size={16} style={{ marginRight: 8 }} /> Terapkan
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
