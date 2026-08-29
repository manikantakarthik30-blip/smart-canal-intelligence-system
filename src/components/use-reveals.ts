import { useEffect } from "react";

function inViewport(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight - 24 && r.bottom > 64;
}

export function useReveals() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const show = (el: Element) => el.classList.add("is-in");

    if (reduced) {
      nodes.forEach(show);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            show(entry.target);
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.01, rootMargin: "80px 0px 0px 0px" },
    );

    nodes.forEach((el) => {
      if (inViewport(el)) show(el);
      else io.observe(el);
    });

    const onScroll = () => {
      for (const el of nodes) {
        if (!el.classList.contains("is-in") && inViewport(el)) {
          show(el);
          io.unobserve(el);
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onScroll);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onScroll);
    };
  }, []);
}
