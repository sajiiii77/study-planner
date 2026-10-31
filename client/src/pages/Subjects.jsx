import { useMemo, useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { addDays, iso, todayISO, daysUntil, relativeDay, fmtMinutes, subjectColor } from "../utils.js";
import Empty from "../components/Empty.jsx";

const SORTS = [["attention", "Needs attention"], ["progress", "Progress"], ["name", "Name"]];

export default function Subjects({ tasks, exams, goTo, openTask }) {
  const [sort, setSort] = useState("attention");
  const today = todayISO();

  const list = useMemo(() => {
    const names = [...new Set([...tasks.map((t) => t.subject), ...exams.map((x) => x.subject)])];
    return names.map((name) => {
      const mine = tasks.filter((t) => t.subject === name);
      const open = mine.filter((t) => !t.done);
      const done = mine.length - open.length;
      const overdue = open.filter((t) => t.due && t.due < today).length;
      const nextTask = open.filter((t) => t.due && t.due >= today).sort((a, b) => a.due.localeCompare(b.due))[0] || null;
      const exam = exams.filter((x) => x.subject === name && daysUntil(x.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0] || null;
      const examDays = exam ? daysUntil(exam.date) : null;
      const load = Array.from({ length: 7 }, (_, i) => {
        const key = iso(addDays(new Date(), i));
        return open.filter((t) => t.due === key).reduce((s, t) => s + t.minutes, 0);
      });
      const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
      const score = overdue * 100 + (examDays !== null && examDays <= 7 ? 60 - examDays * 3 : 0) + (open.length ? 10 : 0) + (100 - pct) / 10;
      return { name, color: subjectColor(name), mine, open, done, overdue, remaining: open.reduce((s, t) => s + t.minutes, 0), nextTask, exam, examDays, load, pct, score };
    });
  }, [tasks, exams]);

  const sorted = [...list].sort(
    sort === "name" ? (a, b) => a.name.localeCompare(b.name)
    : sort === "progress" ? (a, b) => a.pct - b.pct || a.name.localeCompare(b.name)
    : (a, b) => b.score - a.score || a.name.localeCompare(b.name)
  );
  const planned = tasks.filter((t) => !t.done).reduce((s, t) => s + t.minutes, 0);

  if (list.length === 0) {
    return (
      <>
        <div className="cx-top"><div><h2>Subjects</h2><p>Progress by subject</p></div></div>
        <Empty title="No subjects yet" text="Subjects appear as soon as you add a task or an exam with a subject.">
          <button className="btn-accent" onClick={() => openTask()}><Plus size={16} strokeWidth={2} /> Add a task</button>
        </Empty>
      </>
    );
  }

  return (
    <>
      <div className="cx-top">
        <div><h2>Subjects</h2><p>{list.length} {list.length === 1 ? "subject" : "subjects"}, {fmtMinutes(planned)} of study still planned</p></div>
        <div className="cx-seg" role="group" aria-label="Sort subjects">
          {SORTS.map(([key, label]) => <button key={key} aria-pressed={sort === key} onClick={() => setSort(key)}>{label}</button>)}
        </div>
      </div>

      <div className="sx-grid">
        {sorted.map((s) => {
          const maxLoad = Math.max(60, ...s.load);
          const badge = s.overdue ? { cls: "late", text: `${s.overdue} overdue` }
            : s.examDays !== null && s.examDays <= 7 ? { cls: "soon", text: "Exam this week" }
            : s.mine.length && !s.open.length ? { cls: "done", text: "All done" }
            : { cls: "", text: "On track" };
          return (
            <article className="sx-card" key={s.name} style={{ "--c": s.color }}>
              <header>
                <h3><i className="dx-dot" style={{ width: 9, height: 9 }} />{s.name}</h3>
                <span className={`sx-badge ${badge.cls}`}>{badge.text}</span>
              </header>

              <div className="sx-progress">
                <div className="sx-pct"><strong>{s.pct}%</strong><span>{s.done} of {s.mine.length} {s.mine.length === 1 ? "task" : "tasks"} done</span></div>
                <div className="dx-bar"><span style={{ background: s.color, transform: `scaleX(${s.pct / 100})`, transformOrigin: "left", transition: "transform .6s cubic-bezier(.22,1,.36,1)" }} /></div>
              </div>

              <dl className="sx-facts">
                <div><dt>Left to study</dt><dd>{s.remaining ? fmtMinutes(s.remaining) : "Nothing"}</dd></div>
                <div><dt>Next due</dt><dd>{s.nextTask ? relativeDay(s.nextTask.due) : "No date set"}</dd></div>
                <div><dt>Next exam</dt><dd className={s.examDays !== null && s.examDays <= 7 ? "hot" : ""}>{s.exam ? (s.examDays === 0 ? "Today" : `In ${s.examDays} ${s.examDays === 1 ? "day" : "days"}`) : "None"}</dd></div>
              </dl>

              <div className="sx-load" aria-label="Planned minutes over the next 7 days">
                {s.load.map((m, i) => (
                  <span key={i} title={`${fmtMinutes(m)} planned`}><i style={{ height: `${Math.max(m ? 10 : 3, (m / maxLoad) * 100)}%`, opacity: m ? 1 : 0.35 }} /></span>
                ))}
              </div>
              <small className="sx-cap">Planned, next 7 days</small>

              <footer>
                <button className="dx-btn" onClick={() => openTask(null, { subject: s.name })}><Plus size={14} strokeWidth={1.75} /> Add task</button>
                <button className="sx-link" onClick={() => goTo("tasks", { subject: s.name })}>View tasks <ArrowRight size={14} strokeWidth={1.75} /></button>
              </footer>
            </article>
          );
        })}
      </div>
    </>
  );
}
