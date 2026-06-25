import { useState, useEffect, useRef, useCallback } from "react";
import {
  geoMercator,
  geoPath,
  geoCentroid,
  type GeoPermissibleObjects,
} from "d3-geo";
import type { MapDataItem } from "../api";

const GEO_URL = "/indonesia-provinces.geojson";

// GeoJSON name (CAPS) → DB name
const GEO_TO_DB: Record<string, string> = {
  "BALI":                       "Bali",
  "BANGKA BELITUNG":            "Kepulauan Bangka Belitung",
  "BANTEN":                     "Banten",
  "BENGKULU":                   "Bengkulu",
  "DAERAH ISTIMEWA YOGYAKARTA": "DI Yogyakarta",
  "DI. ACEH":                   "Aceh",
  "DKI JAKARTA":                "DKI Jakarta",
  "GORONTALO":                  "Gorontalo",
  "JAMBI":                      "Jambi",
  "JAWA BARAT":                 "Jawa Barat",
  "JAWA TENGAH":                "Jawa Tengah",
  "JAWA TIMUR":                 "Jawa Timur",
  "KALIMANTAN BARAT":           "Kalimantan Barat",
  "KALIMANTAN SELATAN":         "Kalimantan Selatan",
  "KALIMANTAN TENGAH":          "Kalimantan Tengah",
  "KALIMANTAN TIMUR":           "Kalimantan Timur",
  "KALIMANTAN UTARA":           "Kalimantan Utara",
  "KEPULAUAN RIAU":             "Kepulauan Riau",
  "LAMPUNG":                    "Lampung",
  "MALUKU":                     "Maluku",
  "MALUKU UTARA":               "Maluku Utara",
  "NUSA TENGGARA TIMUR":        "Nusa Tenggara Timur",
  "NUSATENGGARA BARAT":         "Nusa Tenggara Barat",
  "PAPUA":                      "Papua",
  "PAPUA BARAT":                "Papua Barat",
  "RIAU":                       "Riau",
  "SULAWESI BARAT":             "Sulawesi Barat",
  "SULAWESI SELATAN":           "Sulawesi Selatan",
  "SULAWESI TENGAH":            "Sulawesi Tengah",
  "SULAWESI TENGGARA":          "Sulawesi Tenggara",
  "SULAWESI UTARA":             "Sulawesi Utara",
  "SUMATERA BARAT":             "Sumatera Barat",
  "SUMATERA SELATAN":           "Sumatera Selatan",
  "SUMATERA UTARA":             "Sumatera Utara",
};

// Label teks di dalam provinsi
const LABEL_MAP: Record<string, string[]> = {
  "Aceh":                   ["ACEH"],
  "Sumatera Utara":         ["NORTH", "SUMATERA"],
  "Sumatera Barat":         ["WEST", "SUMATERA"],
  "Riau":                   ["RIAU"],
  "Kepulauan Riau":         ["RIAU", "ISLANDS"],
  "Jambi":                  ["JAMBI"],
  "Sumatera Selatan":       ["SOUTH", "SUMATERA"],
  "Bengkulu":               ["BENGKULU"],
  "Lampung":                ["LAMPUNG"],
  "Kepulauan Bangka Belitung": ["BANGKA", "BELITUNG"],
  "DKI Jakarta":            ["JAKARTA"],
  "Jawa Barat":             ["WEST JAVA"],
  "Jawa Tengah":            ["CENTRAL JAVA"],
  "DI Yogyakarta":          ["YOGYAKARTA"],
  "Jawa Timur":             ["EAST JAVA"],
  "Banten":                 ["BANTEN"],
  "Bali":                   ["BALI"],
  "Nusa Tenggara Barat":    ["WEST NUSA", "TENGGARA"],
  "Nusa Tenggara Timur":    ["EAST NUSA", "TENGGARA"],
  "Kalimantan Barat":       ["WEST", "KALIMANTAN"],
  "Kalimantan Tengah":      ["CENTRAL", "KALIMANTAN"],
  "Kalimantan Selatan":     ["SOUTH", "KALIMANTAN"],
  "Kalimantan Timur":       ["EAST", "KALIMANTAN"],
  "Kalimantan Utara":       ["NORTH", "KALIMANTAN"],
  "Sulawesi Utara":         ["NORTH", "SULAWESI"],
  "Gorontalo":              ["GORONTALO"],
  "Sulawesi Tengah":        ["CENTRAL", "SULAWESI"],
  "Sulawesi Selatan":       ["SOUTH", "SULAWESI"],
  "Sulawesi Tenggara":      ["SOUTHEAST", "SULAWESI"],
  "Sulawesi Barat":         ["WEST", "SULAWESI"],
  "Maluku":                 ["MALUKU"],
  "Maluku Utara":           ["NORTH", "MALUKU"],
  "Papua Barat":            ["WEST PAPUA"],
  "Papua":                  ["PAPUA"],
};

const SKIP_LABEL = new Set([
  "DKI Jakarta", "DI Yogyakarta", "Bali",
  "Kepulauan Riau", "Kepulauan Bangka Belitung",
  "Sulawesi Barat", "Banten",
]);

// Warna biru interpolasi
function blueColor(ratio: number): string {
  const stops: [number, number, number][] = [
    [200, 228, 244],
    [130, 186, 225],
    [ 65, 138, 196],
    [ 22,  84, 158],
    [  8,  40, 105],
  ];
  const r = Math.min(ratio, 1);
  const idx = r * (stops.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, stops.length - 1);
  const t = idx - lo;
  const R = Math.round(stops[lo][0] + t * (stops[hi][0] - stops[lo][0]));
  const G = Math.round(stops[lo][1] + t * (stops[hi][1] - stops[lo][1]));
  const B = Math.round(stops[lo][2] + t * (stops[hi][2] - stops[lo][2]));
  return `rgb(${R},${G},${B})`;
}

function labelColor(ratio: number): string {
  return ratio > 0.38 ? "#ffffff" : "#0a2560";
}

function formatRupiah(v: number): string {
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)} M`;
  if (v >= 1_000_000)     return `Rp ${(v / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${v.toLocaleString("id-ID")}`;
}

type GeoFeature = {
  type: string;
  properties: Record<string, string>;
  geometry: GeoPermissibleObjects;
};

type TooltipState = {
  x: number; y: number;
  provinsi: string; totalUMKM: number; totalLaba: number;
} | null;

const W = 900;
const H = 370;

type Props = { mapData: MapDataItem[] };

export default function IndonesiaMap({ mapData }: Props) {
  const [geoData,    setGeoData]    = useState<GeoFeature[]>([]);
  const [tooltip,    setTooltip]    = useState<TooltipState>(null);
  const [hovered,    setHovered]    = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Load GeoJSON sekali
  useEffect(() => {
    fetch(GEO_URL)
      .then((r) => r.json())
      .then((fc) => setGeoData(fc.features ?? []))
      .catch(console.error);
  }, []);

  // Agregasi per provinsi DB
  const byProvinsi = mapData.reduce<Record<string, { total_umkm: number; total_laba: number }>>(
    (acc, d) => {
      if (!acc[d.provinsi]) acc[d.provinsi] = { total_umkm: 0, total_laba: 0 };
      acc[d.provinsi].total_umkm += d.total_umkm;
      acc[d.provinsi].total_laba += d.total_laba;
      return acc;
    }, {}
  );
  const maxLaba = Math.max(...Object.values(byProvinsi).map((v) => v.total_laba), 1);

  // Buat proyeksi Mercator — fit Indonesia ke dalam SVG secara dinamis
  const projection = geoMercator()
    .fitExtent([[20, 20], [W - 20, H - 20]], { type: "FeatureCollection", features: geoData } as any);

  const pathGen = geoPath().projection(projection);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, dbName: string, umkm: number, laba: number) => {
      setHovered(dbName);
      setTooltip({ x: e.clientX, y: e.clientY, provinsi: dbName, totalUMKM: umkm, totalLaba: laba });
    }, []
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltip((p) => p ? { ...p, x: e.clientX, y: e.clientY } : p);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
    setTooltip(null);
  }, []);

  return (
    <div className="map-card-v2">
      {/* Header */}
      <div className="map-card-v2__header">
        <div className="map-card-v2__title">Peta Kepadatan Omzet UMKM Nasional</div>
        <div className="map-card-v2__sub">
          Visualisasi kepadatan konsentrasi UMKM di seluruh wilayah Indonesia
        </div>
      </div>

      {/* Peta SVG */}
      <div className="map-card-v2__body">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          {geoData.map((geo, i) => {
            const rawName = (geo.properties?.Propinsi ?? "").trim().toUpperCase();
            const dbName  = GEO_TO_DB[rawName] ?? rawName;
            const data    = byProvinsi[dbName];
            const laba    = data?.total_laba ?? 0;
            const umkm    = data?.total_umkm ?? 0;
            const ratio   = laba / maxLaba;
            const isHov   = hovered === dbName;

            const d = pathGen(geo.geometry as Parameters<typeof pathGen>[0]);
            if (!d) return null;

            const fill = isHov ? "#ffc933" : (laba > 0 ? blueColor(ratio) : "#b8d9ef");

            // Hitung centroid untuk label
            let cx = 0, cy = 0;
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const [lon, lat] = geoCentroid(geo.geometry as any);
              const proj = projection([lon, lat]);
              if (proj) { cx = proj[0]; cy = proj[1]; }
            } catch { /* skip */ }

            const lines   = LABEL_MAP[dbName];
            const showLbl = lines && !SKIP_LABEL.has(dbName) && cx > 0;
            const fSize   = dbName === "Papua" ? 8 : 5.5;
            const tColor  = isHov ? "#1a3a8f" : labelColor(ratio);
            const lineH   = fSize + 1.5;

            return (
              <g key={i}>
                <path
                  d={d}
                  fill={fill}
                  stroke="#ffffff"
                  strokeWidth={0.5}
                  style={{ cursor: "pointer", transition: "fill 0.12s" }}
                  onMouseEnter={(e) => handleMouseEnter(e, dbName, umkm, laba)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                />
                {showLbl && lines && (
                  <text
                    x={cx}
                    y={cy - ((lines.length - 1) * lineH) / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fSize}
                    fontWeight={700}
                    fill={tColor}
                    letterSpacing="0.04em"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {lines.map((line, li) => (
                      <tspan key={li} x={cx} dy={li === 0 ? 0 : lineH}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="map-legend-v2">
          <div className="map-legend-v2__label-top">VOLUME OMZET UMKM</div>
          <div className="map-legend-v2__bar" />
          <div className="map-legend-v2__labels">
            <span>Rendah (Low)</span>
            <span>Tinggi (High)</span>
          </div>
        </div>

        <div className="map-hint">🖱️ Hover provinsi untuk detail</div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="map-tooltip"
          style={{
            position: "fixed",
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          <div className="map-tooltip__title">{tooltip.provinsi}</div>
          <div className="map-tooltip__row">
            <span>UMKM</span>
            <strong>{tooltip.totalUMKM.toLocaleString("id-ID")}</strong>
          </div>
          <div className="map-tooltip__row">
            <span>Total Laba</span>
            <strong>{formatRupiah(tooltip.totalLaba)}</strong>
          </div>
          {tooltip.totalLaba === 0 && (
            <div className="map-tooltip__empty">Belum ada data</div>
          )}
        </div>
      )}
    </div>
  );
}
