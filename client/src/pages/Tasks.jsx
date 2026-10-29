import { useState } from "react";
import { Trash2 } from "lucide-react";
import { dayLabel, todayISO, RANK } from "../utils.js";

const empty = { title: "", subject: "", due: "", minutes: 30, priority: "medium" };

export default function Tasks({ tasks, addTask, updateTask, deleteTask }) {
  const [form, setForm] = useState(empty);
  const [subject, setSubject] = useState("All");
  const [status, setStatus] = useState("open");
  const [query, setQuery] = useState("");
  const today = todayISO();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (await addTask(form)) setForm(empty);
  };

  const subjects = [...new Set(tasks.map((t) => t.subject))];
  const visible = tasks.filter(
    (t) =>
      (subject === "All" || t.subject === subject) &&
      (status === "all" || (status === "done") === t.done) &&
      t.title.toLowerCase().includes(query.toLowerCase())
  );

  const map = {};
  visible.forEach((t) => (map[t.due] ||= []).push(t));
  Object.values(map).forEach((l) => l.sort((a, b) => a.done - b.done || RANK[a.priority] - RANK[b.priority]));
  const groups = Object.entries(map).sort(([a], [b]) => (a || "9999").localeCompare(b || "9999"));

  return (
    <>
      <form className="card form-grid" onSubmit={submit}>
        <input placeholder="What do you need to study?" value={form.title} onChange={set("title")} aria-label="Task" />
        <input list="subject-list" placeholder="Subject" value={form.subject} onChange={set("subject")} aria-label="Subject" />
        <datalist id="subject-list">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
        <input type="date" value={form.due} onChange={set("due")} aria-label="Due date" />
        <input type="number" min="5" step="5" value={form.minutes} onChange={set("minutes")} aria-label="Minutes" />
        <select value={form.priority} onChange={set("priority")} aria-label="Priority">
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
        <button>Add task</button>
      </form>

      <div className="toolbar">
        <input placeholder="Search tasks…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search tasks" />
        {["open", "done", "all"].map((s) => (
          <button key={s} className={s === status ? "chip on" : "chip"} onClick={() => setStatus(s)}>{s}</button>
        ))}
        <span className="divider" />
        {["All", ...subjects].map((s) => (
          <button key={s} className={s === subject ? "chip on" : "chip"} onClick={() => setSubject(s)}>{s}</button>
        ))}
      </div>

      {groups.length === 0 && <p className="empty">No tasks match. Add one above.</p>}
      {groups.map(([date, items]) => (
        <section className="card group" key={date || "none"}>
          <h2>{dayLabel(date)}</h2>
          {items.map((t) => (
            <div className={t.done ? "row done" : "row"} key={t.id}>
              <input type="checkbox" checked={t.done} onChange={() => updateTask(t.id, { done: !t.done })} aria-label={`Mark ${t.title} done`} />
              <span className="title">{t.title}</span>
              <span className={`badge ${t.priority}`}>{t.priority}</span>
              <span className="meta">{!t.done && t.due && t.due < today ? "Overdue · " : ""}{t.subject} · {t.minutes} min</span>
              <button className="icon-btn" onClick={() => deleteTask(t.id)} aria-label={`Delete ${t.title}`}><Trash2 size={16} /></button>
            </div>
          ))}
        </section>
      ))}
    </>
  );
}
