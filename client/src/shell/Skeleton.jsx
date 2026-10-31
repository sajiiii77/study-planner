export default function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading your plan">
      <div className="sk sk-hero" />
      <div className="sk-row">{[0, 1, 2, 3].map((i) => <div key={i} className="sk sk-stat" />)}</div>
      <div className="sk-row two"><div className="sk sk-block" /><div className="sk sk-block" /></div>
    </div>
  );
}
