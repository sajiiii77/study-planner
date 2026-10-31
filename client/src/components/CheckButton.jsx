import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1];

export default function CheckButton({ done, label, onClick, size = 22 }) {
  return (
    <button type="button" className="dx-check" style={{ width: size, height: size }} role="checkbox" aria-checked={done} aria-label={label} onClick={onClick}>
      <svg viewBox="0 0 24 24" width={Math.round(size * 0.64)} height={Math.round(size * 0.64)} aria-hidden="true">
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"
          initial={false} animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }} transition={{ duration: 0.2, ease: EASE }}
        />
      </svg>
    </button>
  );
}
