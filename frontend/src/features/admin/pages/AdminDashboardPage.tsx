import { Store, Handshake, TrendingUp, AlertCircle, Banknote } from "lucide-react";
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

const stats = [
  { icon: Store,      label: "Total UMKM",          value: "1,245,892", sub: "Terdaftar di database",              color: "blue"   as const },
  { icon: Handshake,  label: "UMKM Aktif",           value: "892,450",   sub: "Transaksi 30 hari terakhir",         color: "green"  as const },
  { icon: TrendingUp, label: "UMKM Berkembang",      value: "156,220",   sub: "Naik kelas dalam 1 bulan terakhir",  color: "yellow" as const },
  { icon: AlertCircle, label: "UMKM Tidak Aktif",     value: "197,222",   sub: "Tanpa aktivitas lebih dari 90 hari", color: "purple" as const },
  { icon: Banknote,   label: "Total Omzet",          value: "Rp 1206 T", sub: "Total omzet UMKM",                  color: "orange" as const },
];

export default function AdminDashboardPage() {
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
          <select className="filter-select"><option>Januari</option><option>Februari</option><option>Maret</option></select>
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
          <button className="filter-btn">🔍 Terapkan Filter</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards-grid">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Peta */}
      <IndonesiaMap />

      {/* Baris grafik 1 */}
      <div className="charts-row">
        <RegistrationTrendChart />
        <StatusDonutChart />
      </div>

      {/* Baris grafik 2 */}
      <OmzetTrendChart />

      {/* Baris grafik 3 */}
      <div className="charts-row">
        <RegionBarChart />
        <CategoryBarChart />
      </div>

      {/* Baris bawah */}
      <div className="charts-row">
        <div className="info-card">
          <div className="chart-card__title">📊 Tren Pertumbuhan</div>
          <p>Pertumbuhan pada 5 tahun UMKM terus meningkat, omzet naik dari tahun ke tahun, menunjukkan tren positif yang kuat dan berkesinambungan menuju target nasional.</p>
        </div>
        <div className="info-card warning">
          <div className="chart-card__title">⚠️ Atensi Khusus</div>
          <p>Terdapat 197,892 UMKM Mikro TIDAK AKTIF di DKI Jakarta (5%) yang perlu perhatian segera. Lakukan revitalisasi untuk mempertahankan ekosistem UMKM yang sehat.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
