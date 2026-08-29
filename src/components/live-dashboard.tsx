import { useEffect, useRef, useState } from "react";

const CHART_CDN = "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js";
const POLLUTION = [45, 62, 38, 71, 55, 83, 67];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type ChartHandle = { destroy: () => void };

type ChartStatic = new (
  ctx: CanvasRenderingContext2D,
  config: Record<string, unknown>,
) => ChartHandle;

function loadChartJs(): Promise<ChartStatic> {
  const w = window as Window & { Chart?: ChartStatic };
  if (w.Chart) return Promise.resolve(w.Chart);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-scis-chart="1"]`);
    if (existing) {
      existing.addEventListener("load", () => {
        if (w.Chart) resolve(w.Chart);
        else reject(new Error("Chart.js loaded without Chart"));
      });
      existing.addEventListener("error", () => reject(new Error("Chart.js failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = CHART_CDN;
    script.async = true;
    script.dataset.scisChart = "1";
    script.onload = () => {
      if (w.Chart) resolve(w.Chart);
      else reject(new Error("Chart.js loaded without Chart"));
    };
    script.onerror = () => reject(new Error("Chart.js failed to load"));
    document.head.appendChild(script);
  });
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function useCountUp(target: number, active: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * easeOutCubic(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

export function LiveDashboard() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inView, setInView] = useState(false);
  const waste = useCountUp(247, inView, 1700);
  const health = useCountUp(32, inView, 1400);
  const drones = useCountUp(3, inView, 900);
  const alerts = useCountUp(18, inView, 1200);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.28 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let chart: ChartHandle | null = null;
    let cancelled = false;

    loadChartJs().then((Chart) => {
      if (cancelled || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: DAYS,
          datasets: [
            {
              label: "Pollution index",
              data: POLLUTION,
              borderColor: "#00ff88",
              backgroundColor: "rgba(0, 255, 136, 0.10)",
              pointBackgroundColor: "#00cfff",
              pointBorderColor: "#00ff88",
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2,
              fill: true,
              tension: 0.38,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#111111",
              borderColor: "rgba(0, 255, 136, 0.35)",
              borderWidth: 1,
              titleColor: "#00ff88",
              bodyColor: "#f4f7f5",
              padding: 12,
              displayColors: false,
              callbacks: {
                label: (item: { parsed: { y: number } }) => ` Pollution index  ${item.parsed.y}`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: "rgba(255,255,255,0.05)", drawBorder: false },
              ticks: { color: "#9aaba3", font: { family: "Outfit", size: 12 } },
            },
            y: {
              min: 0,
              max: 100,
              grid: { color: "rgba(255,255,255,0.06)", drawBorder: false },
              ticks: { color: "#9aaba3", font: { family: "Outfit", size: 11 }, stepSize: 20 },
              title: {
                display: true,
                text: "Pollution index",
                color: "#9aaba3",
                font: { family: "Outfit", size: 11, weight: 500 },
              },
            },
          },
        },
      });
    });

    return () => {
      cancelled = true;
      chart?.destroy();
    };
  }, [inView]);

  return (
    <section
      ref={sectionRef}
      id="live-dashboard"
      className="dashboard reveal"
      aria-labelledby="dash-title"
    >
      <div className="dash-inner">
        <header className="dash-head">
          <p className="dash-kicker">Command · Vijayawada Urban Canals</p>
          <h2 id="dash-title" className="dash-title">
            <span className="live-pill" aria-label="Live">
              <span className="live-dot" />
              LIVE
            </span>
            Live Monitoring Dashboard
          </h2>
          <p className="dash-sub">
            Eluru Canal and Ryves Canal · week ending 29 Aug 2026 · telemetry from UAV-01, UAV-02,
            UAV-03
          </p>
        </header>

        <div className="dash-grid">
          <article className="metric-card">
            <p className="metric-label">Waste Objects Detected Today</p>
            <p className="metric-value metric-green">{waste}</p>
            <p className="metric-meta">Eluru 162 · Ryves 85 · last sweep 06:42 IST</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Canal Health Score</p>
            <p className="metric-value metric-critical">{health}%</p>
            <p className="metric-badge metric-badge-critical">CRITICAL</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Active Drone Units</p>
            <p className="metric-value metric-cyan">{drones}</p>
            <p className="metric-meta">UAV-01 Eluru · UAV-02 Ryves · UAV-03 Bandar lock</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Alerts Sent Today</p>
            <p className="metric-value metric-orange">{alerts}</p>
            <p className="metric-meta">VMC operations · APPCB copy · 4 still open</p>
          </article>
        </div>

        <article className="chart-panel">
          <div className="chart-head">
            <h3>Pollution Level - Last 7 Days</h3>
            <p>Composite index from debris density, turbidity, and surface-film detections</p>
          </div>
          <div className="chart-wrap">
            <canvas ref={canvasRef} aria-label="Pollution level line chart for Monday through Sunday" />
          </div>
        </article>
      </div>
    </section>
  );
}
