export default function Logo() {
  return (
    <div className="logo">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <rect width="28" height="28" rx="8" fill="var(--accent)" />
        <rect x="7" y="14" width="3.5" height="7" rx="1.75" fill="var(--accent-ink)" opacity=".55" />
        <rect x="12.25" y="10" width="3.5" height="11" rx="1.75" fill="var(--accent-ink)" opacity=".8" />
        <rect x="17.5" y="6" width="3.5" height="15" rx="1.75" fill="var(--accent-ink)" />
      </svg>
      <span>Cadence</span>
    </div>
  );
}
