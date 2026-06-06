export default function IndonesiaMap() {
  return (
    <div className="map-card">
      <div className="chart-card__header">
        <div>
          <div className="chart-card__title">Peta Kepadatan Omzet UMKM Nasional</div>
          <div className="chart-card__sub">Visualisasi distribusi omzet seluruh Indonesia</div>
        </div>
      </div>
      <div className="map-container">
        <svg viewBox="0 0 900 400" className="map-svg">
          {/* Sumatra */}
          <ellipse cx="180" cy="200" rx="120" ry="55" fill="#93c5fd" opacity="0.7" />
          <text x="180" y="205" textAnchor="middle" fontSize="11" fill="#1e3a8a">Sumatra</text>

          {/* Jawa */}
          <ellipse cx="400" cy="270" rx="100" ry="30" fill="#1d4ed8" opacity="0.85" />
          <text x="400" y="275" textAnchor="middle" fontSize="11" fill="#fff">Jawa</text>

          {/* Kalimantan */}
          <ellipse cx="500" cy="175" rx="90" ry="70" fill="#3b82f6" opacity="0.7" />
          <text x="500" y="180" textAnchor="middle" fontSize="11" fill="#fff">Kalimantan</text>

          {/* Sulawesi */}
          <ellipse cx="640" cy="190" rx="45" ry="65" fill="#60a5fa" opacity="0.7" />
          <text x="640" y="195" textAnchor="middle" fontSize="10" fill="#fff">Sulawesi</text>

          {/* Papua */}
          <ellipse cx="800" cy="210" rx="75" ry="60" fill="#bfdbfe" opacity="0.7" />
          <text x="800" y="215" textAnchor="middle" fontSize="11" fill="#1e3a8a">Papua</text>

          {/* Bali + NTB */}
          <ellipse cx="510" cy="280" rx="30" ry="15" fill="#2563eb" opacity="0.7" />
          <text x="510" y="300" textAnchor="middle" fontSize="9" fill="#1e3a8a">Bali</text>

          {/* Maluku */}
          <ellipse cx="720" cy="240" rx="25" ry="35" fill="#93c5fd" opacity="0.6" />
          <text x="720" y="245" textAnchor="middle" fontSize="9" fill="#1e3a8a">Maluku</text>
        </svg>

        {/* Legend */}
        <div className="map-legend">
          <div className="map-legend__title">Kepadatan Omzet</div>
          <div className="map-legend__scale">
            <span>Rendah</span>
            <div className="map-legend__bar" />
            <span>Tinggi</span>
          </div>
          <div className="map-legend__items">
            <div className="map-legend__item"><span style={{ background: "#bfdbfe" }} />{"< 100M"}</div>
            <div className="map-legend__item"><span style={{ background: "#60a5fa" }} />100M - 500M</div>
            <div className="map-legend__item"><span style={{ background: "#1d4ed8" }} />{"> 500M"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
