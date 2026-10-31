import { useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
import { iso, todayISO, startOfWeek, addDays, subjectColor, fmtMinutes, RANK } from "../utils.js";
import CheckButton from "../components/CheckButton.jsx";

export default function WeekView({ anchor, tasks, exams, updateTask, openTask }) {
  const [over, setOver] = useState("");
  const today = todayISO();
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const unscheduled = tasks.filter((t) => !t.due && !t.done);

  const drop = (e, dateISO) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setOver("");
    if (id) updateTask(id, { due: dateISO });
  };

  // block height grows with study time, like a timetable
  const block = (t) => (
    <div
      key={t.id}
      className={t.done ? "cx-block is-done" : "cx-block"}
      style={{ "--c": subjectColor(t.subject), minHeight: Math.min(150, Math.max(58, Math.round(t.minutes * 0.9))) }}
      draggable
      tabIndex={0}
      role="button"
      aria-label={`${t.title}, ${t.subject}, ${t.minutes} minutes. Press Enter to edit.`}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
      onClick={() => openTask(t)}
      onKeyDown={(e) => e.key === "Enter" && openTask(t)}
    >
      <div className="cx-block-title">
        <CheckButton size={18} done={t.done} label={`Mark ${t.title} ${t.done ? "not done" : "done"}`} onClick={(e) => { e.stopPropagation(); updateTask(t.id, { done: !t.done }); }} />
        <span>{t.title}</span>
      </div>
      <small>{t.subject}, {t.minutes} min</small>
    </div>
  );

  return (
    <>
      <div className="cx-week">
        {days.map((d) => {
          const key = iso(d);
          const list = tasks.filter((t) => t.due === key).sort((a, b) => a.done - b.done || RANK[a.priority] - RANK[b.priority]);
          const planned = list.filter((t) => !t.done).reduce((s, t) => s + t.minutes, 0);
          return (
            <div
              key={key}
              className={`cx-day ${key === today ? "is-today" : ""} ${over === key ? "is-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setOver(key); }}
              onDragLeave={() => setOver("")}
              onDrop={(e) => drop(e, key)}
            >
              <div className="cx-day-head">
                <span><span className="cx-dow">{d.toLocaleDateString(undefined, { weekday: "short" })}</span><span className="cx-dom">{d.getDate()}</span></span>
                <button className="cx-add" onClick={() => openTask(null, { due: key })} aria-label={`Add a task on ${d.toDateString()}`}><Plus size={14} strokeWidth={2} /></button>
              </div>
              {planned > 0 && <span className="cx-load">{planned < 60 ? `${planned}m` : fmtMinutes(planned)} planned</span>}
              {exams.filter((x) => x.date === key).map((x) => (
                <div className="cx-exam-chip" key={x.id}><GraduationCap size={14} strokeWidth={1.75} /> {x.title}</div>
              ))}
              {list.map(block)}
            </div>
          );
        })}
      </div>

      <section className="cx-tray">
        <header><h3>Not scheduled yet</h3><span className="dx-sub">Drag a task onto a day, or drop one here to clear its date</span></header>
        <div className="cx-tray-body" onDragOver={(e) => e.preventDefault()} onDrop={(e) => drop(e, "")}>
          {unscheduled.length === 0 && <span className="dx-sub">Everything has a day.</span>}
          {unscheduled.map(block)}
        </div>
      </section>
    </>
  );
}
