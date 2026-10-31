import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { todayISO, relativeDay, dayLabel, subjectColor, RANK } from "../utils.js";
import TaskItem from "../components/TaskItem.jsx";
import Empty from "../components/Empty.jsx";

const GROUPS = [["due", "Due date"], ["subject", "Subject"], ["priority", "Priority"]];
const PRIO_LABEL = { high: "High priority", medium: "Medium priority", low: "Low priority" };

export default function Tasks({ tasks, updateTask, openTask, onDeleteTask, initialSubject }) {
  const [status, setStatus] = useState("open");
  const [subject, setSubject] = useState(initialSubject || "All");
  const [query, setQuery] = useState("");
  const [by, setBy] = useState("due");
  const today = todayISO();

  const subjects = [...new Set(tasks.map((t) => t.subject))].sort();
  const counts = { open: tasks.filter((t) => !t.done).length, done: tasks.filter((t) => t.done).length, all: tasks.length };
  const q = query.trim().toLowerCase();
  const visible = tasks.filter(
    (t) =>
      (subject === "All" || t.subject === subject) &&
      (status === "all" || (status === "done") === t.done) &&
      (!q || t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q))
  );

  const groups = useMemo(() => {
    const map = {};
    visible.forEach((t) => {
      const key = by === "due" ? t.due : by === "subject" ? t.subject : t.priority;
      (map[key] ||= []).push(t);
    });
    const keys = Object.keys(map).sort((a, b) =>
      by === "due" ? (a || "9999").localeCompare(b || "9999") : by === "priority" ? RANK[a] - RANK[b] : a.localeCompare(b)
    );
    return keys.map((key) => {
      const items = map[key].sort((a, b) => a.done - b.done || RANK[a.priority] - RANK[b.priority] || (a.due || "9999").localeCompare(b.due || "9999"));
      const done = items.filter((t) => t.done).length;
      const late = by === "due" && key && key < today && items.some((t) => !t.done);
      return {
        key,
        title: by === "due" ? (late ? "Overdue" : relativeDay(key)) : by === "subject" ? key : PRIO_LABEL[key],
        sub: by === "due" ? (key && relativeDay(key) !== dayLabel(key) && !late ? dayLabel(key) : late ? dayLabel(key) : "") : `${done} of ${items.length} done`,
        late,
        color: by === "subject" ? subjectColor(key) : null,
        items,
      };
    });
  }, [visible, by]);

  const toggle = (t) => updateTask(t.id, { done: !t.done });

  return (
    <>
      <div className="cx-top">
        <div>
          <h2>My Tasks</h2>
          <p>{counts.open} open, {counts.done} done</p>
        </div>
      </div>

      <div className="cx-tools">
        <label className="cx-search">
          <Search size={16} strokeWidth={1.75} />
          <input placeholder="Search tasks or subjects" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search tasks" />
        </label>
        <div className="cx-seg" role="group" aria-label="Status">
          {[["open", "Open"], ["done", "Done"], ["all", "All"]].map(([key, label]) => (
            <button key={key} aria-pressed={status === key} onClick={() => setStatus(key)}>{label}<small>{counts[key]}</small></button>
          ))}
        </div>
        <div className="cx-seg push" role="group" aria-label="Group by">
          {GROUPS.map(([key, label]) => <button key={key} aria-pressed={by === key} onClick={() => setBy(key)}>{label}</button>)}
        </div>
      </div>

      {subjects.length > 0 && (
        <div className="cx-chips">
          <button className="cx-pill" aria-pressed={subject === "All"} onClick={() => setSubject("All")}>All subjects</button>
          {subjects.map((s) => (
            <button key={s} className="cx-pill" aria-pressed={subject === s} style={{ "--c": subjectColor(s) }} onClick={() => setSubject(s)}><i />{s}</button>
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <Empty title="Your plan is empty" text="Add your first task and choose the day you will study it.">
          <button className="btn-accent" onClick={() => openTask()}><Plus size={16} strokeWidth={2} /> Add a task</button>
        </Empty>
      )}
      {tasks.length > 0 && groups.length === 0 && <Empty title="No tasks match" text="Try a different search, or switch the filters." />}

      {groups.map((g) => (
        <section className={g.late ? "cx-group late" : "cx-group"} key={g.key || "none"}>
          <header className="cx-group-head">
            {g.color && <i className="dx-dot" style={{ "--c": g.color, width: 8, height: 8 }} />}
            <h3>{g.title}</h3>
            <span className="sub">{g.sub}</span>
            <span className="count">{g.items.length}</span>
          </header>
          <ul className="cx-list">
            {g.items.map((t) => (
              <TaskItem key={t.id} task={t} today={today} showDue={by !== "due"} onToggle={toggle} onEdit={openTask} onDelete={onDeleteTask} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
