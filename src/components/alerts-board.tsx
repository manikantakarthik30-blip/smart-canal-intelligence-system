import { useEffect, useId, useState } from "react";

type Severity = "CRITICAL" | "HIGH" | "MODERATE" | "RESOLVED";

type DispatchRow = {
  key: number;
  time: string;
  location: string;
  severity: Severity;
  sentTo: string;
  method: string;
  status: "Delivered" | "Pending";
};

const INCIDENTS = [
  {
    tone: "critical" as const,
    badge: "● CRITICAL",
    title: "Mass Garbage Accumulation — Eluru Canal",
    subtitle:
      "Governorpet Reach · 162 waste objects detected · UAV-01 holding position",
    time: "Today · 06:42 IST",
    status: "CLEANUP DEPLOYED",
    statusTone: "ok" as const,
    action: true,
  },
  {
    tone: "high" as const,
    badge: "● HIGH",
    title: "Surface Film + Plastic Debris — Ryves Canal",
    subtitle: "One Town corridor · Mixed debris and oil film · CAM-02 detection",
    time: "Today · 08:15 IST",
    status: "ALERT SENT TO VMC",
    statusTone: "warn" as const,
    action: false,
  },
  {
    tone: "high" as const,
    badge: "● HIGH",
    title: "Garbage Bags Blocking Flow — Eluru Canal",
    subtitle: "Bhavanipuram Bund · Flow obstruction detected · UAV-03 sweep",
    time: "Today · 09:30 IST",
    status: "UNDER REVIEW",
    statusTone: "caution" as const,
    action: false,
  },
  {
    tone: "moderate" as const,
    badge: "⚡ MODERATE",
    title: "Elevated Turbidity — Bandar Road Drain",
    subtitle: "Outfall into Krishna River · Post-market hours reading · CAM-03",
    time: "Today · 11:00 IST",
    status: "MONITORING",
    statusTone: "caution" as const,
    action: false,
  },
  {
    tone: "resolved" as const,
    badge: "✓ RESOLVED",
    title: "Cleanup Complete — Ryves Canal Krishna Ghat",
    subtitle: "Surface cleared · UAV-02 confirmed · GWMC team deployed successfully",
    time: "Yesterday · 16:20 IST",
    status: "CLOSED",
    statusTone: "ok" as const,
    action: false,
  },
];

const INITIAL_LOG: DispatchRow[] = [
  {
    key: 10,
    time: "06:42",
    location: "Eluru Canal Governorpet",
    severity: "CRITICAL",
    sentTo: "VMC Commissioner",
    method: "SMS + Email",
    status: "Delivered",
  },
  {
    key: 9,
    time: "06:45",
    location: "Eluru Canal Governorpet",
    severity: "CRITICAL",
    sentTo: "APPCB Vijayawada",
    method: "Email",
    status: "Delivered",
  },
  {
    key: 8,
    time: "08:15",
    location: "Ryves Canal One Town",
    severity: "HIGH",
    sentTo: "GWMC Operations",
    method: "SMS",
    status: "Delivered",
  },
  {
    key: 7,
    time: "08:17",
    location: "Ryves Canal One Town",
    severity: "HIGH",
    sentTo: "Ward Councillor 42",
    method: "WhatsApp",
    status: "Delivered",
  },
  {
    key: 6,
    time: "09:30",
    location: "Eluru Canal Bhavanipuram",
    severity: "HIGH",
    sentTo: "VMC Engineering",
    method: "SMS + Email",
    status: "Delivered",
  },
  {
    key: 5,
    time: "09:32",
    location: "Eluru Canal Bhavanipuram",
    severity: "HIGH",
    sentTo: "UAV Control Room",
    method: "App Push",
    status: "Delivered",
  },
  {
    key: 4,
    time: "11:00",
    location: "Bandar Road Drain",
    severity: "MODERATE",
    sentTo: "GWMC Monitoring",
    method: "Email",
    status: "Delivered",
  },
  {
    key: 3,
    time: "11:05",
    location: "Bandar Road Drain",
    severity: "MODERATE",
    sentTo: "Environmental Officer",
    method: "SMS",
    status: "Pending",
  },
  {
    key: 2,
    time: "14:30",
    location: "Ryves Canal One Town",
    severity: "HIGH",
    sentTo: "VMC Commissioner",
    method: "SMS + Email",
    status: "Delivered",
  },
  {
    key: 1,
    time: "16:20",
    location: "Ryves Canal Krishna Ghat",
    severity: "RESOLVED",
    sentTo: "All Departments",
    method: "Email",
    status: "Delivered",
  },
];

const LOCATIONS = [
  "Eluru Canal Governorpet",
  "Ryves Canal One Town",
  "Eluru Canal Bhavanipuram",
  "Bandar Road Drain",
  "Ryves Canal Krishna Ghat",
] as const;

const SEVERITIES: Severity[] = ["CRITICAL", "HIGH", "MODERATE", "RESOLVED"];
const TARGETS = [
  "VMC Commissioner",
  "APPCB Vijayawada",
  "GWMC Operations",
  "Ward Councillor 42",
  "VMC Engineering",
  "UAV Control Room",
  "GWMC Monitoring",
  "Environmental Officer",
  "All Departments",
] as const;
const METHODS = ["SMS + Email", "Email", "SMS", "WhatsApp", "App Push"] as const;

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)] as T;
}

function istClock(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function makeDispatch(key: number): DispatchRow {
  const severity = pick(SEVERITIES);
  return {
    key,
    time: istClock(),
    location: pick(LOCATIONS),
    severity,
    sentTo: pick(TARGETS),
    method: pick(METHODS),
    status: Math.random() > 0.18 ? "Delivered" : "Pending",
  };
}

export function AlertsBoard() {
  const headingId = useId();
  const [rows, setRows] = useState<DispatchRow[]>(INITIAL_LOG);

  useEffect(() => {
    let id = 20;
    const tick = window.setInterval(() => {
      setRows((prev) => [makeDispatch(++id), ...prev].slice(0, 12));
    }, 30000);
    return () => window.clearInterval(tick);
  }, []);

  return (
    <section className="incidents reveal" id="alerts" aria-labelledby={headingId}>
      <div className="incidents-inner">
        <header className="incidents-head">
          <p className="incidents-kicker">Incident Command · Vijayawada Canals</p>
          <h2 id={headingId} className="incidents-title">
            Alerts & Notifications
          </h2>
          <p className="incidents-sub">
            Real-time incidents from UAV fleet and fixed CCTV nodes on Eluru and Ryves Canal
          </p>
        </header>

        <div className="incident-stack">
          {INCIDENTS.map((card) => (
            <article key={card.title} className={`incident-card tone-${card.tone}`}>
              <div className="incident-copy">
                <p className={`incident-badge tone-${card.tone}`}>{card.badge}</p>
                <h3>{card.title}</h3>
                <p className="incident-sub">{card.subtitle}</p>
                <p className="incident-time">{card.time}</p>
              </div>
              <div className="incident-aside">
                <span className={`incident-status tone-${card.statusTone}`}>{card.status}</span>
                {card.action ? (
                  <a className="incident-feed" href="#ai-detection-feed">
                    View Feed →
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <div className="incident-stats" aria-label="Alert totals">
          <article className="incident-stat">
            <p className="incident-stat-value">18</p>
            <p className="incident-stat-label">Total Alerts Today</p>
          </article>
          <article className="incident-stat">
            <p className="incident-stat-value is-critical">4</p>
            <p className="incident-stat-label">Critical</p>
          </article>
          <article className="incident-stat">
            <p className="incident-stat-value is-ok">12</p>
            <p className="incident-stat-label">Resolved</p>
          </article>
          <article className="incident-stat">
            <p className="incident-stat-value is-warn">2</p>
            <p className="incident-stat-label">Pending Action</p>
          </article>
        </div>

        <article className="dispatch-panel">
          <header className="dispatch-head">
            <h3>Notification Dispatch Log</h3>
            <p>Live handoff to VMC, GWMC, APPCB and UAV control · IST</p>
          </header>
          <div className="dispatch-scroll">
            <table className="dispatch-table">
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  <th scope="col">Location</th>
                  <th scope="col">Severity</th>
                  <th scope="col">Sent To</th>
                  <th scope="col">Method</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.key} className={i === 0 ? "is-new" : undefined}>
                    <td className="num">{row.time}</td>
                    <td>{row.location}</td>
                    <td>
                      <span className={`sev sev-${row.severity.toLowerCase()}`}>{row.severity}</span>
                    </td>
                    <td>{row.sentTo}</td>
                    <td>{row.method}</td>
                    <td className={row.status === "Delivered" ? "is-ok" : "is-warn"}>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
