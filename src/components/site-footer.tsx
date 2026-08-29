import { Github, Linkedin } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer reveal">
      <p className="footer-title">Smart Canal Intelligence System | Vijayawada, Andhra Pradesh</p>
      <p className="footer-meta">
        Powered by YOLOv8 + OpenCV + Google Maps | Built for cleaner urban waterways
      </p>
      <div className="footer-social">
        <a href="#" aria-label="GitHub (placeholder)">
          <Github size={18} />
        </a>
        <a href="#" aria-label="LinkedIn (placeholder)">
          <Linkedin size={18} />
        </a>
      </div>
    </footer>
  );
}
