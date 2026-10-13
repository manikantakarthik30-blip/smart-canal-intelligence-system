import { useEffect, useState, type MouseEvent } from "react";
import { Menu, Waves, X } from "lucide-react";

const LINKS = [
  { href: "#home", label: "Home" },
  { href: "#live-dashboard", label: "Dashboard" },
  { href: "#ai-detection-feed", label: "Detection" },
  { href: "#pollution-hotspot-map", label: "Map" },
  { href: "#alerts", label: "Alerts" },
  { href: "#generate-report", label: "Report" },
] as const;

export function SiteNav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#home");

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = LINKS.map((l) => l.href.slice(1));
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => Boolean(n));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: [0.1, 0.35, 0.6] },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  const go = (href: string) => (_event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.querySelector(href);
    target?.classList.add("is-in");
    setOpen(false);
    setActive(href);
  };

  return (
    <header className={`site-nav${solid ? " is-solid" : ""}${open ? " is-open" : ""}`}>
      <a className="brand" href="#home" onClick={go("#home")}>
        <Waves size={20} strokeWidth={2.2} aria-hidden="true" />
        <span>SCIS</span>
      </a>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="site-nav-links"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav id="site-nav-links" className="nav-links" aria-label="Primary">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={active === link.href ? "is-active" : undefined}
            onClick={go(link.href)}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
