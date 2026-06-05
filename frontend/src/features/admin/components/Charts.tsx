import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";

// --- Data dummy ---
const registrationTrend = [
  { bulan: "Agt'24", total: 800 },
  { bulan: "Sep'24", total: 1100 },
  { bulan: "Okt'24", total: 950 },
  { bulan: "Nov'24", total: 1400 },
  { bulan: "Des'24", total: 1250 },
  { bulan: "Jan'25", total: 1455 },
];

const omzetTrend = [
  { bulan: "Agt'24", omzet: 30 },
  { bulan: "Sep'24", omzet: 55 },
  { bulan: "Okt'24", omzet: 45 },
  { bulan: "Nov'24", omzet: 80 },
  { bulan: "Des'24", omzet: 95 },
  { bulan: "Jan'25", omzet: 130 },
];

const statusData = [
  { name: "Aktif", value: 76, color: "#1f45b6" },
  { name: "Tidak Aktif", value: 24, color: "#ffc933" },
];

const regionData = [
  { wilayah: "DKI Jakarta", omzet: 1022 },
  { wilayah: "Jawa Barat", omzet: 1558 },
  { wilayah: "Jawa Tengah", omzet: 1041 },
  { wilayah: "Jawa Timur", omzet: 1814 },
  { wilayah: "Bali", omzet: 998 },
];

const categoryData = [
  { kategori: "Kuliner", nilai: 85 },
  { kategori: "Fashion", nilai: 67 },
  { kategori: "Kerajinan", nilai: 53 },
  { kategori: "Jasa", nilai: 72 },
];

// --- Komponen grafik ---

export function RegistrationTrendChart() {
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
        <LineChart data={registrationTrend}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="total" stroke="#1f45b6" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-stats-row">
        <div className="chart-stat"><span className="label">Rata-rata Bulanan</span><span className="value">1,455 unit</span></div>
        <div className="chart-stat"><span className="label">Pendaftar Terbanyak</span><span className="value">2,810 unit</span></div>
        <div className="chart-stat"><span className="label">Pertumbuhan</span><span className="value green">98.5% complete</span></div>
      </div>
    </div>
  );
}

export function StatusDonutChart() {
  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div className="chart-card__title">Distribusi Status UMKM</div>
      </div>
      <div className="donut-wrapper">
        <PieChart width={200} height={200}>
          <Pie
            data={statusData}
            cx={95}
            cy={95}
            innerRadius={60}
            outerRadius={85}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {statusData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
        <div className="donut-center">
          <div className="donut-total">12 RM</div>
          <div className="donut-label">TOTAL UNIT</div>
        </div>
      </div>
      <div className="donut-legend">
        {statusData.map((item) => (
          <div key={item.name} className="donut-legend-item">
            <span className="donut-dot" style={{ background: item.color }} />
            <span className="donut-legend-label">{item.name}</span>
            <span className="donut-legend-value">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OmzetTrendChart() {
  return (
    <div className="chart-card full-width">
      <div className="chart-card__header">
        <div>
          <div className="chart-card__title">Tren Omzet UMKM</div>
          <div className="chart-card__sub">Omzet per bulan (dalam juta Rp)</div>
        </div>
        <span className="chart-badge">+Rincian</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={omzetTrend}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [`Rp ${v} M`, "Omzet"]} />
          <Line type="monotone" dataKey="omzet" stroke="#1f45b6" strokeWidth={2} fill="#eef3ff" dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-stats-row">
        <div className="chart-stat"><span className="label">Rata-rata Bulanan</span><span className="value">Rp 50 M</span></div>
        <div className="chart-stat"><span className="label">Pendapatan Terbesar</span><span className="value">Rp 130 M</span></div>
      </div>
    </div>
  );
}

export function RegionBarChart() {
  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div className="chart-card__title">Top 5 Wilayah Berdasarkan Omzet Tertinggi</div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={regionData} margin={{ bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="wilayah" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [`Rp ${v} M`, "Omzet"]} />
          <Bar dataKey="omzet" radius={[6, 6, 0, 0]}>
            {regionData.map((_, index) => (
              <Cell key={index} fill={index === 3 ? "#ffc933" : "#1f45b6"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBarChart() {
  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div className="chart-card__title">Analisis Performa Kategori</div>
      </div>
      <div className="category-bars">
        {categoryData.map((item) => (
          <div key={item.kategori} className="category-bar-item">
            <span className="category-label">{item.kategori}</span>
            <div className="category-bar-track">
              <div
                className="category-bar-fill"
                style={{ width: `${item.nilai}%`, background: item.nilai > 70 ? "#ffc933" : "#1f45b6" }}
              />
            </div>
            <span className="category-value">Rp {item.nilai}T</span>
          </div>
        ))}
      </div>
    </div>
  );
}
