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

function formatRupiah(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `Rp ${(value / 1_000_000_000_000).toFixed(1)} T`;
  }
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  }
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("id-ID");
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    getDashboard()
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
      icon: Store,
      label: "Total UMKM",
      value: s ? formatNumber(s.total_umkm) : "—",
      sub: "Terdaftar di database",
      color: "blue" as const,
    },
    {
      icon: Handshake,
      label: "UMKM Aktif",
      value: s ? formatNumber(s.total_umkm_aktif) : "—",
      sub: "Status aktif saat ini",
      color: "green" as const,
    },
    {
      icon: TrendingUp,
      label: "UMKM Berkembang",
      value: s ? formatNumber(s.total_umkm_berkembang) : "—",
      sub: "Tren naik / ekspansi",
      color: "yellow" as const,
    },
    {
      icon: AlertCircle,
      label: "UMKM Tidak Aktif",
      value: s ? formatNumber(s.total_umkm_tidak_aktif) : "—",
      sub: "Nonaktif / suspend / arsip",
      color: "purple" as const,
    },
    {
      icon: Banknote,
      label: "Total Laba",
      value: s ? formatRupiah(s.total_laba) : "—",
      sub: "Akumulasi laba tercatat",
      color: "orange" as const,
    },
  ];

  return (
    <AdminLayout>
      {/* Filter Bar */}
      <div className="dashboard-filter-bar-v2">
        <div className="filter-group">
          <label className="filter-label">PROVINSI</label>
          <select className="filter-select"><option>Seluruh Indonesia</option></select>
        </div>
        <div className="filter-group">
          <label className="filter-label">BULAN</label>
          <select className="filter-select">
            <option>Januari</option><option>Februari</option><option>Maret</option>
            <option>April</option><option>Mei</option><option>Juni</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">TAHUN</label>
          <select className="filter-select"><option>2025</option><option>2024</option></select>
        </div>
        <div className="filter-group">
          <label className="filter-label">STATUS UMKM</label>
          <select className="filter-select"><option>Semua Status</option></select>
        </div>
        <div className="filter-group filter-group--btn">
          <label className="filter-label">&nbsp;</label>
          <button className="filter-btn">
            <Search size={16} style={{ marginRight: 8 }} /> Terapkan Filter
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && <p style={{ color: "#6b7280", fontSize: 14 }}>Memuat data dashboard...</p>}
      {error && <p className="error-message">{error}</p>}

      {/* Stat Cards */}
      <div className="stat-cards-grid">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Peta */}
      <IndonesiaMap mapData={data?.map_data ?? []} />

      {/* Baris grafik 1 */}
      <div className="charts-row">
        <RegistrationTrendChart data={data?.registration_trend ?? []} />
        <StatusDonutChart data={data?.status_distribution ?? []} />
      </div>

      {/* Baris grafik 2 */}
      <OmzetTrendChart data={data?.laba_trend ?? []} />

      {/* Baris grafik 3 */}
      <div className="charts-row">
        <RegionBarChart data={data?.top_wilayah ?? []} />
        <CategoryBarChart data={data?.kategori_performa ?? []} />
      </div>

      {/* Baris bawah */}
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
