import type { MapDataItem } from "../api";

// Koordinat kasar pusat tiap provinsi (SVG viewBox 0 0 900 400)
const PROVINCE_COORDS: Record<string, { cx: number; cy: number; rx: number; ry: number }> = {
  "Sumatera Utara":    { cx: 140, cy: 160, rx: 50, ry: 30 },
  "Sumatera Barat":   { cx: 155, cy: 210, rx: 35, ry: 25 },
  "Riau":             { cx: 210, cy: 195, rx: 35, ry: 25 },
  "Sumatera Selatan": { cx: 195, cy: 240, rx: 40, ry: 25 },
  "Lampung":          { cx: 215, cy: 270, rx: 28, ry: 20 },
  "DKI Jakarta":      { cx: 320, cy: 265, rx: 14, ry: 10 },
  "Jawa Barat":       { cx: 348, cy: 270, rx: 38, ry: 20 },
  "Jawa Tengah":      { cx: 400, cy: 268, rx: 38, ry: 20 },
  "DI Yogyakarta":    { cx: 400, cy: 282, rx: 14, ry: 10 },
  "Jawa Timur":       { cx: 450, cy: 268, rx: 40, ry: 20 },
  "Bali":             { cx: 503, cy: 278, rx: 18, ry: 12 },
  "Kalimantan Barat": { cx: 465, cy: 190, rx: 50, ry: 40 },
  "Kalimantan Tengah":{ cx: 510, cy: 195, rx: 50, ry: 38 },
  "Kalimantan Timur": { cx: 560, cy: 175, rx: 45, ry: 40 },
  "Kalimantan Selatan":{ cx: 528, cy: 240, rx: 35, ry: 25 },
  "Sulawesi Selatan": { cx: 620, cy: 230, rx: 28, ry: 38 },
  "Sulawesi Tengah":  { cx: 635, cy: 185, rx: 30, ry: 30 },
  "Sulawesi Utara":   { cx: 660, cy: 155, rx: 28, ry: 18 },
  "Maluku":           { cx: 720, cy: 240, rx: 25, ry: 35 },
  "Papua Barat":      { cx: 760, cy: 215, rx: 35, ry: 35 },
  "Papua":            { cx: 820, cy: 220, rx: 55, ry: 50 },
};

// Fallback: posisi acak tapi tidak di laut
const FALLBACK_POSITIONS = [
  { cx: 180, cy: 200 }, { cx: 350, cy: 200 }, { cx: 500, cy: 200 },
  { cx: 640, cy: 200 }, { cx: 780, cy: 200 },
];

function getColor(totalLaba: number, maxLaba: number): string {
  if (maxLaba === 0) return "#bfdbfe";
  const ratio = totalLaba / maxLaba;
  if (ratio > 0.66) return "#1d4ed8";
  if (ratio > 0.33) return "#3b82f6";
  return "#93c5fd";
}

type Props = {
  mapData: MapDataItem[];
};

export default function IndonesiaMap({ mapData }: Props) {
  const maxLaba = Math.max(...mapData.map((d) => d.total_laba), 1);

  // Agregasi per provinsi
  const byProvinsi = mapData.reduce<Record<string, { total_umkm: number; total_laba: number }>>(
    (acc, d) => {
      if (!acc[d.provinsi]) acc[d.provinsi] = { total_umkm: 0, total_laba: 0 };
      acc[d.provinsi].total_umkm += d.total_umkm;
      acc[d.provinsi].total_laba += d.total_laba;
      return acc;
    },
    {}
  );

  const provinces = Object.entries(byProvinsi);

  return (
    <div className="map-card">
      <div className="chart-card__header">
        <div>
          <div className="chart-card__title">Peta Kepadatan Laba UMKM Nasional</div>
          <div className="chart-card__sub">Visualisasi distribusi laba seluruh Indonesia</div>
        </div>
      </div>
      <div className="map-container">
        <svg viewBox="0 0 900 400" className="map-svg">
          {/* Base islands (fallback shapes) */}
          <ellipse cx="180" cy="200" rx="120" ry="55" fill="#dbeafe" opacity="0.4" />
          <ellipse cx="400" cy="270" rx="100" ry="30" fill="#dbeafe" opacity="0.4" />
          <ellipse cx="500" cy="175" rx="90" ry="70" fill="#dbeafe" opacity="0.4" />
          <ellipse cx="640" cy="190" rx="45" ry="65" fill="#dbeafe" opacity="0.4" />
          <ellipse cx="800" cy="210" rx="75" ry="60" fill="#dbeafe" opacity="0.4" />

          {/* Data circles per provinsi */}
          {provinces.map(([provinsi, val], i) => {
            const coords = PROVINCE_COORDS[provinsi] ?? {
              ...FALLBACK_POSITIONS[i % FALLBACK_POSITIONS.length],
              rx: 30,
              ry: 20,
            };
            const color = getColor(val.total_laba, maxLaba);
            const shortName = provinsi.replace(/^(DI |DKI )/, "").slice(0, 10);

            return (
              <g key={provinsi}>
                <ellipse
                  cx={coords.cx}
                  cy={coords.cy}
                  rx={coords.rx}
                  ry={coords.ry}
                  fill={color}
                  opacity="0.85"
                >
                  <title>{provinsi}: {val.total_umkm} UMKM, Rp {(val.total_laba / 1_000_000).toFixed(1)} Jt</title>
                </ellipse>
                <text
                  x={coords.cx}
                  y={coords.cy + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill={color === "#1d4ed8" ? "#fff" : "#1e3a8a"}
                >
                  {shortName}
                </text>
              </g>
            );
          })}

          {/* Jika tidak ada data, tampilkan peta statis */}
          {provinces.length === 0 && (
            <>
              <text x="450" y="200" textAnchor="middle" fontSize="14" fill="#9ca3af">
                Belum ada data peta
              </text>
            </>
          )}
        </svg>

        {/* Legend */}
        <div className="map-legend">
          <div className="map-legend__title">Kepadatan Laba</div>
          <div className="map-legend__scale">
            <span>Rendah</span>
            <div className="map-legend__bar" />
            <span>Tinggi</span>
          </div>
          <div className="map-legend__items">
            <div className="map-legend__item"><span style={{ background: "#bfdbfe" }} />{"< 33%"}</div>
            <div className="map-legend__item"><span style={{ background: "#3b82f6" }} />33% – 66%</div>
            <div className="map-legend__item"><span style={{ background: "#1d4ed8" }}/>{"≥ 67%"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
