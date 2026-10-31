import { motion } from "motion/react";
import { smoothPath } from "../../lib/path.js";

const EASE = [0.22, 1, 0.36, 1];

export default function Sparkline({ values, play, width = 132, height = 38 }) {
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => ({ x: 2 + (i / (values.length - 1)) * (width - 4), y: height - 4 - (v / max) * (height - 8) }));
  const line = smoothPath(pts);
  return (
    <svg className="dx-spark" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={`${line} L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`} fill="var(--accent)" opacity=".12" />
      <motion.path
        d={line} fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" vectorEffect="non-scaling-stroke"
        initial={play ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: EASE }}
      />
    </svg>
  );
}
