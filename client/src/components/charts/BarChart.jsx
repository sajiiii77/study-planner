import { useRef, useState } from "react";
import useSize from "../../lib/useSize.js";
import { fmtMinutes } from "../../utils.js";

const H = 260;
const PAD = { l: 40, r: 8, t: 14, b: 30 };
const niceMax = (m) => [60, 120, 180, 240, 360, 480, 600, 900].find((s) => s >= m) || Math.ceil(m / 60) * 60;
const tick = (v) => (v === 0 ? "0" : v >= 60 ? `${v / 60}h` : `${v}m`);

export default function BarChart({ series, play }) {
  const wrap = useRef(null);
  const { w: W } = useSize(wrap, H);
  const [active, setActive] = useState(null);
  const n = series.length;
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const max = niceMax(Math.max(60, ...series.map((d) => d.minutes)));
  const step = innerW / n;
  const barW = Math.max(2, Math.min(30, step * 0.62));
  const x = (i) => PAD.l + i * step + (step - barW) / 2;
  const y = (v) => PAD.t + innerH - (v / max) * innerH;
  const base = PAD.t + innerH;
  const avg = series.reduce((s, d) => s + d.minutes, 0) / n;
  const every = n <= 7 ? 1 : n <= 31 ? 5 : 15;
  const fmtDay = (d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActive(Math.max(0, Math.min(n - 1, Math.floor((e.clientX - rect.left - PAD.l) / step))));
  };
  const onKey = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setActive((a) => (a === null ? n - 1 : Math.min(n - 1, a + 1))); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setActive((a) => (a === null ? n - 1 : Math.max(0, a - 1))); }
    if (e.key === "Escape") setActive(null);
  };
  const a = active === null ? null : series[active];
  const tipLeft = a ? Math.max(80, Math.min(W - 80, x(active) + barW / 2)) : 0;
  const above = a ? y(a.minutes) > 90 : true;

  return (
    <div className="an-chart" ref={wrap} tabIndex={0} onKeyDown={onKey} onPointerMove={onMove} onPointerLeave={() => setActive(null)} onBlur={() => setActive(null)} aria-label="Daily study time. Use the left and right arrow keys to inspect a day.">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Bar chart of study minutes per day over the last ${n} days`}>
        {[0, max / 2, max].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeDasharray={v === 0 ? undefined : "2 5"} />
            <text x={PAD.l - 10} y={y(v) + 4} textAnchor="end" className="dx-axis">{tick(v)}</text>
          </g>
        ))}
        {series.map((d, i) => (
          <rect
            key={`${n}-${d.key}`}
            className={play ? "an-bar" : undefined}
            x={x(i)} y={d.minutes ? y(d.minutes) : base - 2} width={barW} height={d.minutes ? base - y(d.minutes) : 2}
            rx={Math.min(4, barW / 2)}
            fill={d.minutes ? "var(--accent)" : "var(--panel-3)"}
            opacity={active === null || active === i ? (d.minutes ? 1 : 0.8) : 0.45}
            style={{ animationDelay: `${Math.min(i * 8, 360)}ms` }}
          />
        ))}
        {avg > 0 && (
          <g>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(avg)} y2={y(avg)} stroke="var(--amber)" strokeWidth="1.25" strokeDasharray="5 5" />
            <text x={W - PAD.r} y={y(avg) - 6} textAnchor="end" className="dx-axis" style={{ fill: "var(--amber)" }}>average {fmtMinutes(Math.round(avg))}</text>
          </g>
        )}
        {series.map((d, i) => ((n - 1 - i) % every === 0 ? (
          <text key={`l${d.key}`} x={x(i) + barW / 2} y={H - 9} textAnchor="middle" className={i === active ? "dx-axis on" : "dx-axis"}>
            {n <= 7 ? d.date.toLocaleDateString(undefined, { weekday: "short" }) : fmtDay(d.date)}
          </text>
        ) : null))}
      </svg>
      {a && (
        <div className={above ? "dx-tip" : "dx-tip below"} style={{ left: tipLeft, top: above ? y(a.minutes) - 12 : y(a.minutes) + 14 }} role="status">
          <strong>{a.date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}</strong>
          <span><i style={{ background: "var(--accent)" }} />Studied <b>{a.minutes ? fmtMinutes(a.minutes) : "No study"}</b></span>
        </div>
      )}
    </div>
  );
}
