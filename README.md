# Smart Canal Intelligence System (SCIS)

AI-powered canal pollution monitoring for **Eluru Canal** and **Ryves Canal**, Vijayawada, Andhra Pradesh.

SCIS is a cinematic operations console: a Three.js UAV patrol over murky canal water, live metrics, YOLOv8-style CCTV detections, hotspot mapping, incident dispatch, and PDF report export.

**Location:** 16.5062°N, 80.6480°E

---

## Features

| Section | What it does |
|---|---|
| **Hero / UAV-01** | Night canal scene with animated water, debris, a surveillance drone (grid search, bank/roll, spotlight lock), HUD, and parallax |
| **Live Monitoring Dashboard** | Waste count, canal health score, drone units, alerts, 7-day pollution chart |
| **AI Detection Feed** | Three CCTV nodes with bounding boxes on real water-surface footage (FloW + canal imagery) |
| **Pollution Hotspot Map** | Satellite view of Vijayawada plus Eluru / Ryves / Bandar Road severity cards |
| **Alerts & Notifications** | Incident command board and auto-updating dispatch log |
| **Report Generator** | 3-second compile, then a real PDF via jsPDF (`SCIS_Canal_Report_[date].pdf`) |

---

## Tech stack

- **UI:** React 19, TanStack Start / Router, TypeScript, Tailwind CSS
- **3D:** Three.js (custom water shader, UAV rig, OrbitControls, fog)
- **Charts:** Chart.js (CDN)
- **PDF:** jsPDF 2.5.1 (CDN)
- **Maps:** Google Maps satellite embed
- **Build:** Vite 8, Nitro

A standalone double-click file also lives at [`public/SCIS.html`](public/SCIS.html) (pure HTML / CSS / JS, no install).

---

## Quick start

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (default port **8080**).

```bash
npm run typecheck   # TypeScript
npm run build       # production build
npm run preview     # serve the production build
```

---

## Project layout

```
src/
  routes/index.tsx          Home page (all sections)
  components/               Dashboard, feed, map, alerts, report, nav
  lib/canal-scene.ts        Three.js canal world
  lib/uav-rig.ts            Drone model + flight / detection behaviour
  lib/waste-detect.ts       Canvas blob detector for CCTV overlays
  styles.css                Cinematic dark theme
public/SCIS.html            Single-file Chrome version
```

---

## Data & credits

- **FloW Dataset** water-surface samples — [ORCAUBOAT/FloW-Dataset](https://github.com/ORCAUBOAT/FloW-Dataset)
- Canal / Krishna River stills via Wikimedia Commons
- Detection labels and incident figures are **demo data** for Vijayawada operations, not live municipal telemetry

This is a prototype for cleaner urban waterways — not an official VMC / APPCB product.

---

## License

Released under the [MIT License](LICENSE).

MIT is the right fit here: simple, widely understood, and it lets cities, students, and NGOs reuse or fork the console without legal friction. Keep the copyright notice; no other obligations.
