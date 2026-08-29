const MAP_SRC =
  "https://maps.google.com/maps?q=16.5062,80.6480&ll=16.5062,80.6480&z=13&t=k&hl=en&output=embed&maptype=satellite";

const HOTSPOTS = [
  {
    name: "Eluru Canal",
    reach: "Governorpet to Krishnalanka · 16.518°N, 80.630°E",
    level: "CRITICAL",
    tone: "critical" as const,
    last: "Last detected: 5 mins ago",
    note: "162 waste objects this sweep. UAV-01 holding over the reach.",
  },
  {
    name: "Ryves Canal",
    reach: "One Town corridor · 16.515°N, 80.620°E",
    level: "HIGH",
    tone: "high" as const,
    last: "Last detected: 12 mins ago",
    note: "Surface film and mixed debris. UAV-02 on a return pass.",
  },
  {
    name: "Bandar Road Drain",
    reach: "Bandar Road outfall into Krishna · 16.506°N, 80.648°E",
    level: "MODERATE",
    tone: "moderate" as const,
    last: "Last detected: 28 mins ago",
    note: "Turbidity elevated after market hours. Drain mouth still clear.",
  },
];

export function HotspotMap() {
  return (
    <section className="hotspots reveal" id="pollution-hotspot-map" aria-labelledby="hotspot-title">
      <div className="hotspots-inner">
        <header className="hotspots-head">
          <p className="hotspots-kicker">Geospatial · Vijayawada 16.5062°N 80.6480°E</p>
          <h2 id="hotspot-title" className="hotspots-title">
            Pollution Hotspot Map
          </h2>
          <p className="hotspots-sub">
            Live severity on Eluru Canal, Ryves Canal, and the Bandar Road drain outfall — zoom 13
            over the city core.
          </p>
        </header>

        <div className="hotspot-layout">
          <div className="map-col">
            <div className="map-shell">
              <iframe
                className="map-embed"
                title="Google Map of Vijayawada canal pollution hotspots"
                src={MAP_SRC}
                width="100%"
                height="500"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <ul className="map-legend" aria-label="Severity legend">
              <li>
                <span className="legend-swatch swatch-critical" />
                Red = Critical
              </li>
              <li>
                <span className="legend-swatch swatch-high" />
                Orange = High
              </li>
              <li>
                <span className="legend-swatch swatch-moderate" />
                Yellow = Moderate
              </li>
            </ul>
          </div>

          <aside className="hotspot-side" aria-label="Active hotspots">
            {HOTSPOTS.map((spot) => (
              <article key={spot.name} className={`hotspot-card tone-${spot.tone}`}>
                <div className="hotspot-card-top">
                  <span className={`pulse-dot pulse-${spot.tone}`} aria-hidden="true" />
                  <div>
                    <h3>{spot.name}</h3>
                    <p className="hotspot-reach">{spot.reach}</p>
                  </div>
                  <span className={`sev-badge sev-${spot.tone}`}>Pollution: {spot.level}</span>
                </div>
                <p className="hotspot-last">{spot.last}</p>
                <p className="hotspot-note">{spot.note}</p>
              </article>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}
