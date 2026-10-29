import { useEffect, useRef, useState } from "react";

// Animates a number from its previous value to target
export default function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      prev.current = target;
      return;
    }
    const from = prev.current;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const v = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      setValue(v);
      prev.current = v;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return value;
}
