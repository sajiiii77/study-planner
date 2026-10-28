import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

const emptyTask = { title: "", subject: "", due: "", minutes: 30, priority: "medium" };
const emptyExam = { title: "", subject: "", date: "" };
const RANK = { high: 0, medium: 1, low: 2 };

const dayLabel = (iso) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" }) : "No due date";

const daysUntil = (iso) => Math.round((new Date(iso + "T00:00:00") - new Date().setHours(0, 0, 0, 0)) / 86400000);

export default function Planner({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [exams, setExams] = useState([]);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [examForm, setExamForm] = useState(emptyExam);
  const [subject, setSubject] = useState("All");
  const [error, setError] = useState("");

  const fail = (err) => (err.status === 401 ? onLogout() : setError(err.message));

  useEffect(() => {
    Promise.all([api("/tasks"), api("/exams")]).then(([t, e]) => { setTasks(t); setExams(e); }).catch(fail);
  }, []);

  const subjects = useMemo(() => ["All", ...new Set(tasks.map((t) => t.subject))], [tasks]);
  const visible = tasks.filter((t) => subject === "All" || t.subject === subject);

  const groups = useMemo(() => {
    const map = {};
    visible.forEach((t) => (map[t.due] ||= []).push(t));
    Object.values(map).forEach((list) => list.sort((a, b) => a.done - b.done || RANK[a.priority] - RANK[b.priority]));
    return Object.entries(map).sort(([a], [b]) => (a || "9999").localeCompare(b || "9999"));
  }, [visible]);

  const upcoming = [...exams].sort((a, b) => a.date.localeCompare(b.date));
  const done = visible.filter((t) => t.done).length;
  const minutesLeft = visible.filter((t) => !t.done).reduce((sum, t) => sum + t.minutes, 0);
  const pct = visible.length ? Math.round((done / visible.length) * 100) : 0;

  const add = (path, form, empty, setForm, list, setList) => async (e) => {
    e.preventDefault();
    try {
      const item = await api(path, { method: "POST", body: JSON.stringify(form) });
      setList([...list, item]);
      setForm(empty);
      setError("");
    } catch (err) { fail(err); }
  };

  const toggle = async (t) => {
    try {
      const updated = await api(`/tasks/${t.id}`, { method: "PATCH", body: JSON.stringify({ done: !t.done }) });
      setTasks(tasks.map((x) => (x.id === t.id ? updated : x)));
    } catch (err) { fail(err); }
  };

  const remove = (path, list, setList) => async (item) => {
    try {
      await api(`${path}/${item.id}`, { method: "DELETE" });
      setList(list.filter((x) => x.id !== item.id));
    } catch (err) { fail(err); }
  };

  const setT = (key) => (e) => setTaskForm({ ...taskForm, [key]: e.target.value });
  const setE = (key) => (e) => setExamForm({ ...examForm, [key]: e.target.value });

  return (
    <main>
      <header>
        <div className="top">
          <h1>Study planner</h1>
          <span>{user.name} <button className="link" onClick={onLogout}>Log out</button></span>
        </div>
        <p>{done} of {visible.length} tasks done · {Math.floor(minutesLeft / 60)}h {minutesLeft % 60}m left</p>
        <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${pct}%` }} /></div>
      </header>

      {error && <p className="error">{error}</p>}

      <h2>Exams</h2>
      {upcoming.length === 0 && <p className="empty">No exams yet. Add one to start the countdown.</p>}
      <div className="exams">
        {upcoming.map((x) => {
          const n = daysUntil(x.date);
          const big = n < 0 ? "Passed" : n === 0 ? "Today" : n;
          return (
            <div key={x.id} className={n >= 0 && n <= 7 ? "exam soon" : "exam"}>
              <strong>{big}</strong>
              <span>{typeof big === "number" ? (n === 1 ? "day" : "days") : ""}</span>
              <p>{x.title}</p>
              <small>{x.subject} · {dayLabel(x.date)}</small>
              <button className="x" onClick={() => remove("/exams", exams, setExams)(x)} aria-label={`Delete ${x.title}`}>Delete</button>
            </div>
          );
        })}
      </div>
      <form className="exam-form" onSubmit={add("/exams", examForm, emptyExam, setExamForm, exams, setExams)}>
        <input placeholder="Exam name (e.g. Midterm)" value={examForm.title} onChange={setE("title")} aria-label="Exam name" />
        <input placeholder="Subject" value={examForm.subject} onChange={setE("subject")} aria-label="Exam subject" />
        <input type="date" value={examForm.date} onChange={setE("date")} aria-label="Exam date" />
        <button>Add exam</button>
      </form>

      <h2>Tasks</h2>
      <form className="task-form" onSubmit={add("/tasks", taskForm, emptyTask, setTaskForm, tasks, setTasks)}>
        <input placeholder="What do you need to study?" value={taskForm.title} onChange={setT("title")} aria-label="Task" />
        <input placeholder="Subject" value={taskForm.subject} onChange={setT("subject")} aria-label="Subject" />
        <input type="date" value={taskForm.due} onChange={setT("due")} aria-label="Due date" />
        <input type="number" min="5" step="5" value={taskForm.minutes} onChange={setT("minutes")} aria-label="Minutes" />
        <select value={taskForm.priority} onChange={setT("priority")} aria-label="Priority">
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
        <button>Add task</button>
      </form>

      <nav aria-label="Filter by subject">
        {subjects.map((s) => (
          <button key={s} className={s === subject ? "chip on" : "chip"} onClick={() => setSubject(s)}>{s}</button>
        ))}
      </nav>

      {groups.length === 0 && <p className="empty">Nothing planned yet. Add your first task above.</p>}
      {groups.map(([date, items]) => (
        <section key={date || "none"}>
          <h3>{dayLabel(date)}</h3>
          <ul>
            {items.map((t) => (
              <li key={t.id} className={t.done ? "done" : ""}>
                <input type="checkbox" checked={t.done} onChange={() => toggle(t)} aria-label={`Mark ${t.title} done`} />
                <span className="title">{t.title}</span>
                <span className={`badge ${t.priority}`}>{t.priority}</span>
                <span className="meta">{t.subject} · {t.minutes} min</span>
                <button className="x" onClick={() => remove("/tasks", tasks, setTasks)(t)} aria-label={`Delete ${t.title}`}>Delete</button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
