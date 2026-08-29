import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

export function AlertDock({
  open,
  onOpen,
  onClose,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className="alert-dock">
      {open ? (
        <div className="alert-pop" role="alertdialog" aria-labelledby="alert-pop-title" aria-modal="true">
          <div className="alert-pop-head">
            <AlertTriangle size={16} aria-hidden="true" />
            <h3 id="alert-pop-title">Active alert</h3>
            <button ref={closeRef} type="button" className="alert-pop-close" onClick={onClose} aria-label="Dismiss alert">
              <X size={16} />
            </button>
          </div>
          <p>High pollution detected at Eluru Canal — 5 mins ago</p>
          <p className="alert-pop-meta">CAM-01 · Governorpet Reach · CRITICAL · UAV-01 on station</p>
        </div>
      ) : null}
      <button type="button" className="alert-fab" onClick={() => (open ? onClose() : onOpen())}>
        <span className="alert-fab-pulse" aria-hidden="true" />
        <AlertTriangle size={16} aria-hidden="true" />
        Active Alert
      </button>
    </div>
  );
}
