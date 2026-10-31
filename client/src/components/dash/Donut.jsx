// Subject distribution. Segments draw in with a CSS animation (first view only).
export default function Donut({ segments, size = 132, stroke = 16, play, children }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const c = size / 2;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <div className="dx-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const len = Math.max(0, (s.value / total) * C - (segments.length > 1 ? 3 : 0));
          const el = (
            <circle
              key={s.label} cx={c} cy={c} r={r} fill="none" stroke={s.color} strokeWidth={stroke} strokeLinecap="butt"
              className={play ? "dx-seg" : undefined}
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}
              transform={`rotate(-90 ${c} ${c})`}
              style={{ "--C": C, animationDelay: `${i * 90}ms` }}
            />
          );
          offset += (s.value / total) * C;
          return el;
        })}
      </svg>
      <div className="dx-ring-label">{children}</div>
    </div>
  );
}
