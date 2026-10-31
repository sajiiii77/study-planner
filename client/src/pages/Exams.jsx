import { Plus, Trash2 } from "lucide-react";
import { dayLabel, daysUntil, subjectColor } from "../utils.js";
import Empty from "../components/Empty.jsx";

export default function Exams({ exams, tasks, openExam, onDeleteExam }) {
  const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.filter((x) => daysUntil(x.date) >= 0);
  const past = sorted.filter((x) => daysUntil(x.date) < 0).reverse();

  const ticket = (x) => {
    const n = daysUntil(x.date);
    const forSubject = tasks.filter((t) => t.subject === x.subject);
    const done = forSubject.filter((t) => t.done).length;
    const cls = n < 0 ? "cx-ticket is-past" : n <= 3 ? "cx-ticket urgent" : n <= 7 ? "cx-ticket soon" : "cx-ticket";
    return (
      <div key={x.id} className={cls} style={{ "--c": subjectColor(x.subject) }}>
        <div className="cx-ticket-count">
          <strong>{n < 0 ? "Done" : n === 0 ? "Today" : n}</strong>
          {n > 0 && <span>{n === 1 ? "day left" : "days left"}</span>}
        </div>
        <div className="cx-ticket-body">
          <h3>{x.title}</h3>
          <span className="cx-meta"><span className="dx-chip"><i className="dx-dot" />{x.subject}</span><span className="dx-meta">{dayLabel(x.date)}</span></span>
          {n >= 0 && (
            <div className="cx-prep">
              <div className="dx-bar"><span style={{ background: "var(--c)", transform: `scaleX(${forSubject.length ? done / forSubject.length : 0})`, transformOrigin: "left", transition: "transform .6s cubic-bezier(.22,1,.36,1)" }} /></div>
              <small>{forSubject.length ? `${done} of ${forSubject.length} ${x.subject} tasks done` : `No ${x.subject} study tasks yet`}</small>
            </div>
          )}
        </div>
        <button className="dx-icon danger cx-corner" onClick={() => onDeleteExam(x)} aria-label={`Delete ${x.title}`}><Trash2 size={14} strokeWidth={1.75} /></button>
      </div>
    );
  };

  return (
    <>
      <div className="cx-top">
        <div><h2>Exams</h2><p>{upcoming.length} upcoming</p></div>
        <button className="btn-accent" onClick={openExam}><Plus size={16} strokeWidth={2} /> Add exam</button>
      </div>
      {exams.length === 0 && <Empty title="No exams yet" text="Add an exam date and the countdown starts here and on your dashboard."><button className="btn-accent" onClick={openExam}><Plus size={16} strokeWidth={2} /> Add an exam</button></Empty>}
      <div className="cx-exams">{upcoming.map(ticket)}</div>
      {past.length > 0 && (<><h3 className="cx-sec">Past exams</h3><div className="cx-exams">{past.map(ticket)}</div></>)}
    </>
  );
}
