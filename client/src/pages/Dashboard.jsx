import { useMemo } from "react";
import { todayISO, iso, addDays, daysUntil, dayLabel, fmtMinutes, studyStats, RANK } from "../utils.js";
import useCountUp from "../useCountUp.js";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export default function Dashboard({ user, tasks, exams, sessions, updateTask, goTo }) {
  const today = todayISO();
  const open = tasks.filter((t) => !t.done);
  const doneCount = tasks.length - open.length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const dueToday = open.filter((t) => t.due === today);
  const overdue = open.filter((t) => t.due && t.due < today);
  const focus = [...overdue, ...dueToday].sort((a, b) => RANK[a.priority] - RANK[b.priority]);
  const upcoming = exams.filter((x) => daysUntil(x.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
  const next = upcoming[0];
  const nextDays = next ? daysUntil(next.date) : null;

  const { today: focusToday, streak, byDate } = studyStats(sessions);
  const minutesLeft = open.reduce((sum, t) => sum + t.minutes, 0);
  const pctShown = useCountUp(pct);
  const leftShown = useCountUp(minutesLeft);
  const todayShown = useCountUp(dueToday.length);
  const focusShown = useCountUp(focusToday);

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i - 6);
    return { key: iso(d), label: d.toLocaleDateString(undefined, { weekday: "short" }), minutes: byDate[iso(d)] || 0 };
  });
  const maxMinutes = Math.max(60, ...week.map((w) => w.minutes));

  const bySubject = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      const s = (map[t.subject] ||= { done: 0, total: 0 });
      s.total++;
      if (t.done) s.done++;
    });
    return Object.entries(map);
  }, [tasks]);

  return (
    <>
      <div>
        <p className="hello">{greeting()}, {user.name.split(" ")[0]}.</p>
        <p className="meta">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <section className="stats">
        <div className="card stat"><small>Completed</small><strong>{pctShown}%</strong><small>{doneCount} of {tasks.length} tasks</small></div>
        <div className="card stat"><small>Study time left</small><strong>{fmtMinutes(leftShown)}</strong><small>{open.length} open tasks</small></div>
        <div className="card stat"><small>Due today</small><strong>{todayShown}</strong><small>{overdue.length} overdue</small></div>
        <div className="card stat">
          <small>Next exam</small>
          <strong>{next ? (nextDays === 0 ? "Today" : `${nextDays}d`) : "–"}</strong>
          <small>{next ? next.title : "No exams yet"}</small>
        </div>
        <div className="card stat"><small>Focus today</small><strong>{focusShown}m</strong><small>{streak}-day streak</small></div>
      </section>

      <section className="card">
        <h2>Study activity · last 7 days</h2>
        <div className="chart" role="img" aria-label="Minutes studied per day over the last 7 days">
          {week.map((w) => (
            <div className="chart-col" key={w.key}>
              <span className="chart-val">{w.minutes || ""}</span>
              <div className="chart-track"><div className="chart-bar" style={{ height: `${(w.minutes / maxMinutes) * 100}%` }} /></div>
              <span className="chart-day">{w.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>Today's focus</h2>
          {focus.length === 0 && (
            <p className="empty">Nothing due today. <button className="link" onClick={() => goTo("calendar")}>Plan your week</button></p>
          )}
          {focus.map((t) => (
            <div className="row" key={t.id}>
              <input type="checkbox" checked={t.done} onChange={() => updateTask(t.id, { done: !t.done })} aria-label={`Mark ${t.title} done`} />
              <span className="title">{t.title}</span>
              <span className={`badge ${t.priority}`}>{t.priority}</span>
              <span className="meta">{t.due < today ? "Overdue" : `${t.minutes} min`}</span>
            </div>
          ))}
        </section>

        <div className="col">
          <section className="card">
            <h2>Upcoming exams</h2>
            {upcoming.length === 0 && <p className="empty">No exams yet.</p>}
            {upcoming.slice(0, 3).map((x) => (
              <div className="line" key={x.id}>
                <span><strong>{x.title}</strong><br /><small className="meta">{x.subject} · {dayLabel(x.date)}</small></span>
                <span className="badge">{daysUntil(x.date) === 0 ? "Today" : `${daysUntil(x.date)} days`}</span>
              </div>
            ))}
          </section>

          <section className="card">
            <h2>Progress by subject</h2>
            {bySubject.length === 0 && <p className="empty">Add tasks to see progress.</p>}
            {bySubject.map(([name, s]) => (
              <div className="subj" key={name}>
                <div><span>{name}</span><span className="meta">{s.done}/{s.total}</span></div>
                <div className="bar"><span style={{ width: `${(s.done / s.total) * 100}%` }} /></div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
