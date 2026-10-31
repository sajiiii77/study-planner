import { useEffect, useState } from "react";

// Measures an element so SVG charts can be drawn at real pixel size
export default function useSize(ref, minH = 0) {
  const [size, setSize] = useState({ w: 640, h: minH });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) =>
      setSize({ w: Math.max(260, Math.round(e.contentRect.width)), h: Math.max(minH, Math.round(e.contentRect.height)) })
    );
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return size;
}
