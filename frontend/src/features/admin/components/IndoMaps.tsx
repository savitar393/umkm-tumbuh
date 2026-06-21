import { useState, useCallback, useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleQuantize } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";
import type { MapDataItem } from "../api";

const GEO_URL = "/indonesia-provinces.geojson";

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

const NO_DATA_FILL = "#E0E0E0";
const NUM_COLOR_STEPS = 9;

function formatRupiah(v: number): string {
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)} M`;
  if (v >= 1_000_000)     return `Rp ${(v / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${v.toLocaleString("id-ID")}`;
}

type Props = { mapData: MapDataItem[] };

type TooltipState = {
  x: number; y: number;
  provinsi: string; omzet: number; hasData: boolean;
} | null;

export default function IndonesiaMap({ mapData }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const byProvinsi = useMemo(() => {
    return mapData.reduce<Record<string, number>>((acc, d) => {
      acc[d.provinsi] = (acc[d.provinsi] ?? 0) + d.total_laba;
      return acc;
    }, {});
  }, [mapData]);

  const maxOmzet = useMemo(() => {
    const values = Object.values(byProvinsi).filter(v => v > 0);
    return values.length > 0 ? Math.max(...values) : 1;
  }, [byProvinsi]);

  const colorScale = useMemo(() => {
    return scaleQuantize<string>()
      .domain([0, maxOmzet])
      .range(
        Array.from({ length: NUM_COLOR_STEPS }, (_, i) => interpolateBlues((i + 1) / NUM_COLOR_STEPS))
      );
  }, [maxOmzet]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, dbName: string, omzet: number) => {
      setTooltip({ x: e.clientX, y: e.clientY, provinsi: dbName, omzet, hasData: omzet > 0 });
    }, []
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltip((p) => p ? { ...p, x: e.clientX, y: e.clientY } : p);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div className="map-card-v2">
      <div className="map-card-v2__header">
        <div className="map-card-v2__title">Peta Kepadatan Omzet UMKM Nasional</div>
        <div className="map-card-v2__sub">
          Persebaran kepadatan omzet UMKM di seluruh provinsi Indonesia berdasarkan akumulasi nilai omzet
        </div>
      </div>

      <div className="map-card-v2__body" style={{ position: "relative", padding: "16px 16px 40px" }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [118.0, -2.0],
            scale: 1100,
          }}
          width={960}
          height={550}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const rawName = (geo.properties?.Propinsi ?? "").trim().toUpperCase();
                const dbName  = GEO_TO_DB[rawName] ?? rawName;
                const omzet   = byProvinsi[dbName] ?? 0;
                const fill    = omzet > 0 ? colorScale(omzet) : NO_DATA_FILL;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={0.8}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        fill: "#ffc933",
                        outline: "none",
                        cursor: "pointer",
                        strokeWidth: 1.5,
                        stroke: "#333"
                      },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e as unknown as React.MouseEvent, dbName, omzet)}
                    onMouseMove={(e) => handleMouseMove(e as unknown as React.MouseEvent)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        <div className="map-legend-v2">
          <div className="map-legend-v2__label-top">VOLUME OMZET UMKM</div>
          <div className="map-legend-v2__bar" />
          <div className="map-legend-v2__labels">
            <span>Rendah</span>
            <span>Tinggi</span>
          </div>
          <div className="map-legend-v2__no-data">
            <span className="legend-gray-dot" /> Tidak ada data
          </div>
        </div>

        <div className="map-hint">Hover provinsi untuk detail</div>
      </div>

      {tooltip && (
        <div
          className="map-tooltip"
          style={{
            position: "fixed",
            left: typeof window !== 'undefined' ? Math.min(tooltip.x + 14, window.innerWidth - 280) : tooltip.x + 14,
            top: typeof window !== 'undefined' ? Math.min(tooltip.y - 10, window.innerHeight - 120) : tooltip.y - 10,
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          <div className="map-tooltip__title">{tooltip.provinsi}</div>
          {tooltip.hasData ? (
            <div className="map-tooltip__row">
              <span>Omzet</span>
              <strong>{formatRupiah(tooltip.omzet)}</strong>
            </div>
          ) : (
            <div className="map-tooltip__empty">Tidak ada data untuk {tooltip.provinsi}</div>
          )}
        </div>
      )}
    </div>
  );
}
