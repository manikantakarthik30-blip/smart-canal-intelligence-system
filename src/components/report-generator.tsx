import { useId, useRef, useState, type FormEvent } from "react";

const INCLUDES = [
  { id: "waste", label: "Waste Detection Statistics", on: true },
  { id: "alerts", label: "Alert Notification Log", on: true },
  { id: "map", label: "Map Hotspot Summary", on: true },
  { id: "drone", label: "Drone Flight Paths", on: true },
  { id: "raw", label: "Raw Sensor Data", on: false },
] as const;

const SUMMARY = [
  "Total waste objects detected: 247",
  "Critical incidents: 4",
  "Canals monitored: 3",
  "Drone flight hours: 6.2 hrs",
  "Alerts dispatched: 18",
  "Cleanup actions initiated: 3",
  "Canal health score: 32% (Critical)",
] as const;

const JSPDF_SRC = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

type JsPdfCtor = new (opts?: Record<string, unknown>) => {
  setFont: (n: string, s?: string) => void;
  setFontSize: (n: number) => void;
  setTextColor: (r: number, g?: number, b?: number) => void;
  setDrawColor: (r: number, g?: number, b?: number) => void;
  setFillColor: (r: number, g?: number, b?: number) => void;
  text: (t: string | string[], x: number, y: number, o?: Record<string, unknown>) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  rect: (x: number, y: number, w: number, h: number, style?: string) => void;
  splitTextToSize: (t: string, w: number) => string[];
  save: (name: string) => void;
  addPage: () => void;
  setLineWidth: (n: number) => void;
};

function loadJsPdf(): Promise<JsPdfCtor> {
  const w = window as Window & { jspdf?: { jsPDF: JsPdfCtor } };
  if (w.jspdf?.jsPDF) return Promise.resolve(w.jspdf.jsPDF);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-scis-jspdf="1"]');
    if (existing) {
      existing.addEventListener("load", () => {
        if (w.jspdf?.jsPDF) resolve(w.jspdf.jsPDF);
        else reject(new Error("jsPDF missing"));
      });
      return;
    }
    const script = document.createElement("script");
    script.src = JSPDF_SRC;
    script.async = true;
    script.dataset.scisJspdf = "1";
    script.onload = () => {
      if (w.jspdf?.jsPDF) resolve(w.jspdf.jsPDF);
      else reject(new Error("jsPDF missing"));
    };
    script.onerror = () => reject(new Error("jsPDF failed to load"));
    document.head.appendChild(script);
  });
}

function reportStamp(date = new Date()) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(date.getDate()).padStart(2, "0");
  return {
    pretty: date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    file: `SCIS_Canal_Report_${day}${months[date.getMonth()]}${date.getFullYear()}.pdf`,
    iso: date.toISOString().slice(0, 10),
  };
}

function writePdf(JsPDF: JsPdfCtor, opts: { date: string; canal: string; type: string }) {
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const stamp = reportStamp(opts.date ? new Date(opts.date) : new Date());
  const green: [number, number, number] = [0, 140, 80];
  const dark: [number, number, number] = [20, 24, 22];
  const muted: [number, number, number] = [90, 100, 96];
  const red: [number, number, number] = [180, 40, 40];

  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, 210, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 255, 136);
  doc.text("SMART CANAL INTELLIGENCE SYSTEM", 105, 12, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(...dark);
  doc.text("Canal Pollution Monitoring Report", 105, 30, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...muted);
  doc.text(`Date: ${stamp.pretty}`, 105, 38, { align: "center" });
  doc.text("Location: Vijayawada, Andhra Pradesh, India", 105, 44, { align: "center" });
  doc.text(`Scope: ${opts.canal}  ·  ${opts.type}`, 105, 50, { align: "center" });

  doc.setDrawColor(...green);
  doc.setLineWidth(0.4);
  doc.line(18, 56, 192, 56);

  let y = 66;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...green);
  doc.text("SUMMARY", 18, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  const summary = [
    "Total Waste Objects Detected: 247",
    "Critical Incidents: 4",
    "Canals Monitored: 3",
    "Active Drone Units: 3 (UAV-01, UAV-02, UAV-03)",
    "Drone Flight Hours: 6.2 hrs",
    "Alerts Dispatched: 18",
    "Cleanup Actions Initiated: 3",
    "Canal Health Score: 32% — CRITICAL",
  ];
  for (const line of summary) {
    doc.text(`•  ${line}`, 20, y);
    y += 7;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...green);
  doc.text("CANAL STATUS", 18, y);
  y += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  const canals = [
    ["1. Eluru Canal — CRITICAL", "Location: Governorpet to Krishnalanka", "Objects Detected: 162", "Last Sweep: 06:42 IST"],
    ["2. Ryves Canal — HIGH", "Location: One Town Corridor", "Objects Detected: 85", "Last Sweep: 08:15 IST"],
    ["3. Bandar Road Drain — MODERATE", "Location: Outfall into Krishna River", "Objects Detected: 23", "Last Sweep: 11:00 IST"],
  ];
  for (const block of canals) {
    doc.setFont("helvetica", "bold");
    if (block[0].includes("CRITICAL")) doc.setTextColor(...red);
    else if (block[0].includes("HIGH")) doc.setTextColor(200, 110, 20);
    else doc.setTextColor(160, 140, 20);
    doc.text(block[0], 20, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...dark);
    for (const line of block.slice(1)) {
      doc.text(line, 24, y);
      y += 6;
    }
    y += 3;
  }

  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...green);
  doc.text("ALERTS LOG (last 5)", 18, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  const alerts = [
    "06:42 | Eluru Canal | CRITICAL | VMC Notified",
    "08:15 | Ryves Canal | HIGH | APPCB Notified",
    "09:30 | Eluru Bhavanipuram | HIGH | Under Review",
    "11:00 | Bandar Road | MODERATE | Monitoring",
    "16:20 | Ryves Krishna Ghat | RESOLVED | Closed",
  ];
  for (const row of alerts) {
    doc.text(row, 20, y);
    y += 6.5;
  }

  y = 276;
  doc.setDrawColor(...green);
  doc.line(18, y, 192, y);
  doc.setFontSize(9);
  doc.setTextColor(...green);
  doc.text("Generated by SCIS AI Engine v2.1", 105, y + 6, { align: "center" });
  doc.setTextColor(...muted);
  doc.text("Powered by YOLOv8 + OpenCV", 105, y + 11, { align: "center" });
  doc.text("Smart Canal Intelligence System — Vijayawada", 105, y + 16, { align: "center" });

  doc.save(stamp.file);
  return stamp.file;
}

export function ReportGenerator() {
  const headingId = useId();
  const [phase, setPhase] = useState<"idle" | "busy" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("SCIS_Canal_Report.pdf");
  const formRef = useRef<HTMLFormElement>(null);
  const today = reportStamp().iso;

  const generate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase === "busy") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setPhase("busy");
    setProgress(0);
    const started = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / 3000);
      setProgress(t);
      if (t < 1) {
        requestAnimationFrame(tick);
        return;
      }
      void loadJsPdf()
        .then((JsPDF) => {
          const name = writePdf(JsPDF, {
            date: String(data.get("date") || today),
            canal: String(data.get("canal") || "All Canals"),
            type: String(data.get("type") || "Full Report"),
          });
          setFileName(name);
          setPhase("done");
        })
        .catch(() => setPhase("idle"));
    };
    requestAnimationFrame(tick);
  };

  return (
    <section className="report reveal" id="generate-report" aria-labelledby={headingId}>
      <div className="report-inner">
        <header className="report-head">
          <p className="report-kicker">Export · SCIS AI Engine v2.1</p>
          <h2 id={headingId} className="report-title">
            Canal Intelligence Report Generator
          </h2>
          <p className="report-sub">
            Generate and download a full PDF summary of today's canal monitoring data
          </p>
        </header>

        <div className="report-layout">
          <form ref={formRef} className="report-form" onSubmit={generate}>
            <label className="report-field">
              <span>Date Range</span>
              <input suppressHydrationWarning type="date" name="date" defaultValue={today} />
            </label>

            <label className="report-field">
              <span>Canal</span>
              <select name="canal" defaultValue="All Canals">
                <option>All Canals</option>
                <option>Eluru Canal</option>
                <option>Ryves Canal</option>
                <option>Bandar Road Drain</option>
              </select>
            </label>

            <label className="report-field">
              <span>Report Type</span>
              <select name="type" defaultValue="Full Report">
                <option>Full Report</option>
                <option>Pollution Summary</option>
                <option>Alert Log</option>
                <option>Drone Activity Report</option>
              </select>
            </label>

            <fieldset className="report-checks">
              <legend>Include</legend>
              {INCLUDES.map((item) => (
                <label key={item.id} className="report-check">
                  <input
                    suppressHydrationWarning
                    type="checkbox"
                    name={item.id}
                    defaultChecked={item.on}
                  />
                  {item.label}
                </label>
              ))}
            </fieldset>

            <button className="report-go" type="submit" disabled={phase === "busy"}>
              Generate Report
            </button>

            {phase === "busy" ? (
              <div className="report-progress" role="status" aria-live="polite">
                <span>Compiling UAV logs and CCTV detections…</span>
                <div className="report-bar">
                  <div className="report-bar-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
              </div>
            ) : null}

            {phase === "done" ? (
              <div className="report-success" role="status">
                <p>✅ Report downloaded successfully!</p>
                <p className="report-file">{fileName}</p>
              </div>
            ) : null}
          </form>

          <article className="report-preview" aria-label="Report preview">
            <header className="preview-banner">
              <p>SMART CANAL INTELLIGENCE SYSTEM</p>
              <h3>Weekly Pollution Report — Vijayawada</h3>
              <time dateTime={today}>{reportStamp().pretty}</time>
            </header>
            <ul className="preview-lines">
              {SUMMARY.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="preview-stamp">GENERATED BY SCIS AI ENGINE v2.1</p>
          </article>
        </div>
      </div>
    </section>
  );
}
