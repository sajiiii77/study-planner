import { useEffect } from "react";

// Closes a popover on outside click or Escape
export default function useDismiss(ref, onClose, active = true) {
  useEffect(() => {
    if (!active) return;
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const key = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [active, onClose]);
}
