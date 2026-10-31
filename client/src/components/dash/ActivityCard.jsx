import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { smoothPath } from "../../lib/path.js";
import { fmtMinutes } from "../../utils.js";

const EASE = [0.22, 1, 0.36, 1];
const MIN_H = 232;
const PAD = { l: 38, r: 14, t: 16, b: 30 };
const niceMax = (m) => [60, 120, 180, 240, 360, 480, 600, 900].find((s) => s >= m) || Math.ceil(m / 60) * 60;
const tick = (v) => (v === 0 ? "0" : v >= 60 ? `${v / 60}h` : `${v}m`);

function useSize(ref) {
  const [size, setSize] = useState({ w: 640, h: MIN_H });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) =>
      setSize({ w: Math.max(260, Math.round(e.contentRect.width)), h: Math.max(MIN_H, Math.round(e.contentRect.height)) })
    );
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return size;
}

export default function ActivityCard({ thisWeek, lastWeek, todayIdx, weekMinutes, deltaPct, play }) {
  const wrap = useRef(null);
  const { w: W, h: H } = useSize(wrap);
  const [compare, setCompare] = useState(true);
  const [active, setActive] = useState(todayIdx);
  const [hover, setHover] = useState(false);

  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const max = niceMax(Math.max(60, ...thisWeek.map((d) => d.minutes), ...(compare ? lastWeek.map((d) => d.minutes) : [0])));
  const x = (i) => PAD.l + (i / 6) * innerW;
  const y = (v) => PAD.t + innerH - (v / max) * innerH;
  const base = PAD.t + innerH;

  const cur = thisWeek.slice(0, todayIdx + 1).map((d, i) => ({ x: x(i), y: y(d.minutes) }));
  const prev = lastWeek.map((d, i) => ({ x: x(i), y: y(d.minutes) }));
  const line = smoothPath(cur);
  const area = `${line} L${cur[cur.length - 1].x},${base} L${cur[0].x},${base} Z`;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left - PAD.l) / innerW) * 6);
    setActive(Math.max(0, Math.min(6, i)));
  };
  const onKey = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setActive((a) => Math.min(6, a + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
  };

  const a = thisWeek[active];
  const b = lastWeek[active];
  const up = deltaPct !== null && deltaPct >= 0;
  const tipLeft = Math.max(90, Math.min(W - 90, x(active)));
  const anchorY = a.future ? y(b.minutes) : Math.min(y(a.minutes), compare ? y(b.minutes) : 999);
  const below = anchorY < 120;
  const tipTop = below ? anchorY + 16 : anchorY - 14;

  return (
    <section className="dx-card dx-activity">
      <header className="dx-card-head">
        <div>
          <h3>Weekly study activity</h3>
          <div className="dx-big">
            <span className="dx-val">{fmtMinutes(weekMinutes)}</span>
            <span className="dx-sub">this week</span>
            {deltaPct !== null ? (
              <span className={up ? "dx-delta up" : "dx-delta down"}>
                {up ? <TrendingUp size={13} strokeWidth={2} /> : <TrendingDown size={13} strokeWidth={2} />}
                {up ? "+" : ""}{deltaPct}% vs last week
              </span>
            ) : (
              <span className="dx-delta">No study logged last week</span>
            )}
          </div>
        </div>
        <div className="dx-seg-ctl" role="group" aria-label="Chart view">
          <button aria-pressed={compare} onClick={() => setCompare(true)}>Compare</button>
          <button aria-pressed={!compare} onClick={() => setCompare(false)}>This week</button>
        </div>
      </header>

      <div className="dx-chart" ref={wrap} tabIndex={0} onKeyDown={onKey} onPointerEnter={() => setHover(true)} onPointerMove={onMove} onPointerLeave={() => { setHover(false); setActive(todayIdx); }} onFocus={() => setHover(true)} onBlur={() => setHover(false)} aria-label="Study minutes per day. Use the left and right arrow keys to inspect a day.">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Area chart of daily study time this week compared with last week">
          <defs>
            <linearGradient id="dx-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--accent)", stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          {[0, max / 2, max].map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeDasharray={v === 0 ? undefined : "2 5"} />
              <text x={PAD.l - 10} y={y(v) + 4} textAnchor="end" className="dx-axis">{tick(v)}</text>
            </g>
          ))}
          {thisWeek.map((d, i) => (
            <text key={d.key} x={x(i)} y={H - 8} textAnchor="middle" className={i === active ? "dx-axis on" : "dx-axis"}>
              {d.date.toLocaleDateString(undefined, { weekday: "short" })}
            </text>
          ))}
          <line x1={x(active)} x2={x(active)} y1={PAD.t} y2={base} stroke="var(--border-strong)" strokeDasharray="3 4" />
          {compare && <path d={smoothPath(prev)} fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeDasharray="4 5" />}
          <motion.path d={area} fill="url(#dx-area)" initial={play ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.35, ease: EASE }} />
          <motion.path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" initial={play ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: EASE }} />
          {compare && <circle cx={x(active)} cy={y(b.minutes)} r="3.5" fill="var(--panel)" stroke="var(--text-3)" strokeWidth="1.5" />}
          {!a.future && <circle cx={x(active)} cy={y(a.minutes)} r="5" fill="var(--accent)" stroke="var(--panel)" strokeWidth="2.5" />}
        </svg>
        {hover && (
        <div className={below ? "dx-tip below" : "dx-tip"} style={{ left: tipLeft, top: tipTop }} role="status">
          <strong>{a.date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}</strong>
          <span><i style={{ background: "var(--accent)" }} />This week <b>{a.future ? "Not yet" : a.minutes ? fmtMinutes(a.minutes) : "No study"}</b></span>
          {compare && <span><i style={{ background: "var(--text-3)" }} />Last week <b>{b.minutes ? fmtMinutes(b.minutes) : "No study"}</b></span>}
        </div>
        )}
      </div>
    </section>
  );
}
