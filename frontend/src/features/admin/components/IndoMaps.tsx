import { useState, useCallback, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
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
  "PAPUA BARAT DAYA":           "Papua Barat Daya",
  "PAPUA PEGUNUNGAN":           "Papua Pegunungan",
  "PAPUA SELATAN":              "Papua Selatan",
  "PAPUA TENGAH":               "Papua Tengah",
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

const NO_DATA_FILL = "#E5E7EB";
const NUM_COLOR_STEPS = 9;

function formatRupiah(v: number): string {
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)} M`;
  if (v >= 1_000_000)     return `Rp ${(v / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${v.toLocaleString("id-ID")}`;
}

type Props = { mapData: MapDataItem[] };

type ProvinceSummary = {
  totalLaba: number;
  totalUmkm: number;
  avgOmzet: number;
};

type TooltipState = {
  x: number; y: number;
  provinsi: string;
  avgOmzet: number;
  totalLaba: number;
  totalUmkm: number;
} | null;

export default function IndoMaps({ mapData }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [zoom, setZoom] = useState(1);

  const byProvinsi = useMemo(() => {
    const acc: Record<string, ProvinceSummary> = {};
    for (const d of mapData) {
      const entry = acc[d.provinsi];
      if (entry) {
        entry.totalLaba += d.total_laba;
        entry.totalUmkm += d.total_umkm;
      } else {
        acc[d.provinsi] = {
          totalLaba: d.total_laba,
          totalUmkm: d.total_umkm,
          avgOmzet: 0,
        };
      }
    }
    for (const v of Object.values(acc)) {
      v.avgOmzet = v.totalUmkm > 0 ? v.totalLaba / v.totalUmkm : 0;
    }
    return acc;
  }, [mapData]);

  const maxAvg = useMemo(() => {
    const values = Object.values(byProvinsi).map(v => v.avgOmzet).filter(v => v > 0);
    return values.length > 0 ? Math.max(...values) : 1;
  }, [byProvinsi]);

  const colorScale = useMemo(() => {
    return scaleQuantize<string>()
      .domain([0, maxAvg])
      .range(
        Array.from({ length: NUM_COLOR_STEPS }, (_, i) =>
          interpolateBlues((i + 1) / NUM_COLOR_STEPS)
        )
      );
  }, [maxAvg]);

  const gradientStops = useMemo(() => {
    return Array.from({ length: NUM_COLOR_STEPS }, (_, i) =>
      interpolateBlues((i + 1) / NUM_COLOR_STEPS)
    );
  }, []);

  const gradientCSS = useMemo(() => {
    const stops = gradientStops.map((c, i) => `${c} ${Math.round((i / (NUM_COLOR_STEPS - 1)) * 100)}%`);
    return `linear-gradient(to right, ${stops.join(", ")})`;
  }, [gradientStops]);

  const legendLabels = useMemo(() => {
    const step = maxAvg / (NUM_COLOR_STEPS - 1);
    return Array.from({ length: NUM_COLOR_STEPS }, (_, i) =>
      formatRupiah(Math.round(step * i))
    );
  }, [maxAvg]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, dbName: string, summary: ProvinceSummary | undefined) => {
      setTooltip({
        x: e.clientX, y: e.clientY,
        provinsi: dbName,
        avgOmzet: summary?.avgOmzet ?? 0,
        totalLaba: summary?.totalLaba ?? 0,
        totalUmkm: summary?.totalUmkm ?? 0,
      });
    }, []
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltip((p) => p ? { ...p, x: e.clientX, y: e.clientY } : p);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div className="map-card-v2" style={{ background: "#ffffff", borderRadius: 16, overflow: "hidden" }}>
      <div className="map-card-v2__header" style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
          Peta Kepadatan Omzet UMKM Nasional
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          Rata-rata omzet UMKM per provinsi — dari Sabang hingga Merauke.
        </div>
      </div>

      <div style={{ position: "relative", padding: 0, background: "#ffffff" }}>
        {/* Reset Zoom Button */}
        <button
          onClick={() => setZoom(1)}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            padding: "8px 16px",
            background: "#1a3fa4",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          Reset View
        </button>

        {/* THE MAP */}
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [118, -2.5],
            scale: 950,
          }}
          width={980}
          height={440}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            background: "#f8fafc"
          }}
        >
          <ZoomableGroup
            zoom={zoom}
            onMoveEnd={({ zoom }) => setZoom(zoom)}
            center={[118, -2.5]}
            minZoom={1}
            maxZoom={4}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) => {
                if (!geographies || geographies.length === 0) {
                  return null;
                }

                return geographies.map((geo) => {
                  const rawName = (geo.properties?.Propinsi ?? "").trim().toUpperCase();
                  const dbName  = GEO_TO_DB[rawName] ?? rawName;
                  const summary = byProvinsi[dbName];
                  const avg     = summary?.avgOmzet ?? 0;
                  const fill    = avg > 0 ? colorScale(avg) : NO_DATA_FILL;

                  return (
                    <Geography
                      key={geo.rsmKey || geo.properties?.kode}
                      geography={geo}
                      fill={fill}
                      stroke="#ffffff"
                      strokeWidth={0.6}
                      fillRule="evenodd"
                      clipRule="evenodd"
                      style={{
                        default: { outline: "none", transition: "all 0.2s" },
                        hover: {
                          fill: "#f97316",
                          outline: "none",
                          cursor: "pointer",
                          strokeWidth: 1.5,
                          stroke: "#0f172a"
                        },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e as unknown as React.MouseEvent, dbName, summary)}
                      onMouseMove={(e) => handleMouseMove(e as unknown as React.MouseEvent)}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                });
              }}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Legend */}
        <div style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          padding: 16,
          borderRadius: 12,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          border: "1px solid #e2e8f0",
          minWidth: 200,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            Rata-Rata Omzet UMKM
          </div>
          <div style={{ height: 12, borderRadius: 6, background: gradientCSS, marginBottom: 8 }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>
            <span>{legendLabels[0]}</span>
            <span>{legendLabels[NUM_COLOR_STEPS - 1]}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 12 }}>
            <span>Rendah</span>
            <span>Tinggi</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b", paddingTop: 8, borderTop: "1px solid #e2e8f0" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: "#E5E7EB", display: "inline-block" }} />
            Tidak ada data
          </div>
        </div>

        {/* Hint */}
        <div style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          fontSize: 11,
          color: "#94a3b8",
          background: "rgba(255,255,255,0.9)",
          padding: "6px 12px",
          borderRadius: 20,
        }}>
          Arahkan kursor untuk detail • Scroll untuk zoom
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: Math.min(tooltip.x + 14, (typeof window !== 'undefined' ? window.innerWidth - 280 : 800)),
            top: Math.min(tooltip.y - 10, (typeof window !== 'undefined' ? window.innerHeight - 160 : 600)),
            pointerEvents: "none",
            zIndex: 9999,
            background: "#1e293b",
            color: "#ffffff",
            padding: "14px 18px",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            minWidth: 220,
            fontSize: 13,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
            {tooltip.provinsi}
          </div>
          {tooltip.totalUmkm > 0 ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#94a3b8", fontSize: 12 }}>Rata-rata Omzet</span>
                <strong>{formatRupiah(tooltip.avgOmzet)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#94a3b8", fontSize: 12 }}>Total Omzet</span>
                <strong>{formatRupiah(tooltip.totalLaba)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8", fontSize: 12 }}>Total UMKM</span>
                <strong>{tooltip.totalUmkm.toLocaleString("id-ID")}</strong>
              </div>
            </>
          ) : (
            <div style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 12 }}>
              Belum ada data untuk {tooltip.provinsi}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
