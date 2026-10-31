import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1];

export default function Ring({ value, size = 120, stroke = 10, play, color = "var(--accent)", children }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const c = size / 2;
  return (
    <div className="dx-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--border-strong)" strokeWidth={stroke} />
        <motion.circle
          cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={C} transform={`rotate(-90 ${c} ${c})`}
          initial={play ? { strokeDashoffset: C } : false}
          animate={{ strokeDashoffset: C * (1 - Math.min(1, Math.max(0, value))) }}
          transition={{ duration: 0.9, ease: EASE }}
        />
      </svg>
      <div className="dx-ring-label">{children}</div>
    </div>
  );
}
