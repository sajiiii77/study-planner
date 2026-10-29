import { useState } from "react";
import { ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";
import { iso, todayISO, startOfWeek, addDays, RANK } from "../utils.js";

export default function CalendarPage({ tasks, exams, updateTask }) {
  const [start, setStart] = useState(() => startOfWeek(new Date()));
  const [over, setOver] = useState("");
  const today = todayISO();
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const fmt = (d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const unscheduled = tasks.filter((t) => !t.due && !t.done);

  const drop = (e, dateISO) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setOver("");
    if (id) updateTask(id, { due: dateISO });
  };

  const card = (t) => (
    <div
      key={t.id}
      className={`cal-task ${t.priority} ${t.done ? "done" : ""}`}
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
    >
      <label>
        <input type="checkbox" checked={t.done} onChange={() => updateTask(t.id, { done: !t.done })} />
        <span>{t.title}</span>
      </label>
      <small>{t.subject} · {t.minutes} min</small>
    </div>
  );

  return (
    <>
      <div className="week-nav">
        <button className="icon-btn" onClick={() => setStart(addDays(start, -7))} aria-label="Previous week"><ChevronLeft size={18} /></button>
        <button className="icon-btn" onClick={() => setStart(addDays(start, 7))} aria-label="Next week"><ChevronRight size={18} /></button>
        <strong>{fmt(days[0])} – {fmt(days[6])}</strong>
        <button className="chip" onClick={() => setStart(startOfWeek(new Date()))}>Today</button>
      </div>

      <div className="week">
        {days.map((d) => {
          const key = iso(d);
          const dayTasks = tasks.filter((t) => t.due === key).sort((a, b) => a.done - b.done || RANK[a.priority] - RANK[b.priority]);
          return (
            <div
              key={key}
              className={`day ${key === today ? "today" : ""} ${over === key ? "over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setOver(key); }}
              onDragLeave={() => setOver("")}
              onDrop={(e) => drop(e, key)}
            >
              <div className="day-head">
                <span>{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
                <strong>{d.getDate()}</strong>
              </div>
              {exams.filter((x) => x.date === key).map((x) => (
                <div className="cal-exam" key={x.id}><GraduationCap size={14} /> {x.title}</div>
              ))}
              {dayTasks.map(card)}
            </div>
          );
        })}
      </div>

      <section className="card tray-card">
        <h2>Unscheduled</h2>
        <p className="meta">Drag a task onto a day to schedule it. You can also drag tasks between days.</p>
        <div className="tray" onDragOver={(e) => e.preventDefault()} onDrop={(e) => drop(e, "")}>
          {unscheduled.length === 0 && <span className="empty">Everything has a date.</span>}
          {unscheduled.map(card)}
        </div>
      </section>
    </>
  );
}
