import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";
import type {
  RegistrationTrendItem,
  StatusDistributionItem,
  LabaTimeseriesItem,
  TopWilayahItem,
  KategoriPerformaItem,
} from "../api";

// ─── Registration Trend ───────────────────────────────────────────────────────

const EmptyChart = () => (
  <div className="chart-empty">
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-6" />
    </svg>
    <p>Data tidak tersedia</p>
  </div>
);

export function RegistrationTrendChart({ data }: { data: RegistrationTrendItem[] }) {
  if (data.length === 0) return <div className="chart-card"><div className="chart-card__header"><div><div className="chart-card__title">Tren Pendaftaran UMKM Baru</div><div className="chart-card__sub">Jumlah pendaftaran tiap bulan</div></div><span className="chart-badge">+Rincian</span></div><EmptyChart /></div>;

  const chartData = data.map((d) => ({
    bulan: d.tanggal.slice(0, 7), // YYYY-MM
    total: d.total_pendaftaran,
  }));

  const maxTotal = chartData.length > 0 ? Math.max(...chartData.map((d) => d.total)) : 0;

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div>
          <div className="chart-card__title">Tren Pendaftaran UMKM Baru</div>
          <div className="chart-card__sub">Jumlah pendaftaran tiap bulan</div>
        </div>
        <span className="chart-badge">+Rincian</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [(value as number).toLocaleString("id-ID"), "Pendaftaran"]} />
          <Line type="monotone" dataKey="total" stroke="#1f45b6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
      {chartData.length > 0 && (
        <div className="chart-stats-row">
          <div className="chart-stat">
            <span className="label">Total Periode</span>
            <span className="value">{chartData.length} bulan</span>
          </div>
          <div className="chart-stat">
            <span className="label">Terbanyak</span>
            <span className="value">{maxTotal.toLocaleString("id-ID")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Status Donut ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  AKTIF: "#1f45b6",
  NONAKTIF: "#ffc933",
  SUSPEND: "#ef4444",
  ARSIP: "#9ca3af",
};

export function StatusDonutChart({ data }: { data: StatusDistributionItem[] }) {
  if (data.length === 0) return <div className="chart-card"><div className="chart-card__header"><div className="chart-card__title">Distribusi Status UMKM</div></div><EmptyChart /></div>;

  const chartData = data.map((d) => ({
    name: d.nama_status,
    value: d.total,
    color: STATUS_COLORS[d.status_id] ?? "#6b7280",
  }));

  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div className="chart-card__title">Distribusi Status UMKM</div>
      </div>
      <div className="donut-wrapper">
        <PieChart width={200} height={200}>
          <Pie
            data={chartData}
            cx={95}
            cy={95}
            innerRadius={60}
            outerRadius={85}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
        <div className="donut-center">
          <div className="donut-total">{total.toLocaleString("id-ID")}</div>
          <div className="donut-label">TOTAL UMKM</div>
        </div>
      </div>
      <div className="donut-legend">
        {chartData.map((item) => (
          <div key={item.name} className="donut-legend-item">
            <span className="donut-dot" style={{ background: item.color }} />
            <span className="donut-legend-label">{item.name}</span>
            <span className="donut-legend-value">{item.value.toLocaleString("id-ID")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Laba / Omzet Trend ───────────────────────────────────────────────────────

export function OmzetTrendChart({ data }: { data: LabaTimeseriesItem[] }) {
  if (data.length === 0) return <div className="chart-card full-width"><div className="chart-card__header"><div><div className="chart-card__title">Tren Omzet UMKM</div><div className="chart-card__sub">Total omzet per bulan (dalam juta Rp)</div></div><span className="chart-badge">+Rincian</span></div><EmptyChart /></div>;

  const chartData = data.map((d) => ({
    bulan: d.tanggal.slice(0, 7),
    omzet: Math.round(d.total_laba / 1_000_000), // dalam juta
  }));

  const maxOmzet = chartData.length > 0 ? Math.max(...chartData.map((d) => d.omzet)) : 0;

  return (
    <div className="chart-card full-width">
      <div className="chart-card__header">
        <div>
          <div className="chart-card__title">Tren Omzet UMKM</div>
          <div className="chart-card__sub">Total omzet per bulan (dalam juta Rp)</div>
        </div>
        <span className="chart-badge">+Rincian</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => {
              const omzet = typeof value === "number" ? value : Number(value ?? 0);
              return [`Rp ${omzet} Jt`, "Omzet"];
            }}
          />
          <Line type="monotone" dataKey="omzet" stroke="#1f45b6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-stats-row">
        <div className="chart-stat">
          <span className="label">Omzet Terbesar</span>
          <span className="value">Rp {maxOmzet.toLocaleString("id-ID")} Jt</span>
        </div>
      </div>
    </div>
  );
}

// ─── Region Bar ───────────────────────────────────────────────────────────────

export function RegionBarChart({ data }: { data: TopWilayahItem[] }) {
  if (data.length === 0) return <div className="chart-card"><div className="chart-card__header"><div className="chart-card__title">Top 5 Wilayah Berdasarkan Laba</div></div><EmptyChart /></div>;

  const chartData = data.map((d) => ({
    wilayah: d.kabupaten_kota.length > 12 ? d.kabupaten_kota.slice(0, 12) + "…" : d.kabupaten_kota,
    laba: Math.round(d.total_laba / 1_000_000),
    rank: d.peringkat_nasional,
  }));

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div className="chart-card__title">Top 5 Wilayah Berdasarkan Laba</div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="wilayah" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => {
              const laba = typeof value === "number" ? value : Number(value ?? 0);
              return [`Rp ${laba} Jt`, "Laba"];
            }}
          />
          <Bar dataKey="laba" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.rank === 1 ? "#ffc933" : "#1f45b6"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Category Bar ─────────────────────────────────────────────────────────────

export function CategoryBarChart({ data }: { data: KategoriPerformaItem[] }) {
  if (data.length === 0) return <div className="chart-card"><div className="chart-card__header"><div className="chart-card__title">Analisis Performa Kategori</div></div><EmptyChart /></div>;

  const maxLaba = data.length > 0 ? Math.max(...data.map((d) => d.total_laba)) : 1;

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div className="chart-card__title">Analisis Performa Kategori</div>
      </div>
      <div className="category-bars">
        {data.map((item) => {
          const pct = maxLaba > 0 ? (item.total_laba / maxLaba) * 100 : 0;
          return (
            <div key={item.kategori_usaha_id} className="category-bar-item">
              <span className="category-label">{item.nama_kategori}</span>
              <div className="category-bar-track">
                <div
                  className="category-bar-fill"
                  style={{
                    width: `${pct}%`,
                    background: pct > 70 ? "#ffc933" : "#1f45b6",
                  }}
                />
              </div>
              <span className="category-value">
                {item.total_umkm.toLocaleString("id-ID")} UMKM
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
