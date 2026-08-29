import { useEffect } from "react";
import type { CanalSceneHandle } from "@/lib/canal-scene";

const HERO_LAYERS: Array<[string, number]> = [
  [".hero-canvas", 0.18],
  [".uav-hud", 0.1],
  [".hero-vignette", 0.32],
  [".hero-grain", 0.46],
  [".hero-overlay", 0.62],
];

const FLOAT_SEL =
  ".dash-head, .feed-head, .hotspots-head, .incidents-head, .report-head, .metric-card, .cctv-card, .incident-card, .hotspot-card, .report-form, .report-preview, .chart-wrap";

export function useParallax(sceneRef: { current: CanalSceneHandle | null }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sticky = document.querySelector<HTMLElement>(".hero-sticky");
    const overlay = document.querySelector<HTMLElement>(".hero-overlay");
    const layers = HERO_LAYERS.map(([sel, speed]) => ({
      el: document.querySelector<HTMLElement>(sel),
      speed,
    })).filter((l): l is { el: HTMLElement; speed: number } => !!l.el);

    let mx = 0;
    let my = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    let live = true;

    const apply = () => {
      if (!live) return;
      tx += (mx - tx) * 0.07;
      ty += (my - ty) * 0.07;
      const y = window.scrollY;
      const vh = window.innerHeight || 1;
      const heroTravel = Math.min(1, Math.max(0, y / (vh * 0.92)));

      for (const layer of layers) {
        const py = heroTravel * layer.speed * vh * 0.42;
        const px = tx * 28 * (0.35 + layer.speed);
        const ly = ty * 18 * (0.25 + layer.speed);
        layer.el.style.transform = `translate3d(${px}px, ${py + ly}px, 0)`;
      }

      if (overlay) overlay.style.opacity = String(1 - heroTravel * 1.15);

      const floats = document.querySelectorAll<HTMLElement>(FLOAT_SEL);
      for (const el of floats) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) continue;
        const mid = (r.top + r.height * 0.5 - vh * 0.5) / vh;
        const depth = el.matches(".metric-card, .cctv-card, .incident-card, .hotspot-card") ? 28 : 18;
        el.style.setProperty("--par-y", `${(-mid * depth).toFixed(1)}px`);
      }

      sceneRef.current?.setParallax(tx, ty, heroTravel);
      raf = requestAnimationFrame(apply);
    };

    const onMove = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(apply);

    return () => {
      live = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      for (const layer of layers) layer.el.style.transform = "";
      if (overlay) overlay.style.opacity = "";
      document.querySelectorAll<HTMLElement>(FLOAT_SEL).forEach((el) => {
        el.style.removeProperty("--par-y");
      });
      void sticky;
    };
  }, [sceneRef]);
}
