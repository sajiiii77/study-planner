import { useMemo, useState } from "react";
import { Clock, CalendarDays, Target, TrendingUp, TrendingDown } from "lucide-react";
import { fmtMinutes, subjectColor } from "../utils.js";
import { buildAnalytics } from "../lib/analytics.js";
import BarChart from "../components/charts/BarChart.jsx";
import Heatmap from "../components/dash/Heatmap.jsx";

const RANGES = [[7, "7 days"], [30, "30 days"], [90, "90 days"]];
let seen = false;

export default function Analytics({ tasks, exams, sessions }) {
  const [days, setDays] = useState(30);
  const [play] = useState(() => !seen);
  useState(() => { seen = true; });
  const a = useMemo(() => buildAnalytics({ sessions, tasks, exams, days }), [sessions, tasks, exams, days]);
  const up = a.deltaPct !== null && a.deltaPct >= 0;
  const maxWeekday = Math.max(1, ...a.weekday.map((d) => d.avg));
  const maxLoad = Math.max(60, ...a.workload.map((d) => d.minutes));
  const doneTotal = tasks.filter((t) => t.done).length;

  return (
    <div className="an-grid">
      <div className="an-12 cx-top">
        <div><h2>Analytics</h2><p>How your study time adds up</p></div>
        <div className="cx-seg" role="group" aria-label="Date range">
          {RANGES.map(([n, label]) => <button key={n} aria-pressed={days === n} onClick={() => setDays(n)}>{label}</button>)}
        </div>
      </div>

      <article className="dx-card dx-stat an-3">
        <div className="dx-stat-head"><span className="dx-ico"><Clock size={16} strokeWidth={1.75} /></span><span>Total study time</span></div>
        <span className="dx-val">{fmtMinutes(a.total)}</span>
        <span className={a.deltaPct === null ? "dx-delta" : up ? "dx-delta up" : "dx-delta down"}>
          {a.deltaPct === null ? `No data for the previous ${days} days` : <>{up ? <TrendingUp size={13} strokeWidth={2} /> : <TrendingDown size={13} strokeWidth={2} />}{up ? "+" : ""}{a.deltaPct}% vs previous {days} days</>}
        </span>
      </article>
      <article className="dx-card dx-stat an-3">
        <div className="dx-stat-head"><span className="dx-ico"><Target size={16} strokeWidth={1.75} /></span><span>Average on study days</span></div>
        <span className="dx-val">{fmtMinutes(a.avgActive)}</span>
        <span className="dx-sub">Across {a.activeDays} {a.activeDays === 1 ? "day" : "days"} with study</span>
      </article>
      <article className="dx-card dx-stat an-3">
        <div className="dx-stat-head"><span className="dx-ico"><CalendarDays size={16} strokeWidth={1.75} /></span><span>Consistency</span></div>
        <span className="dx-val">{a.consistency}%</span>
        <span className="dx-sub">{a.activeDays} of {days} days</span>
      </article>
      <article className="dx-card dx-stat an-3">
        <div className="dx-stat-head"><span className="dx-ico amber"><TrendingUp size={16} strokeWidth={1.75} /></span><span>Best day</span></div>
        <span className="dx-val">{fmtMinutes(a.best.minutes)}</span>
        <span className="dx-sub">{a.best.minutes ? a.best.date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" }) : "No study yet"}</span>
      </article>

      <section className="dx-card an-12">
        <header className="dx-card-head"><div><h3>Daily study time</h3><span className="dx-sub">Last {days} days, from your focus sessions</span></div></header>
        <BarChart key={days} series={a.series} play={play} />
      </section>

      <section className="dx-card an-5">
        <header className="dx-card-head"><div><h3>Your weekly rhythm</h3><span className="dx-sub">Average minutes per weekday</span></div></header>
        <ul className="an-hbars">
          {a.weekday.map((d) => (
            <li key={d.label} className={d.avg && d.avg === a.bestWeekday.avg ? "best" : ""}>
              <span>{d.label}</span>
              <div className="dx-bar"><span style={{ transform: `scaleX(${d.avg / maxWeekday})`, transformOrigin: "left", background: "var(--accent)", transition: "transform .6s cubic-bezier(.22,1,.36,1)" }} /></div>
              <b>{d.avg ? fmtMinutes(d.avg) : "0m"}</b>
            </li>
          ))}
        </ul>
      </section>

      <section className="dx-card an-7">
        <header className="dx-card-head"><h3>What stands out</h3></header>
        <ul className="an-notes">{a.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      </section>

      <section className="dx-card an-12">
        <header className="dx-card-head"><div><h3>Last 26 weeks</h3><span className="dx-sub">Each square is a day, brighter means more study</span></div></header>
        <Heatmap cells={a.heat} />
      </section>

      <section className="dx-card an-7">
        <header className="dx-card-head"><div><h3>Completion by subject</h3><span className="dx-sub">{doneTotal} of {tasks.length} tasks done</span></div></header>
        {a.bySubject.length === 0 && <p className="dx-sub">Add tasks to see progress by subject.</p>}
        <ul className="an-hbars wide">
          {a.bySubject.map((s) => (
            <li key={s.name}>
              <span title={s.name}><i className="dx-dot" style={{ "--c": subjectColor(s.name), marginRight: 8 }} />{s.name}</span>
              <div className="dx-bar"><span style={{ transform: `scaleX(${s.total ? s.done / s.total : 0})`, transformOrigin: "left", background: subjectColor(s.name), transition: "transform .6s cubic-bezier(.22,1,.36,1)" }} /></div>
              <b>{s.done}/{s.total}</b>
            </li>
          ))}
        </ul>
        <div className="an-prio">
          {a.priority.map((p) => <span key={p.key} className="an-prio-item"><span className={`dx-prio ${p.key}`}>{p.key}</span><span><b>{p.open}</b> open of {p.total}</span></span>)}
        </div>
      </section>

      <section className="dx-card an-5">
        <header className="dx-card-head"><div><h3>Workload ahead</h3><span className="dx-sub">Planned minutes, next 14 days</span></div></header>
        <div className="an-work" role="img" aria-label="Planned study minutes for each of the next 14 days">
          {a.workload.map((d, i) => (
            <div key={d.key} title={`${d.date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}: ${fmtMinutes(d.minutes)} planned${d.exams ? ", exam" : ""}`}>
              <span className="an-work-bar"><i style={{ height: `${Math.max(d.minutes ? 8 : 3, (d.minutes / maxLoad) * 100)}%`, opacity: d.minutes ? 1 : 0.35 }} />{d.exams > 0 && <em />}</span>
              <small>{i === 0 ? "Today" : d.date.getDate()}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
