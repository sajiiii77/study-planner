import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select, textarea, [href], [tabindex]:not([tabindex="-1"])';

// Shared dialog shell: overlay, enter and exit motion, Escape, focus trap, scroll lock
export default function Modal({ title, onClose, children, width = 540 }) {
  const panel = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const list = [...panel.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      if (previous && previous.focus) previous.focus();
    };
  }, []);

  return (
    <motion.div
      className="mdl-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: 0.14, ease: EASE } }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        ref={panel}
        className="mdl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mdl-title"
        style={{ maxWidth: width }}
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: EASE } }}
        exit={{ opacity: 0, y: 6, scale: 0.985, transition: { duration: 0.14, ease: EASE } }}
      >
        <header className="mdl-head">
          <h2 id="mdl-title">{title}</h2>
          <button type="button" className="mdl-x" aria-label="Close" onClick={onClose}><X size={16} strokeWidth={1.75} /></button>
        </header>
        {children}
      </motion.div>
    </motion.div>
  );
}
