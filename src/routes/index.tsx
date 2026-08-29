import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { mountCanalScene, type CanalSceneHandle } from "@/lib/canal-scene";
import { LiveDashboard } from "@/components/live-dashboard";
import { DetectionFeed } from "@/components/detection-feed";
import { HotspotMap } from "@/components/hotspot-map";
import { AlertsBoard } from "@/components/alerts-board";
import { ReportGenerator } from "@/components/report-generator";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { AlertDock } from "@/components/alert-dock";
import { useReveals } from "@/components/use-reveals";
import { useParallax } from "@/components/use-parallax";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CanalSceneHandle | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  useReveals();
  useParallax(sceneRef);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    sceneRef.current = mountCanalScene(el);
    return () => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  return (
    <>
      <SiteNav />
      <main>
        <section className="hero" id="home" aria-label="Smart Canal Intelligence System">
          <div className="hero-sticky">
          <div ref={mountRef} className="hero-canvas" />
          <div className="uav-hud" aria-hidden="true">
            <div className="uav-hud-box uav-hud-tl">
              <div>UAV-01 · ACTIVE</div>
              <div data-hud="alt">ALT: 8.0m</div>
              <div data-hud="spd">SPD: 2.3 m/s</div>
              <div data-hud="bat">BAT: 87%</div>
            </div>
            <div className="uav-hud-box uav-hud-tr">
              <div>THERMAL: OFF</div>
              <div>ZOOM: 2.4x</div>
              <div data-hud="obj">OBJECTS: 47</div>
              <div className="uav-hud-rec" data-hud="rec">● REC</div>
            </div>
            <div className="uav-cross"><div className="uav-cross-ring" /></div>
            <div className="uav-compass">
              <span className="n">N</span><span className="e">E</span><span className="s">S</span><span className="w">W</span>
              <div className="uav-needle" data-hud="needle" />
            </div>
          </div>
          <div className="hero-vignette" aria-hidden="true" />
          <div className="hero-grain" aria-hidden="true" />
          <div className="letterbox letterbox-bottom" aria-hidden="true" />

          <div className="hero-overlay">
            <div className="hero-stamp">
              <div className="hero-stamp-line">Vijayawada · Andhra Pradesh</div>
              <div className="hero-stamp-meta">16.5062°N · 80.6480°E · Eluru Canal · Ryves Canal</div>
            </div>

            <div className="hero-center">
              <p className="hero-kicker">Night Operations · Canal Watch</p>
              <h1 className="hero-title">Smart Canal Intelligence System</h1>
              <hr className="hero-rule" />
              <p className="hero-subtitle">
                AI-Powered Pollution Detection | Vijayawada, Andhra Pradesh
              </p>
            </div>

            <a className="hero-scroll" href="#live-dashboard">
              <span>Descend</span>
              <div className="scroll-arrow" />
            </a>
          </div>
          </div>
        </section>

        <LiveDashboard />
        <DetectionFeed />
        <HotspotMap />
        <AlertsBoard />
        <ReportGenerator />
      </main>
      <SiteFooter />
      <AlertDock open={alertOpen} onOpen={() => setAlertOpen(true)} onClose={() => setAlertOpen(false)} />
    </>
  );
}
