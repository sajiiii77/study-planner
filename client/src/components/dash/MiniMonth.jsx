import { iso, todayISO, addDays, startOfWeek } from "../../utils.js";

const HEAD = ["M", "T", "W", "T", "F", "S", "S"];

// Month preview with a dot on days that have tasks (accent) or exams (amber)
export default function MiniMonth({ tasks, exams, onPick }) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const weeks = Math.ceil(((first.getDay() + 6) % 7 + new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()) / 7);
  const today = todayISO();
  const taskDays = new Set(tasks.filter((t) => !t.done && t.due).map((t) => t.due));
  const examDays = new Set(exams.map((x) => x.date));
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i));

  return (
    <div className="dx-month">
      <div className="dx-month-title">{now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
      <div className="dx-month-grid">
        {HEAD.map((h, i) => <span key={i} className="dx-month-head">{h}</span>)}
        {cells.map((d) => {
          const key = iso(d);
          const inMonth = d.getMonth() === now.getMonth();
          return (
            <button
              key={key}
              className={`dx-day ${key === today ? "is-today" : ""} ${inMonth ? "" : "is-out"}`}
              onClick={onPick}
              aria-label={`${d.toDateString()}${taskDays.has(key) ? ", has tasks" : ""}${examDays.has(key) ? ", has an exam" : ""}`}
            >
              {d.getDate()}
              <span className="dx-dots">
                {taskDays.has(key) && <i className="dx-dot-task" />}
                {examDays.has(key) && <i className="dx-dot-exam" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
