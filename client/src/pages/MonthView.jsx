import { useState } from "react";
import { iso, todayISO, startOfWeek, addDays, subjectColor } from "../utils.js";

const HEAD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MonthView({ anchor, tasks, exams, updateTask, openTask }) {
  const [over, setOver] = useState("");
  const today = todayISO();
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const dim = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((((first.getDay() + 6) % 7) + dim) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(startOfWeek(first), i));

  const drop = (e, key) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setOver("");
    if (id) updateTask(id, { due: key });
  };

  return (
    <div className="cx-month" role="grid" aria-label="Month calendar">
      {HEAD.map((h) => <div key={h} className="cx-month-h" role="columnheader">{h}</div>)}
      {cells.map((d) => {
        const key = iso(d);
        const dayExams = exams.filter((x) => x.date === key);
        const list = tasks.filter((t) => t.due === key);
        const shown = [...dayExams.map((x) => ({ kind: "exam", x })), ...list.map((t) => ({ kind: "task", t }))];
        return (
          <div
            key={key}
            role="gridcell"
            tabIndex={0}
            className={`cx-cell ${key === today ? "is-today" : ""} ${d.getMonth() !== anchor.getMonth() ? "is-out" : ""} ${over === key ? "is-over" : ""}`}
            onClick={() => openTask(null, { due: key })}
            onKeyDown={(e) => e.key === "Enter" && openTask(null, { due: key })}
            onDragOver={(e) => { e.preventDefault(); setOver(key); }}
            onDragLeave={() => setOver("")}
            onDrop={(e) => drop(e, key)}
            aria-label={`${d.toDateString()}, ${list.length} tasks, ${dayExams.length} exams. Press Enter to add a task.`}
          >
            <span className="cx-cell-num">{d.getDate()}</span>
            {shown.slice(0, 3).map((s) =>
              s.kind === "exam" ? (
                <span key={`e${s.x.id}`} className="cx-chip-exam">{s.x.title}</span>
              ) : (
                <span
                  key={s.t.id}
                  className={s.t.done ? "cx-chip-task is-done" : "cx-chip-task"}
                  style={{ "--c": subjectColor(s.t.subject) }}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", s.t.id)}
                  onClick={(e) => { e.stopPropagation(); openTask(s.t); }}
                  title={`${s.t.title}, ${s.t.subject}`}
                >
                  <i className="dx-dot" />{s.t.title}
                </span>
              )
            )}
            {shown.length > 3 && <span className="cx-more">+{shown.length - 3} more</span>}
          </div>
        );
      })}
    </div>
  );
}
